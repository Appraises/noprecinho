import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 * Provides basic protections without external dependencies
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Protect from XSS
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Hide powered by header
    res.removeHeader('X-Powered-By');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy (basic)
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' http://localhost:* https://overpass-api.de"
    );

    // Permissions Policy
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(self), camera=(), microphone=(), payment=()'
    );

    next();
}

/**
 * Request sanitization middleware
 * Strips dangerous characters from inputs
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
    // Helper to sanitize strings
    const sanitize = (value: unknown): unknown => {
        if (typeof value === 'string') {
            // Remove null bytes and control characters
            return value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
        }
        if (Array.isArray(value)) {
            return value.map(sanitize);
        }
        if (value && typeof value === 'object') {
            const sanitized: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(value)) {
                sanitized[key] = sanitize(val);
            }
            return sanitized;
        }
        return value;
    };

    if (req.body) {
        req.body = sanitize(req.body);
    }

    next();
}

/**
 * Log suspicious requests
 */
export function suspiciousRequestLogger(req: Request, res: Response, next: NextFunction) {
    const suspiciousPatterns = [
        /\.\.\//,              // Path traversal
        /<script/i,            // XSS
        /union.*select/i,      // SQL injection
        /eval\(/i,             // Code injection
        /javascript:/i,        // JS protocol
    ];

    const checkValue = (value: string): boolean => {
        return suspiciousPatterns.some(pattern => pattern.test(value));
    };

    const bodyStr = JSON.stringify(req.body);
    const queryStr = JSON.stringify(req.query);
    const path = req.path;

    if (checkValue(bodyStr) || checkValue(queryStr) || checkValue(path)) {
        console.warn(`⚠️ Suspicious request from ${req.ip}: ${req.method} ${req.path}`, {
            body: req.body,
            query: req.query,
        });
    }

    next();
}
