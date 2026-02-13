import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { recalculateAndSaveTrustScore } from '../services/trustScore.js';

const router = Router();

/**
 * Validate a price (confirm or dispute)
 * POST /api/validation/:priceId
 */
router.post('/:priceId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { priceId } = req.params;
        const { isCorrect, comment } = req.body;

        if (typeof isCorrect !== 'boolean') {
            return res.status(400).json({ error: 'isCorrect é obrigatório (true/false)' });
        }

        // Check if price exists
        const price = await prisma.price.findUnique({
            where: { id: priceId },
            include: { reporter: true }
        });

        if (!price) {
            return res.status(404).json({ error: 'Preço não encontrado' });
        }

        // Cannot validate own price
        if (price.reporterId === req.userId) {
            return res.status(400).json({ error: 'Você não pode validar seu próprio preço' });
        }

        // Create or update validation
        const validation = await prisma.priceValidation.upsert({
            where: {
                priceId_userId: {
                    priceId,
                    userId: req.userId!
                }
            },
            create: {
                priceId,
                userId: req.userId!,
                isCorrect,
                comment: comment?.slice(0, 500) || null
            },
            update: {
                isCorrect,
                comment: comment?.slice(0, 500) || null
            }
        });

        // Update validation count on price
        const validationStats = await prisma.priceValidation.aggregate({
            where: { priceId },
            _count: true
        });

        await prisma.price.update({
            where: { id: priceId },
            data: {
                validationCount: validationStats._count,
                lastValidatedAt: new Date()
            }
        });

        // Update reporter's reputation
        const reporterStats = await prisma.priceValidation.groupBy({
            by: ['isCorrect'],
            where: {
                price: { reporterId: price.reporterId }
            },
            _count: true
        });

        const totalVotes = reporterStats.reduce((sum, r) => sum + r._count, 0);
        const positiveVotes = reporterStats.find(r => r.isCorrect === true)?._count || 0;
        const accuracy = totalVotes > 0 ? (positiveVotes / totalVotes) * 100 : 50;

        await prisma.user.update({
            where: { id: price.reporterId },
            data: {
                totalVotesReceived: totalVotes,
                positiveVotesReceived: positiveVotes,
                accuracyScore: accuracy
            }
        });

        // Recalculate reporter's trustScore
        await recalculateAndSaveTrustScore(price.reporterId);

        // Award points to validator
        await prisma.user.update({
            where: { id: req.userId },
            data: {
                points: { increment: 2 },
                validationsGiven: { increment: 1 }
            }
        });

        return res.status(201).json({
            validation,
            priceValidationCount: validationStats._count,
            message: isCorrect ? 'Preço confirmado!' : 'Preço reportado como incorreto'
        });

    } catch (error) {
        console.error('Validation error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Get validations for a price
 * GET /api/validation/:priceId
 */
router.get('/:priceId', async (req, res) => {
    try {
        const { priceId } = req.params;

        const validations = await prisma.priceValidation.findMany({
            where: { priceId },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true, accuracyScore: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const stats = await prisma.priceValidation.groupBy({
            by: ['isCorrect'],
            where: { priceId },
            _count: true
        });

        const confirms = stats.find(s => s.isCorrect === true)?._count || 0;
        const disputes = stats.find(s => s.isCorrect === false)?._count || 0;

        return res.json({
            validations,
            stats: {
                confirms,
                disputes,
                total: confirms + disputes,
                trustPercentage: confirms + disputes > 0
                    ? Math.round((confirms / (confirms + disputes)) * 100)
                    : null
            }
        });

    } catch (error) {
        console.error('Get validations error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
