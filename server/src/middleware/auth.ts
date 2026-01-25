import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: string;
    user?: { id: string; email: string; name: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET not configured');
        return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    try {
        const decoded = jwt.verify(token, secret) as { id: string; email: string; name: string };
        req.userId = decoded.id;
        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || !/^Bearer$/i.test(parts[0])) {
        return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return next();
    }

    try {
        const decoded = jwt.verify(parts[1], secret) as { id: string; email: string; name: string };
        req.userId = decoded.id;
        req.user = decoded;
    } catch {
        // Token invalid, but continue without auth
    }

    return next();
}
