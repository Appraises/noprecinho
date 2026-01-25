import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Default pagination settings
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const PHOTO_REQUIRED_THRESHOLD = 5; // Users need 5 approved prices before photo is optional

// Helper: Calculate price freshness
function calculateFreshness(createdAt: Date): 'fresh' | 'warning' | 'stale' {
    const now = new Date();
    const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) return 'fresh';
    if (diffDays <= 14) return 'warning';
    return 'stale';
}

// Get all prices (with optional filters and pagination)
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const {
            category,
            storeId,
            product,
            freshOnly,
            verifiedOnly,
            sortBy = 'price',
            page = '1',
            limit = String(DEFAULT_PAGE_SIZE)
        } = req.query;

        // Parse pagination
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit as string) || DEFAULT_PAGE_SIZE));
        const skip = (pageNum - 1) * pageSize;

        const where: any = {};


        if (storeId) {
            where.storeId = storeId as string;
        }

        if (category && category !== 'all') {
            const categories = (category as string).split(',');
            if (categories.length > 1) {
                where.store = {
                    category: { in: categories }
                };
            } else {
                where.store = {
                    category: categories[0]
                };
            }
        }

        if (product) {
            where.product = {
                contains: product as string,
                mode: 'insensitive',
            };
        }

        // Fresh only = last 48 hours
        if (freshOnly === 'true') {
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
            where.createdAt = { gte: cutoff };
        }

        if (verifiedOnly === 'true') {
            where.hasPhoto = true;
        }

        // Filter by store category if provided
        if (category && category !== 'all') {
            where.store = {
                category: category as string,
            };
        }

        type OrderByField = 'price' | 'createdAt' | 'votes';
        type OrderByDirection = 'asc' | 'desc';

        let orderBy: { [key in OrderByField]?: OrderByDirection } = { price: 'asc' };

        switch (sortBy) {
            case 'recency':
                orderBy = { createdAt: 'desc' };
                break;
            case 'trust':
                orderBy = { votes: 'desc' };
                break;
            case 'price':
            default:
                orderBy = { price: 'asc' };
        }

        // Get total count for pagination info
        const total = await prisma.price.count({ where });

        const prices = await prisma.price.findMany({
            where,
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                        address: true,
                        lat: true,
                        lng: true,
                    },
                },
                reporter: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
            },
            orderBy,
            skip,
            take: pageSize,
        });

        // Add freshness to each price
        const pricesWithFreshness = prices.map(p => ({
            ...p,
            freshness: calculateFreshness(p.createdAt),
            daysSinceUpdate: Math.floor((Date.now() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        }));

        return res.json({
            data: pricesWithFreshness,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total,
                pages: Math.ceil(total / pageSize),
                hasMore: skip + prices.length < total,
            }
        });
    } catch (error) {
        console.error('Get prices error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Create new price (requires auth)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { storeId, product, price, unit, hasPhoto, photoUrl } = req.body;

        // Input validation
        if (!storeId || typeof storeId !== 'string') {
            return res.status(400).json({ error: 'storeId é obrigatório' });
        }

        if (!product || typeof product !== 'string' || product.length > 200) {
            return res.status(400).json({ error: 'Produto inválido (máximo 200 caracteres)' });
        }

        if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).json({ error: 'Preço inválido' });
        }

        if (!unit || typeof unit !== 'string' || unit.length > 20) {
            return res.status(400).json({ error: 'Unidade inválida' });
        }

        // Check if photo is required for this user
        const reporter = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { priceReportsCount: true }
        });

        const needsPhoto = (reporter?.priceReportsCount || 0) < PHOTO_REQUIRED_THRESHOLD;
        if (needsPhoto && !hasPhoto) {
            return res.status(400).json({
                error: 'Foto obrigatória para novos colaboradores',
                requiresPhoto: true,
                reportsUntilOptional: PHOTO_REQUIRED_THRESHOLD - (reporter?.priceReportsCount || 0)
            });
        }

        // Verify store exists
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        const newPrice = await prisma.price.create({
            data: {
                product: product.trim(),
                price: parseFloat(price),
                unit: unit.trim(),
                hasPhoto: hasPhoto === true,
                photoUrl: photoUrl || null,
                storeId,
                reporterId: req.userId!,
            },
            include: {
                store: {
                    select: { id: true, name: true, category: true },
                },
                reporter: {
                    select: { id: true, name: true, avatar: true },
                },
            },
        });

        // Award points and increment report count
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                points: { increment: hasPhoto ? 15 : 10 },
                priceReportsCount: { increment: 1 }
            },
        });

        return res.status(201).json({
            ...newPrice,
            freshness: 'fresh',
            daysSinceUpdate: 0
        });
    } catch (error) {
        console.error('Create price error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Vote on a price
router.post('/:id/vote', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { isUpvote } = req.body;

        if (typeof isUpvote !== 'boolean') {
            return res.status(400).json({ error: 'isUpvote deve ser boolean' });
        }

        const price = await prisma.price.update({
            where: { id },
            data: {
                votes: { increment: isUpvote ? 1 : -1 },
            },
        });

        return res.json(price);
    } catch (error) {
        console.error('Vote error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
