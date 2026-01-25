import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// VAPID keys should be in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Get VAPID public key for client-side subscription
 * GET /api/push/vapid-key
 */
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 */
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Subscription inválida' });
        }

        // Upsert subscription
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            create: {
                userId: req.userId!,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            },
            update: {
                userId: req.userId!,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        });

        return res.status(201).json({ message: 'Inscrito com sucesso' });

    } catch (error) {
        console.error('Push subscribe error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Unsubscribe from push notifications
 * POST /api/push/unsubscribe
 */
router.post('/unsubscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint é obrigatório' });
        }

        await prisma.pushSubscription.deleteMany({
            where: { userId: req.userId, endpoint }
        });

        return res.json({ message: 'Desinscrito com sucesso' });

    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Create a price alert
 * POST /api/push/alerts
 */
router.post('/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { productName, storeId, targetPrice } = req.body;

        if (!productName) {
            return res.status(400).json({ error: 'Nome do produto é obrigatório' });
        }

        const alert = await prisma.priceAlert.create({
            data: {
                userId: req.userId!,
                productName,
                storeId: storeId || null,
                targetPrice: targetPrice ? parseFloat(targetPrice) : null
            }
        });

        return res.status(201).json(alert);

    } catch (error) {
        console.error('Create alert error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get user's price alerts
 * GET /api/push/alerts
 */
router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const alerts = await prisma.priceAlert.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' }
        });

        return res.json(alerts);

    } catch (error) {
        console.error('Get alerts error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Delete a price alert
 * DELETE /api/push/alerts/:id
 */
router.delete('/alerts/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.priceAlert.deleteMany({
            where: { id, userId: req.userId }
        });

        return res.status(204).send();

    } catch (error) {
        console.error('Delete alert error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
