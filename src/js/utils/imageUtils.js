// Image utilities - compression, OCR with Tesseract.js, and processing
import Tesseract from 'tesseract.js';

// OCR worker instance (reusable for better performance)
let ocrWorker = null;

// Compress image before upload
export async function compressImage(file, options = {}) {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8,
        format = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create new file with compressed data
                        const compressedFile = new File([blob], file.name, {
                            type: format,
                            lastModified: Date.now()
                        });

                        console.log(`📷 Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB`);
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                format,
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

// Strip EXIF data for privacy
export async function stripExifData(file) {
    // Re-encode image to remove EXIF
    return compressImage(file, { quality: 0.95 });
}

// Initialize OCR worker (call once at app start for faster subsequent OCR)
export async function initOCRWorker(onProgress = null) {
    if (ocrWorker) return ocrWorker;

    console.log('🔤 Initializing Tesseract.js OCR worker...');

    ocrWorker = await Tesseract.createWorker('por', 1, {
        logger: (info) => {
            if (onProgress && info.status === 'recognizing text') {
                onProgress(info.progress);
            }
            console.log(`[OCR] ${info.status}: ${(info.progress * 100).toFixed(0)}%`);
        }
    });

    console.log('✅ OCR worker ready');
    return ocrWorker;
}

// Terminate OCR worker (call on app cleanup)
export async function terminateOCRWorker() {
    if (ocrWorker) {
        await ocrWorker.terminate();
        ocrWorker = null;
        console.log('🔤 OCR worker terminated');
    }
}

// OCR - Extract text from receipt/price tag image using Tesseract.js
export async function extractPriceFromImage(file, onProgress = null) {
    console.log('📸 Starting OCR extraction...');
    const startTime = Date.now();

    try {
        // Preprocess image for better OCR results
        const processedImage = await preprocessImageForOCR(file);

        // Initialize worker if needed
        const worker = await initOCRWorker(onProgress);

        // Run OCR
        const result = await worker.recognize(processedImage);
        const rawText = result.data.text;

        console.log(`✅ OCR completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
        console.log('📄 Extracted text:', rawText);

        // Parse extracted text line by line to keep context
        const items = extractReceiptItems(rawText);
        const storeInfo = extractStoreFromText(rawText);

        return {
            success: true,
            confidence: result.data.confidence / 100,
            extracted: {
                prices: items.map(i => ({ value: i.price, confidence: i.confidence })), // legacy support
                products: items.map(i => ({ text: i.product, quantity: i.quantity, unit: i.unit })), // legacy support
                items: items, // New better structure
                store: storeInfo
            },
            rawText,
            processingTime: Date.now() - startTime
        };
    } catch (error) {
        console.error('❌ OCR failed:', error);
        return {
            success: false,
            error: error.message,
            confidence: 0,
            extracted: { prices: [], products: [], items: [], store: null },
            rawText: ''
        };
    }
}

// Preprocess image for better OCR accuracy
async function preprocessImageForOCR(file) {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Increase contrast
        const contrast = 1.5;
        const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));
        const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

        // Threshold for cleaner text
        const threshold = newGray > 127 ? 255 : 0;

        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/png' }));
        }, 'image/png');
    });
}

// Load image as HTML Image element
function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// STRICT RECEIPT PARSING STRATEGY
// Looks for lines that have a price at the end, and treats the start as product name
function extractReceiptItems(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    const items = [];

    // Regex for price at the end of line, allowing for some trailing non-digit noise (like ')' or 'A')
    // Matches: "Arroz 5kg  12,99 )" or "10,00 A"
    const priceEndPattern = /(\d{1,3}[.,]\d{2})\s*[^\d]*$/;
    
    // Regex to ignore validation lines
    const ignorePattern = /TOTAL|SUBTOTAL|TROCO|DINHEIRO|CARTAO|CREDITO|DEBITO|VALOR|ITENS|CNPJ|CPF|DATA|QTD|UN|VL|UNIT|IMPOSTOS/i;

    lines.forEach(line => {
        const cleanLine = line.trim();
        
        // Skip noise lines
        if (ignorePattern.test(cleanLine)) return;
        
        // Check if line ends with a price
        const priceMatch = cleanLine.match(priceEndPattern);
        
        if (priceMatch) {
            const priceStr = priceMatch[1].replace(',', '.');
            const price = parseFloat(priceStr);
            
            // Basic sanity check for price
            if (isNaN(price) || price <= 0 || price > 5000) return;
            
            // Extract product name (everything before the price)
            let productName = cleanLine.substring(0, priceMatch.index).trim();
            
            // Clean up common receipt noise often found in product names
            // Remove leading numbers/codes (e.g. "001 123456 PRODUCT")
            // Repeatedly remove leading digits followed by space
            productName = productName.replace(/^[\d\s]+/, '');
            
            // Extract quantity if present inside the name part (e.g. "2x" or "2 UN")
            // This is simple extraction, might not catch "2 x 5,00" format perfectly but covers basics
            let quantity = 1;
            const qtyMatch = productName.match(/(\d+)\s*(?:UN|X|CX|PC)/i);
            if (qtyMatch) {
                quantity = parseInt(qtyMatch[1]);
            }

            // Remove code patterns like (12345)
            productName = productName.replace(/\(\d+\)/, '').trim();
            
            // Remove tax codes at end (e.g. F1, T17,00%) which often appear before price
            productName = productName.replace(/\s+[A-Z]\d{1,2}(?:,\d+%)?\s*$/i, '').trim();

            // If name is too short after cleaning, it's likely noise
            if (productName.length < 3) return;

            items.push({
                product: productName,
                price: price,
                quantity: quantity,
                confidence: 0.8 // Heuristic confidence
            });
        }
    });

    return items;
}

// Legacy adapters (can be removed if not used elsewhere, but kept for safety)
export function extractPricesFromText(text) { return []; }
function extractProductsFromText(text) { return []; }

// Extract store information from text
function extractStoreFromText(text) {
    const lines = text.split('\n').filter(l => l.trim());

    // Look for CNPJ
    const cnpjMatch = text.match(/CNPJ\s*:?\s*(\d{2}[\.\s]?\d{3}[\.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2})/i);

    // First few lines usually contain store name
    const possibleName = lines.slice(0, 3).find(l => {
        const line = l.trim();
        return line.length >= 3 &&
            line.length <= 50 &&
            !line.match(/CNPJ|CPF|SAT|CUPOM|FISCAL/i);
    });

    return {
        name: possibleName || null,
        cnpj: cnpjMatch ? cnpjMatch[1] : null,
        confidence: cnpjMatch ? 0.9 : (possibleName ? 0.6 : 0)
    };
}

// Quick OCR for single price extraction (optimized for speed)
export async function quickPriceOCR(imageFile) {
    // Use simpler settings for faster processing
    const result = await Tesseract.recognize(imageFile, 'por', {
        tessedit_char_whitelist: '0123456789,.$R ',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE
    });

    const prices = extractPricesFromText(result.data.text);
    return prices.length > 0 ? prices[0] : null;
}

// Blur sensitive areas (faces, card numbers) - simplified version
export async function blurSensitiveAreas(file) {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Look for card number patterns in the image using OCR
    // For now, just blur the bottom portion where card numbers often appear
    const bottomHeight = Math.min(100, img.height * 0.2);

    // Apply blur to bottom portion
    ctx.filter = 'blur(10px)';
    ctx.drawImage(
        canvas,
        0, img.height - bottomHeight, img.width, bottomHeight,
        0, img.height - bottomHeight, img.width, bottomHeight
    );
    ctx.filter = 'none';

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.9);
    });
}

// Generate thumbnail
export async function generateThumbnail(file, size = 150) {
    return compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7
    });
}

// Convert file to base64
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Validate image file
export function validateImageFile(file, options = {}) {
    const {
        maxSizeMB = 10,
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    } = options;

    const errors = [];

    if (!allowedTypes.includes(file.type)) {
        errors.push(`Tipo de arquivo não suportado: ${file.type}`);
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
        errors.push(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)}MB (máx: ${maxSizeMB}MB)`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
