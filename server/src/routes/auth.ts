import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Signup
router.post('/signup', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Este email já está cadastrado' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00C896&color=fff`,
            },
        });

        // Generate JWT
        const secret = process.env.JWT_SECRET!;
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            secret,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                points: user.points,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Generate JWT
        const secret = process.env.JWT_SECRET!;
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            secret,
            { expiresIn: '7d' }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                points: user.points,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                points: true,
                createdAt: true,
                _count: {
                    select: { prices: true },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        return res.json({
            ...user,
            priceCount: user._count.prices,
        });
    } catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Get user's submitted prices
router.get('/me/prices', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const prices = await prisma.price.findMany({
            where: { reporterId: req.userId },
            include: {
                store: {
                    select: {
                        id: true,
                        name: true,
                        category: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return res.json(prices);
    } catch (error) {
        console.error('Get user prices error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'Se o email existir, você receberá instruções de recuperação.' });
        }

        // Generate reset token
        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        // Invalidate any existing tokens
        await prisma.passwordReset.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true }
        });

        // Create new reset token
        await prisma.passwordReset.create({
            data: {
                userId: user.id,
                token,
                expiresAt
            }
        });

        // In production, send email with reset link
        // For now, log the token (replace with actual email sending)
        console.log(`Password reset token for ${email}: ${token}`);
        console.log(`Reset link: http://localhost:5173/reset-password.html?token=${token}`);

        return res.json({
            message: 'Se o email existir, você receberá instruções de recuperação.',
            // Only include token in development
            ...(process.env.NODE_ENV === 'development' ? { token } : {})
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });
        }

        // Find valid reset token
        const resetRecord = await prisma.passwordReset.findFirst({
            where: {
                token,
                used: false,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });

        if (!resetRecord) {
            return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password and mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetRecord.userId },
                data: { password: hashedPassword }
            }),
            prisma.passwordReset.update({
                where: { id: resetRecord.id },
                data: { used: true }
            })
        ]);

        return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;

