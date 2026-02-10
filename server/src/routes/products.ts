import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Search the Product catalog for autocomplete in report modal
 * Returns ALL matching products from the catalog (not filtered by prices)
 * GET /api/products/catalog?q=arroz
 */
router.get('/catalog', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { q, limit = '15' } = req.query;

        if (!q || (q as string).length < 1) {
            return res.status(400).json({ error: 'Query é obrigatória' });
        }

        const searchTerm = (q as string).toLowerCase();
        const pageSize = Math.min(30, parseInt(limit as string) || 15);

        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { aliases: { hasSome: [searchTerm] } },
                    { brand: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                category: true,
                brand: true,
                unit: true,
                size: true,
                imageUrl: true
            },
            take: pageSize,
            orderBy: { name: 'asc' }
        });

        return res.json(products);
    } catch (error) {
        console.error('Product catalog search error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Search products across all stores
 * GET /api/products/search?q=arroz
 */
router.get('/search', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { q, category, limit = '20' } = req.query;

        if (!q || (q as string).length < 2) {
            return res.status(400).json({ error: 'Query deve ter pelo menos 2 caracteres' });
        }

        const searchTerm = (q as string).toLowerCase();
        const pageSize = Math.min(50, parseInt(limit as string) || 20);

        // Search in Product catalog
        const catalogProducts = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { aliases: { hasSome: [searchTerm] } }
                ],
                ...(category && category !== 'all' ? { category: category as string } : {})
            },
            take: pageSize
        });

        // Search in actual prices (for products not in catalog)
        const priceProducts = await prisma.price.groupBy({
            by: ['product'],
            where: {
                product: { contains: searchTerm, mode: 'insensitive' }
            },
            _count: { id: true },
            _min: { price: true },
            _max: { price: true },
            orderBy: { _count: { id: 'desc' } },
            take: pageSize
        });

        // Merge results
        const productNames = new Set(catalogProducts.map(p => p.name.toLowerCase()));

        const additionalProducts = priceProducts
            .filter(p => !productNames.has(p.product.toLowerCase()))
            .map(p => ({
                name: p.product,
                priceCount: p._count.id,
                minPrice: p._min.price,
                maxPrice: p._max.price,
                fromPrices: true
            }));

        return res.json({
            catalog: catalogProducts,
            fromPrices: additionalProducts,
            total: catalogProducts.length + additionalProducts.length
        });

    } catch (error) {
        console.error('Product search error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get price comparison for a product
 * GET /api/products/compare?product=Arroz%20Tio%20João
 */
router.get('/compare', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { product, lat, lng } = req.query;

        if (!product) {
            return res.status(400).json({ error: 'Nome do produto é obrigatório' });
        }

        const prices = await prisma.price.findMany({
            where: {
                product: { contains: product as string, mode: 'insensitive' }
            },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        lat: true,
                        lng: true,
                        address: true,
                        openingHours: true
                    }
                },
                reporter: {
                    select: { id: true, name: true, avatar: true, accuracyScore: true }
                }
            },
            orderBy: { price: 'asc' },
            take: 50
        });

        // Group by store, keeping lowest price per store
        const storeMap = new Map();
        for (const price of prices) {
            if (!storeMap.has(price.storeId) || storeMap.get(price.storeId).price > price.price) {
                storeMap.set(price.storeId, price);
            }
        }

        const comparison = Array.from(storeMap.values()).sort((a, b) => a.price - b.price);

        // Calculate stats
        const allPrices = comparison.map(c => c.price);
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;

        return res.json({
            product: product as string,
            comparison,
            stats: {
                storeCount: comparison.length,
                minPrice,
                maxPrice,
                avgPrice: Math.round(avgPrice * 100) / 100,
                savings: maxPrice - minPrice,
                savingsPercent: Math.round(((maxPrice - minPrice) / maxPrice) * 100)
            }
        });

    } catch (error) {
        console.error('Product comparison error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get or create a product in catalog
 * POST /api/products
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { name, category, unit, aliases, barcode } = req.body;

        if (!name || name.length < 2) {
            return res.status(400).json({ error: 'Nome do produto é obrigatório' });
        }

        const product = await prisma.product.upsert({
            where: { name: name.trim() },
            create: {
                name: name.trim(),
                category: category || 'outros',
                unit: unit || 'un',
                aliases: aliases || [],
                barcode: barcode || null
            },
            update: {
                category: category || undefined,
                aliases: aliases || undefined,
                barcode: barcode || undefined
            }
        });

        return res.status(201).json(product);

    } catch (error) {
        console.error('Create product error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
