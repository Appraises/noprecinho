import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get user's favorite stores
 * GET /api/favorites
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const favorites = await prisma.favoriteStore.findMany({
            where: { userId: req.userId },
            include: {
                store: {
                    include: {
                        prices: {
                            take: 3,
                            orderBy: { price: 'asc' }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.json(favorites.map(f => ({
            id: f.id,
            createdAt: f.createdAt,
            store: f.store
        })));
    } catch (error) {
        console.error('Get favorites error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Add store to favorites
 * POST /api/favorites/:storeId
 */
router.post('/:storeId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { storeId } = req.params;

        // Check if store exists
        const store = await prisma.store.findUnique({ where: { id: storeId } });
        if (!store) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        // Check if already favorited
        const existing = await prisma.favoriteStore.findUnique({
            where: { userId_storeId: { userId: req.userId!, storeId } }
        });

        if (existing) {
            return res.status(400).json({ error: 'Loja já está nos favoritos' });
        }

        const favorite = await prisma.favoriteStore.create({
            data: {
                userId: req.userId!,
                storeId
            },
            include: { store: true }
        });

        return res.status(201).json(favorite);
    } catch (error) {
        console.error('Add favorite error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Remove store from favorites
 * DELETE /api/favorites/:storeId
 */
router.delete('/:storeId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { storeId } = req.params;

        const deleted = await prisma.favoriteStore.deleteMany({
            where: { userId: req.userId!, storeId }
        });

        if (deleted.count === 0) {
            return res.status(404).json({ error: 'Favorito não encontrado' });
        }

        return res.status(204).send();
    } catch (error) {
        console.error('Remove favorite error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Check if store is favorited
 * GET /api/favorites/:storeId/check
 */
router.get('/:storeId/check', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { storeId } = req.params;

        const favorite = await prisma.favoriteStore.findUnique({
            where: { userId_storeId: { userId: req.userId!, storeId } }
        });

        return res.json({ isFavorite: !!favorite });
    } catch (error) {
        console.error('Check favorite error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
