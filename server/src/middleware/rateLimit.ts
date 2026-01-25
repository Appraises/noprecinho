import { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
    windowMs: number;     // Time window in milliseconds
    maxRequests: number;  // Max requests per window
    message?: string;     // Custom error message
}

/**
 * Rate limiting middleware
 * Uses IP address as identifier
 */
export function rateLimit(options: RateLimitOptions) {
    const { windowMs, maxRequests, message = 'Too many requests, please try again later' } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        // Get client IP
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const key = `${ip}:${req.path}`;
        const now = Date.now();

        // Get or create entry
        let entry = requestCounts.get(key);

        if (!entry || now > entry.resetTime) {
            entry = { count: 1, resetTime: now + windowMs };
            requestCounts.set(key, entry);
        } else {
            entry.count++;
        }

        // Set rate limit headers
        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - entry.count)));
        res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

        if (entry.count > maxRequests) {
            return res.status(429).json({
                error: message,
                retryAfter: Math.ceil((entry.resetTime - now) / 1000)
            });
        }

        next();
    };
}

// Preset rate limiters
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,          // 10 login/signup attempts
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
});

export const apiLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 100,      // 100 requests per minute
    message: 'Limite de requisições atingido. Aguarde um momento.'
});

export const strictLimiter = rateLimit({
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,       // 10 per minute (for expensive operations)
    message: 'Operação limitada. Aguarde um momento.'
});

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of requestCounts.entries()) {
        if (now > entry.resetTime) {
            requestCounts.delete(key);
        }
    }
}, 60 * 1000); // Cleanup every minute
