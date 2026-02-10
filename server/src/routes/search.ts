import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Search suggestions for products, stores, and addresses
 * GET /api/search/suggestions?q=...
 */
router.get('/suggestions', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { q, limit = '10' } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json({ products: [], stores: [], recent: [] });
        }

        const searchTerm = q.trim();
        const maxResults = Math.min(parseInt(limit as string) || 10, 20);

        // Search products - only those that have at least one price entry
        const allMatchingProducts = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { aliases: { has: searchTerm.toLowerCase() } },
                    { brand: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                category: true,
                brand: true,
                imageUrl: true
            },
            take: maxResults * 3 // Fetch more to compensate for filtering
        });

        // Filter to only products that have actual price entries
        let products = allMatchingProducts;
        if (allMatchingProducts.length > 0) {
            const productNames = allMatchingProducts.map(p => p.name);
            const existingPrices = await prisma.price.findMany({
                where: {
                    product: { in: productNames, mode: 'insensitive' }
                },
                select: { product: true },
                distinct: ['product']
            });
            const priceProductNames = new Set(existingPrices.map(p => p.product.toLowerCase()));
            products = allMatchingProducts
                .filter(p => priceProductNames.has(p.name.toLowerCase()))
                .slice(0, maxResults);
        }

        // Search stores
        const stores = await prisma.store.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { address: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                category: true,
                address: true,
                lat: true,
                lng: true
            },
            take: maxResults
        });

        // Search recent prices (product names that exist in prices but not in Product catalog)
        const recentPrices = await prisma.price.findMany({
            where: {
                product: { contains: searchTerm, mode: 'insensitive' }
            },
            select: {
                product: true
            },
            distinct: ['product'],
            take: maxResults
        });

        // Extract unique product names not in Product catalog
        const productNames = new Set(products.map(p => p.name.toLowerCase()));
        const recentProducts = recentPrices
            .map(p => p.product)
            .filter(name => !productNames.has(name.toLowerCase()))
            .slice(0, 5);

        return res.json({
            products: products.map(p => ({
                type: 'product',
                id: p.id,
                name: p.name,
                category: p.category,
                brand: p.brand,
                imageUrl: p.imageUrl
            })),
            stores: stores.map(s => ({
                type: 'store',
                id: s.id,
                name: s.name,
                category: s.category,
                address: s.address,
                lat: s.lat,
                lng: s.lng
            })),
            recent: recentProducts.map(name => ({
                type: 'recent',
                name
            }))
        });
    } catch (error) {
        console.error('Search suggestions error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Full search with prices
 * GET /api/search?q=...
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { q, category, limit = '20', page = '1' } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json({ results: [], total: 0 });
        }

        const searchTerm = q.trim();
        const take = Math.min(parseInt(limit as string) || 20, 50);
        const skip = (parseInt(page as string) - 1) * take;

        const whereClause: any = {
            product: { contains: searchTerm, mode: 'insensitive' }
        };

        if (category && category !== 'all') {
            whereClause.store = { category: category as string };
        }

        const [prices, total] = await Promise.all([
            prisma.price.findMany({
                where: whereClause,
                include: {
                    store: {
                        select: { id: true, name: true, category: true, address: true, lat: true, lng: true }
                    },
                    reporter: {
                        select: { name: true, accuracyScore: true }
                    }
                },
                orderBy: { price: 'asc' },
                take,
                skip
            }),
            prisma.price.count({ where: whereClause })
        ]);

        return res.json({
            results: prices.map(p => ({
                ...p,
                // Add freshness calculation
                freshness: calculateFreshness(p.createdAt)
            })),
            total,
            page: parseInt(page as string),
            totalPages: Math.ceil(total / take)
        });
    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Calculate price freshness
 */
function calculateFreshness(createdAt: Date): 'fresh' | 'warning' | 'stale' {
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays <= 7) return 'fresh';
    if (diffDays <= 14) return 'warning';
    return 'stale';
}

export default router;
