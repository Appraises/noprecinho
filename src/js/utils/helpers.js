// Utility functions for debouncing, throttling, and other helpers

// Debounce - delays execution until after wait ms have elapsed since last call
export function debounce(func, wait, immediate = false) {
    let timeout;

    return function executedFunction(...args) {
        const context = this;

        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
}

// Throttle - ensures function is called at most once per wait ms
export function throttle(func, wait) {
    let inThrottle;
    let lastResult;

    return function throttledFunction(...args) {
        const context = this;

        if (!inThrottle) {
            lastResult = func.apply(context, args);
            inThrottle = true;

            setTimeout(() => {
                inThrottle = false;
            }, wait);
        }

        return lastResult;
    };
}

// Request Animation Frame throttle - for smooth animations
export function rafThrottle(func) {
    let rafId = null;
    let lastArgs = null;

    return function throttledFunction(...args) {
        lastArgs = args;

        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                func.apply(this, lastArgs);
                rafId = null;
            });
        }
    };
}

// Retry with exponential backoff
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const delay = baseDelay * Math.pow(2, i);
            console.warn(`Retry ${i + 1}/${maxRetries} failed, waiting ${delay}ms...`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

// Memoize function results
export function memoize(fn, keyResolver) {
    const cache = new Map();

    return function memoizedFunction(...args) {
        const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}

// Async memoize with TTL
export function memoizeAsync(fn, ttlMs = 60000, keyResolver) {
    const cache = new Map();

    return async function memoizedAsyncFunction(...args) {
        const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
        const cached = cache.get(key);

        if (cached && Date.now() < cached.expiresAt) {
            return cached.value;
        }

        const result = await fn.apply(this, args);
        cache.set(key, { value: result, expiresAt: Date.now() + ttlMs });
        return result;
    };
}

// Rate limiter
export function rateLimiter(maxCalls, periodMs) {
    const calls = [];

    return function limitedFunction(fn) {
        return function (...args) {
            const now = Date.now();

            // Remove old calls outside the period
            while (calls.length > 0 && calls[0] < now - periodMs) {
                calls.shift();
            }

            if (calls.length >= maxCalls) {
                return Promise.reject(new Error('Rate limit exceeded'));
            }

            calls.push(now);
            return fn.apply(this, args);
        };
    };
}

// Queue for sequential async operations
export function createAsyncQueue() {
    let queue = Promise.resolve();

    return function enqueue(fn) {
        queue = queue.then(fn).catch(err => {
            console.error('Queue error:', err);
            throw err;
        });
        return queue;
    };
}

// Batch operations
export function batchOperations(fn, batchSize = 10, delayMs = 100) {
    const batch = [];
    let timeout = null;

    const flush = () => {
        if (batch.length === 0) return;
        const items = batch.splice(0, batchSize);
        fn(items);

        if (batch.length > 0) {
            timeout = setTimeout(flush, delayMs);
        }
    };

    return {
        add(item) {
            batch.push(item);
            if (!timeout) {
                timeout = setTimeout(flush, delayMs);
            }
        },
        flush() {
            clearTimeout(timeout);
            while (batch.length > 0) {
                const items = batch.splice(0, batchSize);
                fn(items);
            }
        }
    };
}

// Deep clone
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clone = {};
        Object.keys(obj).forEach(key => {
            clone[key] = deepClone(obj[key]);
        });
        return clone;
    }
}

// Generate unique ID
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Sleep utility
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if value is empty
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}
