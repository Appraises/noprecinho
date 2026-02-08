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
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    const items: Array<{ product: string, price: number, quantity: number, totalPrice: number }> = [];
    const seenProducts = new Set<string>();

    // Patterns to ignore
    const ignorePattern = /^(?:TOTAL|SUBTOTAL|TROCO|DINHEIRO|CART[AÃ]O|CREDITO|DEBITO|VALOR\s*(?:TOTAL|PAGO)?|ITENS?|CNPJ|CPF|DATA|QTD|QUANTIDADE|VL\s*UNIT|IMPOSTOS?|DESCONTO|ACRESCIMO|SAT|NFCe|CUPOM|FISCAL|TRIBUT|TEF|ENVIE|SMS)/i;

    // Price patterns
    const pricePatterns = [
        /(\d{1,4}[.,]\d{2})\s*\)\s*$/,
        /(\d{1,4}[.,]\d{2})\s*(?:\)|[A-Z]{1,2})?\s*$/i,
        /R\$\s*(\d{1,4}[.,]\d{2})/i,
        /\b(\d{1,4}[.,]\d{2})\b(?!%)/
    ];

    for (const line of lines) {
        const cleanLine = line.trim();

        if (cleanLine.length < 5) continue;
        if (ignorePattern.test(cleanLine)) continue;

        // Skip lines that are mostly numbers
        const numericRatio = (cleanLine.match(/\d/g) || []).length / cleanLine.length;
        if (numericRatio > 0.7 && cleanLine.length < 15) continue;

        let priceFound: number | null = null;
        let priceIndex = -1;

        // Find price
        for (const pattern of pricePatterns) {
            const match = cleanLine.match(pattern);
            if (match) {
                const priceStr = match[1].replace(',', '.');
                const price = parseFloat(priceStr);
                if (!isNaN(price) && price > 0.01 && price < 10000) {
                    priceFound = price;
                    priceIndex = match.index || 0;
                    break;
                }
            }
        }

        if (priceFound === null) continue;

        // Extract product name
        let productName = cleanLine.substring(0, priceIndex).trim();

        // Clean up product name
        productName = productName
            .replace(/^[\dOo]{1,4}\s+/, '')           // Remove leading line numbers
            .replace(/^[A-Z\d]{6,}\s+/i, '')          // Remove product codes
            .replace(/\s*\d*\s*(?:[JjLlIi1]?[Uu][Nn]|[Uu][Nn])\s*/gi, ' ')  // Remove unit indicators
            .replace(/\s*[Ff][1IiEe]?\s*$/g, '')      // Remove F1, Fi, FE
            .replace(/\s*[A-Z]?\d{1,2}[.,]\d{2}%\s*/g, ' ')  // Remove tax percentages
            .replace(/\s+[A-Z]{1,2}$/g, '')           // Remove trailing single letters
            .replace(/[\(\)\[\]]/g, '')               // Remove brackets
            .replace(/\s+/g, ' ')                     // Clean spaces
            .trim();

        if (productName.length < 2) continue;

        // Extract quantity from original line
        let quantity = 1;
        const qtyMatch = cleanLine.match(/(\d+)\s*(?:un|UN|[Uu][Nn])/);
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1]) || 1;
        }

        // Calculate unit price
        const unitPrice = quantity > 1
            ? Math.round((priceFound / quantity) * 100) / 100
            : priceFound;

        // Check duplicates
        const normalizedName = productName.toUpperCase();
        const duplicateKey = `${normalizedName}_${unitPrice.toFixed(2)}`;
        if (seenProducts.has(duplicateKey)) continue;
        seenProducts.add(duplicateKey);

        items.push({
            product: productName,
            price: unitPrice,
            totalPrice: priceFound,
            quantity: quantity
        });
    }

    return items;
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
