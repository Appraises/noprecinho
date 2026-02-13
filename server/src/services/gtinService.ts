// GTIN API Service - Product lookup by barcode
// Uses gtin.rscsistemas.com.br (free tier: 20 req/min)

interface GTINProduct {
    ean: string;
    ean_type: string;
    ncm: string;
    name: string;
    brand: string;
    country: string;
    category: string;
    photo_url?: string;
}

interface ProductInfo {
    barcode: string;
    name: string;
    brand: string | null;
    category: string | null;
    imageUrl: string | null;
    source: 'local' | 'gtin-api';
}

const GTIN_API_BASE = 'https://gtin.rscsistemas.com.br/api/v1';

/**
 * Lookup a product by GTIN/EAN barcode using external API
 * Rate limit: 20 requests per minute (free tier)
 */
export async function lookupGTIN(barcode: string): Promise<ProductInfo | null> {
    // Validate barcode format (EAN-13 or EAN-8)
    const cleanBarcode = barcode.replace(/\D/g, '');

    if (cleanBarcode.length !== 13 && cleanBarcode.length !== 8) {
        console.log(`⚠️ Invalid barcode format: ${barcode}`);
        return null;
    }

    try {
        console.log(`🔍 Looking up GTIN: ${cleanBarcode}`);

        const response = await fetch(`${GTIN_API_BASE}/product/${cleanBarcode}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'NoPrecinho/1.0'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`📭 Product not found in GTIN API: ${cleanBarcode}`);
                return null;
            }
            console.error(`❌ GTIN API error: ${response.status}`);
            return null;
        }

        const data: GTINProduct = await response.json();

        console.log(`✅ Found product: ${data.name}`);

        return {
            barcode: cleanBarcode,
            name: data.name || 'Produto desconhecido',
            brand: data.brand || null,
            category: mapGTINCategory(data.category),
            imageUrl: data.photo_url || null,
            source: 'gtin-api'
        };

    } catch (error) {
        console.error('❌ GTIN lookup error:', error);
        return null;
    }
}

/**
 * Map GTIN API category to our categories
 */
function mapGTINCategory(gtinCategory: string | null): string {
    if (!gtinCategory) return 'outros';

    const categoryLower = gtinCategory.toLowerCase();

    // Food & beverages → mercado
    if (categoryLower.includes('aliment') ||
        categoryLower.includes('bebid') ||
        categoryLower.includes('latic') ||
        categoryLower.includes('carn') ||
        categoryLower.includes('horta')) {
        return 'mercado';
    }

    // Pharmacy
    if (categoryLower.includes('farm') ||
        categoryLower.includes('medic') ||
        categoryLower.includes('saúde') ||
        categoryLower.includes('saude')) {
        return 'farmacia';
    }

    // Pet
    if (categoryLower.includes('pet') ||
        categoryLower.includes('animal') ||
        categoryLower.includes('ração')) {
        return 'pet';
    }

    // Fruits & vegetables
    if (categoryLower.includes('frut') ||
        categoryLower.includes('hortifrut') ||
        categoryLower.includes('verdur')) {
        return 'hortifruti';
    }

    return 'outros';
}

/**
 * Validate EAN/GTIN checksum
 */
export function validateEAN(barcode: string): boolean {
    const cleanBarcode = barcode.replace(/\D/g, '');

    if (cleanBarcode.length !== 13 && cleanBarcode.length !== 8) {
        return false;
    }

    const digits = cleanBarcode.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    const multipliers = cleanBarcode.length === 13
        ? [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
        : [3, 1, 3, 1, 3, 1, 3];

    for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * multipliers[i];
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
}
