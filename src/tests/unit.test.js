// Unit tests for utility functions
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import modules to test
import { formatPrice, formatTimeAgo, formatDistance, getFreshnessBadge } from '../js/utils/formatters.js';
import { debounce, throttle, memoize, generateId, isEmpty, deepClone } from '../js/utils/helpers.js';
import { validatePrice, analyzePriceTrend, findBestTimeToBuy } from '../js/utils/priceValidation.js';
import { getUserPoints, addPoints, resetUserData } from '../js/utils/gamification.js';

// ============================================
// Formatters Tests
// ============================================
describe('Formatters', () => {
    describe('formatPrice', () => {
        it('should format price in Brazilian Real', () => {
            expect(formatPrice(12.9)).toBe('R$ 12,90');
            expect(formatPrice(1234.56)).toBe('R$ 1234,56');
            expect(formatPrice(0.99)).toBe('R$ 0,99');
        });

        it('should return dash for null/undefined', () => {
            expect(formatPrice(null)).toBe('—');
            expect(formatPrice(undefined)).toBe('—');
        });

        it('should handle zero', () => {
            expect(formatPrice(0)).toBe('R$ 0,00');
        });
    });

    describe('formatTimeAgo', () => {
        it('should format recent times', () => {
            const now = new Date();
            expect(formatTimeAgo(now)).toBe('agora');

            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
            expect(formatTimeAgo(fiveMinAgo)).toBe('5min');

            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            expect(formatTimeAgo(twoHoursAgo)).toBe('2h');
        });

        it('should format days ago', () => {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            expect(formatTimeAgo(oneDayAgo)).toBe('1 dia');

            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            expect(formatTimeAgo(threeDaysAgo)).toBe('3 dias');
        });

        it('should return dash for null', () => {
            expect(formatTimeAgo(null)).toBe('—');
        });
    });

    describe('formatDistance', () => {
        it('should format meters for short distances', () => {
            expect(formatDistance(0.5)).toBe('500m');
            expect(formatDistance(0.1)).toBe('100m');
        });

        it('should format kilometers for longer distances', () => {
            expect(formatDistance(1.5)).toBe('1,5 km');
            expect(formatDistance(10)).toBe('10,0 km');
        });
    });

    describe('getFreshnessBadge', () => {
        it('should return fresh badge for recent dates', () => {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const badge = getFreshnessBadge(oneHourAgo);
            expect(badge.class).toBe('badge--fresh');
        });

        it('should return stale badge for older dates', () => {
            const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
            const badge = getFreshnessBadge(thirtyHoursAgo);
            expect(badge.class).toBe('badge--stale');
        });

        it('should return outdated badge for very old dates', () => {
            const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
            const badge = getFreshnessBadge(threeDaysAgo);
            expect(badge.class).toBe('badge--outdated');
        });
    });
});

