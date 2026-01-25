import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * Get price history for a product
 * GET /api/price-history?product=Arroz&storeId=xxx&days=30
 */
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { product, storeId, days = '30' } = req.query;

        if (!product) {
            return res.status(400).json({ error: 'Nome do produto é obrigatório' });
        }

        const daysNum = Math.min(365, Math.max(1, parseInt(days as string) || 30));
        const cutoff = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

        const where: any = {
            productName: { contains: product as string, mode: 'insensitive' },
            recordedAt: { gte: cutoff }
        };

        if (storeId) {
            where.storeId = storeId as string;
        }

        const history = await prisma.priceHistory.findMany({
            where,
            orderBy: { recordedAt: 'asc' },
            take: 500
        });

        // Group by date for chart
        const grouped = new Map<string, { min: number; max: number; avg: number; count: number }>();

        for (const entry of history) {
            const dateKey = entry.recordedAt.toISOString().split('T')[0];
            const existing = grouped.get(dateKey);

            if (existing) {
                existing.min = Math.min(existing.min, entry.price);
                existing.max = Math.max(existing.max, entry.price);
                existing.avg = (existing.avg * existing.count + entry.price) / (existing.count + 1);
                existing.count++;
            } else {
                grouped.set(dateKey, {
                    min: entry.price,
                    max: entry.price,
                    avg: entry.price,
                    count: 1
                });
            }
        }

        const chartData = Array.from(grouped.entries()).map(([date, stats]) => ({
            date,
            min: Math.round(stats.min * 100) / 100,
            max: Math.round(stats.max * 100) / 100,
            avg: Math.round(stats.avg * 100) / 100
        }));

        // Calculate trend
        let trend = 'stable';
        if (chartData.length >= 2) {
            const first = chartData[0].avg;
            const last = chartData[chartData.length - 1].avg;
            const change = ((last - first) / first) * 100;

            if (change > 5) trend = 'up';
            else if (change < -5) trend = 'down';
        }

        return res.json({
            product: product as string,
            days: daysNum,
            dataPoints: history.length,
            chartData,
            trend,
            summary: chartData.length > 0 ? {
                currentAvg: chartData[chartData.length - 1]?.avg,
                lowestEver: Math.min(...chartData.map(d => d.min)),
                highestEver: Math.max(...chartData.map(d => d.max))
            } : null
        });

    } catch (error) {
        console.error('Price history error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Record a price to history (called when price is reported)
 * This is typically called internally, but exposed for testing
 */
router.post('/', async (req, res) => {
    try {
        const { productName, storeId, price, productId } = req.body;

        if (!productName || !storeId || price === undefined) {
            return res.status(400).json({ error: 'productName, storeId, price são obrigatórios' });
        }

        const entry = await prisma.priceHistory.create({
            data: {
                productName,
                storeId,
                price: parseFloat(price),
                productId: productId || null
            }
        });

        return res.status(201).json(entry);

    } catch (error) {
        console.error('Record price history error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
