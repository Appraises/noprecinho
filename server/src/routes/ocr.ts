// OCR routes using Google Cloud Vision API
import express from 'express';
import vision from '@google-cloud/vision';

const router = express.Router();

// Initialize Google Cloud Vision client
let visionClient: vision.ImageAnnotatorClient | null = null;

function getVisionClient() {
    if (visionClient) return visionClient;

    // Check for credentials
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJson) {
        console.warn('⚠️ GOOGLE_APPLICATION_CREDENTIALS_JSON not set - OCR will be unavailable');
        return null;
    }

    try {
        const credentials = JSON.parse(credentialsJson);
        visionClient = new vision.ImageAnnotatorClient({
            credentials: credentials
        });
        console.log('✅ Google Cloud Vision client initialized');
        return visionClient;
    } catch (error) {
        console.error('❌ Failed to initialize Vision client:', error);
        return null;
    }
}

// POST /ocr - Extract text from image
router.post('/', async (req, res) => {
    try {
        const client = getVisionClient();

        if (!client) {
            return res.status(503).json({
                success: false,
                error: 'OCR service unavailable - Google Vision credentials not configured'
            });
        }

        // Expect base64 image in body
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({
                success: false,
                error: 'No image provided. Send base64 image in "image" field'
            });
        }

        // Remove data URL prefix if present
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

        console.log('🔍 Processing OCR request...');
        const startTime = Date.now();

        // Call Google Vision API
        const [result] = await client.textDetection({
            image: { content: base64Data }
        });

        const fullText = result.fullTextAnnotation?.text || '';
        const textAnnotations = result.textAnnotations || [];

        console.log(`✅ OCR completed in ${Date.now() - startTime}ms`);

        // Parse the extracted text for receipt items
        const items = parseReceiptText(fullText);

        return res.json({
            success: true,
            rawText: fullText,
            items: items,
            confidence: textAnnotations[0]?.confidence || 0.95,
            processingTime: Date.now() - startTime
        });

    } catch (error: any) {
        console.error('❌ OCR error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'OCR processing failed'
        });
    }
});

// Parse receipt text to extract product names and prices
function parseReceiptText(text: string): Array<{ product: string, price: number, quantity: number, totalPrice: number }> {
    console.log('📝 Parsing receipt text:', text.substring(0, 300) + '...');

    const lines = text.split('\n').filter(l => l.trim().length > 0);

    // Detect column-separated pattern: products listed first, then prices separately
    const productLines: Array<{ lineNum: number, name: string }> = [];
    const priceLines: Array<{ qty: number, price: number }> = [];

    // Pattern for product lines: "001 08871124 PRODUCT NAME" or "00N CODE PRODUCT"
    const productPattern = /^0*(\d{1,3})\s+[\dA-Za-z]{6,12}\s+(.+)$/;
    // Pattern for price lines: "1un F1 10,39)" or "lun T19,00% 6,99)"
    const pricePattern = /^[1liI]?\s*[uU][nN]\s*(?:[FfTt][1IiEe]?)?(?:\d{1,2}[.,]\d{2}%)?\s*(\d{1,4}[.,]\d{2})\s*\)?$/;

    // First pass: identify product and price lines
    for (const line of lines) {
        const trimmed = line.trim();

        const productMatch = trimmed.match(productPattern);
        if (productMatch) {
            productLines.push({
                lineNum: parseInt(productMatch[1]),
                name: productMatch[2].trim()
            });
            continue;
        }

        const priceMatch = trimmed.match(pricePattern);
        if (priceMatch) {
            priceLines.push({
                qty: 1,
                price: parseFloat(priceMatch[1].replace(',', '.'))
            });
        }
    }

    console.log(`📋 Found ${productLines.length} product lines, ${priceLines.length} price lines`);

    const items: Array<{ product: string, price: number, quantity: number, totalPrice: number }> = [];
    const seenProducts = new Set<string>();

    // Check if we have column separation (matching counts or close)
    if (productLines.length > 0 && priceLines.length > 0 &&
        Math.abs(productLines.length - priceLines.length) <= 2) {

        console.log('📊 Detected column-separated receipt format - matching by order');

        // Match products with prices by order
        const minLen = Math.min(productLines.length, priceLines.length);

        for (let i = 0; i < minLen; i++) {
            const product = productLines[i];
            const priceInfo = priceLines[i];

            let productName = cleanProductName(product.name);

            if (!productName || productName.length < 2) continue;
            if (priceInfo.price < 0.01 || priceInfo.price > 10000) continue;

            // Check duplicates
            const duplicateKey = `${productName.toUpperCase()}_${priceInfo.price.toFixed(2)}`;
            if (seenProducts.has(duplicateKey)) continue;
            seenProducts.add(duplicateKey);

            console.log(`✅ Matched: "${productName}" - R$${priceInfo.price.toFixed(2)}`);

            items.push({
                product: productName,
                price: priceInfo.price,
                totalPrice: priceInfo.price,
                quantity: 1
            });
        }
    } else {
        // Fallback to single-line extraction strategy
        console.log('📋 Using single-line extraction strategy');

        for (const line of lines) {
            const extracted = extractProductAndPrice(line.trim());
            if (!extracted) continue;

            const { productName, price, quantity } = extracted;
            const unitPrice = quantity > 1
                ? Math.round((price / quantity) * 100) / 100
                : price;

            const duplicateKey = `${productName.toUpperCase()}_${unitPrice.toFixed(2)}`;
            if (seenProducts.has(duplicateKey)) continue;
            seenProducts.add(duplicateKey);

            console.log(`✅ Extracted: "${productName}" - R$${unitPrice}`);

            items.push({
                product: productName,
                price: unitPrice,
                totalPrice: price,
                quantity: quantity
            });
        }
    }

    console.log(`📋 Total items extracted: ${items.length}`);
    return items;
}