// ============================================
// Helpers Tests
// ============================================
describe('Helpers', () => {
    describe('debounce', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should delay function execution', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn();
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        it('should reset timer on subsequent calls', () => {
            const fn = vi.fn();
            const debouncedFn = debounce(fn, 100);

            debouncedFn();
            vi.advanceTimersByTime(50);
            debouncedFn();
            vi.advanceTimersByTime(50);
            expect(fn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(fn).toHaveBeenCalledTimes(1);
        });
    });

    describe('throttle', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should limit function calls', () => {
            const fn = vi.fn();
            const throttledFn = throttle(fn, 100);

            throttledFn();
            throttledFn();
            throttledFn();

            expect(fn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(100);
            throttledFn();
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('memoize', () => {
        it('should cache function results', () => {
            const fn = vi.fn((x) => x * 2);
            const memoizedFn = memoize(fn);

            expect(memoizedFn(5)).toBe(10);
            expect(memoizedFn(5)).toBe(10);
            expect(fn).toHaveBeenCalledTimes(1);

            expect(memoizedFn(10)).toBe(20);
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('generateId', () => {
        it('should generate unique IDs', () => {
            const id1 = generateId();
            const id2 = generateId();
            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
        });
    });

    describe('isEmpty', () => {
        it('should detect empty values', () => {
            expect(isEmpty(null)).toBe(true);
            expect(isEmpty(undefined)).toBe(true);
            expect(isEmpty('')).toBe(true);
            expect(isEmpty('  ')).toBe(true);
            expect(isEmpty([])).toBe(true);
            expect(isEmpty({})).toBe(true);
        });

        it('should detect non-empty values', () => {
            expect(isEmpty('hello')).toBe(false);
            expect(isEmpty([1, 2, 3])).toBe(false);
            expect(isEmpty({ a: 1 })).toBe(false);
            expect(isEmpty(0)).toBe(false);
        });
    });

    describe('deepClone', () => {
        it('should deep clone objects', () => {
            const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
            const clone = deepClone(obj);

            expect(clone).toEqual(obj);
            expect(clone).not.toBe(obj);
            expect(clone.b).not.toBe(obj.b);
            expect(clone.d).not.toBe(obj.d);
        });

        it('should handle dates', () => {
            const date = new Date();
            const clone = deepClone(date);
            expect(clone.getTime()).toBe(date.getTime());
            expect(clone).not.toBe(date);
        });
    });
});

// ============================================
// Price Validation Tests
// ============================================
describe('Price Validation', () => {
    describe('validatePrice', () => {
        it('should reject negative prices', () => {
            const result = validatePrice(-10, 'Product', 'mercado');
            expect(result.isValid).toBe(false);
        });

        it('should reject very high prices', () => {
            const result = validatePrice(1000000, 'Product', 'mercado');
            expect(result.isValid).toBe(false);
        });

        it('should accept normal prices', () => {
            const result = validatePrice(15.90, 'Arroz 5kg', 'mercado');
            expect(result.isValid).toBe(true);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('should warn about prices outside category range', () => {
            // Fuel usually costs 4-8 per liter
            const result = validatePrice(50, 'Gasolina', 'combustivel');
            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('should detect statistical outliers', () => {
            const historicalPrices = [
                { price: 10 },
                { price: 11 },
                { price: 10.5 },
                { price: 9.8 },
                { price: 10.2 }
            ];

            // Way outside normal range
            const result = validatePrice(50, 'Product', 'mercado', historicalPrices);
            expect(result.confidence).toBeLessThan(0.5);
        });
    });

    describe('analyzePriceTrend', () => {
        it('should return insufficient data for small datasets', () => {
            const result = analyzePriceTrend([{ price: 10, timestamp: new Date() }]);
            expect(result.trend).toBe('insufficient_data');
        });

        it('should detect rising trend', () => {
            const prices = [
                { price: 10, timestamp: new Date('2024-01-01') },
                { price: 12, timestamp: new Date('2024-01-15') },
                { price: 14, timestamp: new Date('2024-02-01') },
                { price: 16, timestamp: new Date('2024-02-15') }
            ];
            const result = analyzePriceTrend(prices);
            expect(result.trend).toBe('rising');
        });

        it('should detect falling trend', () => {
            const prices = [
                { price: 20, timestamp: new Date('2024-01-01') },
                { price: 17, timestamp: new Date('2024-01-15') },
                { price: 14, timestamp: new Date('2024-02-01') },
                { price: 11, timestamp: new Date('2024-02-15') }
            ];
            const result = analyzePriceTrend(prices);
            expect(result.trend).toBe('falling');
        });
    });

    describe('findBestTimeToBuy', () => {
        it('should return message for insufficient data', () => {
            const result = findBestTimeToBuy([]);
            expect(result.recommendation).toBeNull();
        });
    });
});

// ============================================
// Gamification Tests
// ============================================
describe('Gamification', () => {
    beforeEach(() => {
        localStorage.clear();
        resetUserData();
    });

    describe('getUserPoints', () => {
        it('should return 0 for new users', () => {
            expect(getUserPoints()).toBe(0);
        });
    });

    describe('addPoints', () => {
        it('should add points correctly', () => {
            addPoints(5);
            expect(getUserPoints()).toBe(5);

            addPoints(10);
            expect(getUserPoints()).toBe(15);
        });
    });
});
