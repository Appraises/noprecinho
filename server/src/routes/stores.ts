import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Default pagination settings
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

// Helper: Check if store is currently open
function isStoreOpenNow(openingHours: string | null): boolean {
    if (!openingHours) return true; // Assume open if no hours set

    try {
        const hours = JSON.parse(openingHours);
        const now = new Date();
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = days[now.getDay()];
        const todayHours = hours[dayKey];

        if (!todayHours || todayHours === 'closed') return false;

        const [openTime, closeTime] = todayHours.split('-');
        if (!openTime || !closeTime) return true;

        const currentTime = now.getHours() * 100 + now.getMinutes();
        const openMinutes = parseInt(openTime.replace(':', ''));
        const closeMinutes = parseInt(closeTime.replace(':', ''));

        return currentTime >= openMinutes && currentTime < closeMinutes;
    } catch {
        return true; // Assume open on parse error
    }
}

// Get all stores (with optional filters and pagination)
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const {
            category,
            lat,
            lng,
            radius = '10',
            openNow,
            page = '1',
            limit = String(DEFAULT_PAGE_SIZE)
        } = req.query;

        // Parse pagination
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit as string) || DEFAULT_PAGE_SIZE));
        const skip = (pageNum - 1) * pageSize;

        const where: any = {};

        if (category && category !== 'all') {
            const categories = (category as string).split(',');
            if (categories.length > 1) {
                where.category = { in: categories };
            } else {
                where.category = categories[0];
            }
        }

        // Get total count
        const total = await prisma.store.count({ where });

        const stores = await prisma.store.findMany({
            where,
            include: {
                _count: {
                    select: { prices: true },
                },
                prices: {
                    orderBy: { price: 'asc' },
                    take: 1,
                    select: {
                        price: true,
                        product: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
            skip,
            take: pageSize,
        });

        // Transform data for frontend
        let result = stores.map((store) => {
            const isOpenNow = isStoreOpenNow(store.openingHours);
            return {
                id: store.id,
                name: store.name,
                category: store.category,
                lat: store.lat,
                lng: store.lng,
                address: store.address,
                trustScore: store.trustScore,
                isOpen: store.isOpen,
                isOpenNow,
                openingHours: store.openingHours,
                priceCount: store._count.prices,
                lowestPrice: store.prices[0]?.price ?? null,
                lastUpdate: store.prices[0]?.createdAt ?? store.createdAt,
            };
        });

        // Filter by openNow if requested
        if (openNow === 'true') {
            result = result.filter(s => s.isOpenNow);
        }

        return res.json({
            data: result,
            pagination: {
                page: pageNum,
                limit: pageSize,
                total: openNow === 'true' ? result.length : total,
                pages: Math.ceil((openNow === 'true' ? result.length : total) / pageSize),
                hasMore: skip + stores.length < total,
            }
        });
    } catch (error) {
        console.error('Get stores error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Get store by ID with all prices
router.get('/:id', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const store = await prisma.store.findUnique({
            where: { id },
            include: {
                prices: {
                    include: {
                        reporter: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50, // Limit prices per store
                },
            },
        });

        if (!store) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        return res.json(store);
    } catch (error) {
        console.error('Get store error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Create new store (for manual additions)
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, category, lat, lng, address } = req.body;

        // Input validation
        if (!name || typeof name !== 'string' || name.length > 200) {
            return res.status(400).json({ error: 'Nome inválido (máximo 200 caracteres)' });
        }

        const validCategories = ['mercado', 'farmacia', 'pet', 'hortifruti', 'combustivel', 'outros'];
        if (!category || !validCategories.includes(category)) {
            return res.status(400).json({ error: `Categoria inválida. Use: ${validCategories.join(', ')}` });
        }

        if (lat === undefined || isNaN(parseFloat(lat)) || parseFloat(lat) < -90 || parseFloat(lat) > 90) {
            return res.status(400).json({ error: 'Latitude inválida' });
        }

        if (lng === undefined || isNaN(parseFloat(lng)) || parseFloat(lng) < -180 || parseFloat(lng) > 180) {
            return res.status(400).json({ error: 'Longitude inválida' });
        }

        if (!address || typeof address !== 'string' || address.length > 500) {
            return res.status(400).json({ error: 'Endereço inválido (máximo 500 caracteres)' });
        }

        const store = await prisma.store.create({
            data: {
                name: name.trim(),
                category,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                address: address.trim(),
                source: 'manual',
            },
        });

        return res.status(201).json(store);
    } catch (error) {
        console.error('Create store error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
