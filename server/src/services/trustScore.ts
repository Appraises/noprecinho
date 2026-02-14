import { prisma } from '../lib/prisma.js';

/**
 * TrustScore calculation based on the composite metric from the article:
 *
 *   trustScore_u = α · V_u + β · (1 - E_u) + γ · T_u
 *
 * Where:
 *   V_u = normalized count of validated submissions (sigmoid, 0-1)
 *   E_u = error rate (proportion of negative validations)
 *   T_u = time decay factor based on recency of activity
 *   α = 0.5, β = 0.3, γ = 0.2
 */

const ALPHA = 0.5;
const BETA = 0.3;
const GAMMA = 0.2;

const SIGMOID_MIDPOINT = 20;
const SIGMOID_STEEPNESS = 0.15;
const HALF_LIFE_DAYS = 30;

/** Normalize submission count to 0-1 using a sigmoid function. */
export function normalizeSubmissions(count: number): number {
    return 1 / (1 + Math.exp(-SIGMOID_STEEPNESS * (count - SIGMOID_MIDPOINT)));
}

/** Calculate error rate from validation stats. Returns 0 if no votes. */
export function calculateErrorRate(totalVotes: number, positiveVotes: number): number {
    if (totalVotes === 0) return 0;
    return 1 - (positiveVotes / totalVotes);
}

/** Calculate time decay factor. Returns ~1 for recent activity, decays toward 0. */
export function calculateTimeDecay(lastActivityDate: Date | null): number {
    if (!lastActivityDate) return 0.5;
    const now = new Date();
    const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
    const lambda = Math.LN2 / HALF_LIFE_DAYS;
    return Math.exp(-lambda * daysSinceActivity);
}

/** Calculate trustScore using the composite formula. */
export function calculateTrustScore(params: {
    validatedSubmissionsCount: number;
    totalVotesReceived: number;
    positiveVotesReceived: number;
    lastActivityDate: Date | null;
}): number {
    const V = normalizeSubmissions(params.validatedSubmissionsCount);
    const E = calculateErrorRate(params.totalVotesReceived, params.positiveVotesReceived);
    const T = calculateTimeDecay(params.lastActivityDate);
    const score = ALPHA * V + BETA * (1 - E) + GAMMA * T;
    return Math.max(0, Math.min(1, score));
}

/** Recalculate and persist trustScore for a given user. */
export async function recalculateAndSaveTrustScore(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            totalVotesReceived: true,
            positiveVotesReceived: true,
            updatedAt: true,
            prices: {
                select: { createdAt: true },
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
        },
    });

    if (!user) return 0.5;

    // V_u: Count of user's submissions that have been validated (at least one validation)
    const validatedSubmissionsCount = await prisma.price.count({
        where: {
            reporterId: userId,
            validationCount: { gt: 0 }
        }
    });

    const lastActivityDate = user.prices[0]?.createdAt ?? user.updatedAt;

    const trustScore = calculateTrustScore({
        validatedSubmissionsCount,
        totalVotesReceived: user.totalVotesReceived,
        positiveVotesReceived: user.positiveVotesReceived,
        lastActivityDate,
    });

    await prisma.user.update({
        where: { id: userId },
        data: { trustScore },
    });

    return trustScore;
}