// Extract product and price from a single line (fallback strategy)
function extractProductAndPrice(line: string): { productName: string, price: number, quantity: number } | null {
    // Strategy 1: Brazilian receipt format "001 08871124 PRODUCT NAME 1un F1 10,39)"
    const brazilPattern = /^[\dOo]{1,3}\s+[\dA-Z]{6,10}\s+(.+?)\s+(\d+)\s*(?:un|UN)\s*[Ff][1IiEe]?\s*(\d{1,4}[.,]\d{2})\s*\)?$/i;
    let match = line.match(brazilPattern);
    if (match) {
        const productName = cleanProductName(match[1]);
        const quantity = parseInt(match[2]) || 1;
        const price = parseFloat(match[3].replace(',', '.'));
        if (productName && !isNaN(price) && price > 0.01 && price < 10000) {
            return { productName, price, quantity };
        }
    }

    // Strategy 2: Simplified "CODE PRODUCT PRICE" format
    const simplePattern = /^[\dOo]{1,3}\s+[\dA-Z]{6,10}\s+(.+?)\s+(\d{1,4}[.,]\d{2})\s*\)?$/i;
    match = line.match(simplePattern);
    if (match) {
        let productName = match[1];
        let quantity = 1;
        const qtyMatch = productName.match(/\s+(\d+)\s*(?:un|UN)\s*[Ff]?[1IiEe]?\s*$/i);
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1]) || 1;
            productName = productName.replace(qtyMatch[0], '');
        }
        productName = cleanProductName(productName);
        const price = parseFloat(match[2].replace(',', '.'));
        if (productName && !isNaN(price) && price > 0.01 && price < 10000) {
            return { productName, price, quantity };
        }
    }

    // Strategy 3: Any line with clear price at end
    const anyPricePattern = /(.+?)\s+(\d{1,4}[.,]\d{2})\s*\)?$/;
    match = line.match(anyPricePattern);
    if (match) {
        let productName = match[1];
        if (/^[\d\s]{10,}$/.test(productName)) return null;

        let quantity = 1;
        const qtyMatch = productName.match(/\s+(\d+)\s*(?:un|UN)/i);
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1]) || 1;
            productName = productName.replace(qtyMatch[0], ' ');
        }

        productName = cleanProductName(productName);
        const price = parseFloat(match[2].replace(',', '.'));

        if (!productName || productName.length < 2) return null;
        if (isNaN(price) || price < 0.01 || price > 10000) return null;

        return { productName, price, quantity };
    }

    return null;
}

// Clean up product name
function cleanProductName(name: string): string {
    return name
        .replace(/^[\dOo]{1,4}\s+/, '')              // Remove leading line numbers
        .replace(/^[A-Z\d]{6,}\s+/i, '')             // Remove product codes
        .replace(/\s*\d*\s*(?:[JjLlIi1]?[Uu][Nn]|[Uu][Nn])\s*/gi, ' ')  // Remove unit indicators
        .replace(/\s*[Ff][1IiEe]?\s*$/g, '')         // Remove F1, Fi, FE
        .replace(/\s*[A-Z]?\d{1,2}[.,]\d{2}%\s*/g, ' ')  // Remove tax percentages
        .replace(/\s+[A-Z]{1,2}$/g, '')              // Remove trailing single letters
        .replace(/[\(\)\[\]]/g, '')                  // Remove brackets
        .replace(/\s+/g, ' ')                        // Clean spaces
        .trim();
}

// GET /ocr/status - Check if OCR is available
router.get('/status', (req, res) => {
    const hasCredentials = !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const client = getVisionClient();

    return res.json({
        available: hasCredentials && !!client,
        provider: 'google-cloud-vision',
        hasCredentials: hasCredentials
    });
});

export default router;
