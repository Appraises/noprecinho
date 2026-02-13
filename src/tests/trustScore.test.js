// @vitest-environment node
// Unit tests for TrustScore calculation
import { describe, it, expect } from 'vitest';

// Pure functions replicated from server/src/services/trustScore.ts
// to test without Prisma/DB dependencies
const ALPHA = 0.5;
const BETA = 0.3;
const GAMMA = 0.2;
const SIGMOID_MIDPOINT = 20;
const SIGMOID_STEEPNESS = 0.15;
const HALF_LIFE_DAYS = 30;

function normalizeSubmissions(count) {
    return 1 / (1 + Math.exp(-SIGMOID_STEEPNESS * (count - SIGMOID_MIDPOINT)));
}

function calculateErrorRate(totalVotes, positiveVotes) {
    if (totalVotes === 0) return 0;
    return 1 - (positiveVotes / totalVotes);
}

function calculateTimeDecay(lastActivityDate) {
    if (!lastActivityDate) return 0.5;
    const now = new Date();
    const daysSinceActivity = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24);
    const lambda = Math.LN2 / HALF_LIFE_DAYS;
    return Math.exp(-lambda * daysSinceActivity);
}

function calculateTrustScore({ priceReportsCount, totalVotesReceived, positiveVotesReceived, lastActivityDate }) {
    const V = normalizeSubmissions(priceReportsCount);
    const E = calculateErrorRate(totalVotesReceived, positiveVotesReceived);
    const T = calculateTimeDecay(lastActivityDate);
    const score = ALPHA * V + BETA * (1 - E) + GAMMA * T;
    return Math.max(0, Math.min(1, score));
}

describe('TrustScore', () => {
    describe('normalizeSubmissions (V_u)', () => {
        it('returns ~0.5 at sigmoid midpoint (20 submissions)', () => {
            expect(normalizeSubmissions(20)).toBeCloseTo(0.5, 2);
        });

        it('returns near 0 for 0 submissions', () => {
            expect(normalizeSubmissions(0)).toBeLessThan(0.1);
        });

        it('returns near 1 for many submissions', () => {
            expect(normalizeSubmissions(100)).toBeGreaterThan(0.99);
        });

        it('is monotonically increasing', () => {
            const v5 = normalizeSubmissions(5);
            const v10 = normalizeSubmissions(10);
            const v20 = normalizeSubmissions(20);
            const v50 = normalizeSubmissions(50);
            expect(v5).toBeLessThan(v10);
            expect(v10).toBeLessThan(v20);
            expect(v20).toBeLessThan(v50);
        });
    });

    describe('calculateErrorRate (E_u)', () => {
        it('returns 0 when no votes', () => {
            expect(calculateErrorRate(0, 0)).toBe(0);
        });

        it('returns 0 when all votes positive', () => {
            expect(calculateErrorRate(10, 10)).toBe(0);
        });

        it('returns 1 when no positive votes', () => {
            expect(calculateErrorRate(10, 0)).toBe(1);
        });

        it('returns 0.5 when half are positive', () => {
            expect(calculateErrorRate(10, 5)).toBeCloseTo(0.5, 5);
        });
    });

    describe('calculateTimeDecay (T_u)', () => {
        it('returns ~1 for activity just now', () => {
            expect(calculateTimeDecay(new Date())).toBeCloseTo(1, 1);
        });

        it('returns ~0.5 at half-life (30 days)', () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            expect(calculateTimeDecay(thirtyDaysAgo)).toBeCloseTo(0.5, 1);
        });

        it('returns ~0.25 at 60 days', () => {
            const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
            expect(calculateTimeDecay(sixtyDaysAgo)).toBeCloseTo(0.25, 1);
        });

        it('returns 0.5 for null (no activity)', () => {
            expect(calculateTimeDecay(null)).toBe(0.5);
        });
    });

    describe('calculateTrustScore (composite)', () => {
        it('returns moderate score for a new user', () => {
            const score = calculateTrustScore({
                priceReportsCount: 0,
                totalVotesReceived: 0,
                positiveVotesReceived: 0,
                lastActivityDate: null,
            });
            expect(score).toBeGreaterThan(0.3);
            expect(score).toBeLessThan(0.6);
        });

        it('returns high score for active accurate user', () => {
            const score = calculateTrustScore({
                priceReportsCount: 100,
                totalVotesReceived: 80,
                positiveVotesReceived: 75,
                lastActivityDate: new Date(),
            });
            expect(score).toBeGreaterThan(0.9);
        });

        it('returns lower score for high error rate user', () => {
            const score = calculateTrustScore({
                priceReportsCount: 50,
                totalVotesReceived: 40,
                positiveVotesReceived: 5,
                lastActivityDate: new Date(),
            });
            expect(score).toBeLessThan(0.8);
        });

        it('penalizes inactivity via time decay', () => {
            const base = { priceReportsCount: 50, totalVotesReceived: 30, positiveVotesReceived: 28 };
            const recent = calculateTrustScore({ ...base, lastActivityDate: new Date() });
            const old = calculateTrustScore({ ...base, lastActivityDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) });
            expect(recent).toBeGreaterThan(old);
        });

        it('always returns value between 0 and 1', () => {
            const cases = [
                { priceReportsCount: 0, totalVotesReceived: 0, positiveVotesReceived: 0, lastActivityDate: null },
                { priceReportsCount: 10000, totalVotesReceived: 10000, positiveVotesReceived: 10000, lastActivityDate: new Date() },
                { priceReportsCount: 10000, totalVotesReceived: 10000, positiveVotesReceived: 0, lastActivityDate: new Date(0) },
            ];

            for (const params of cases) {
                const score = calculateTrustScore(params);
                expect(score).toBeGreaterThanOrEqual(0);
                expect(score).toBeLessThanOrEqual(1);
            }
        });
    });
});
