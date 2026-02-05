import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import authRoutes from './routes/auth.js';
import storesRoutes from './routes/stores.js';
import pricesRoutes from './routes/prices.js';
import validationRoutes from './routes/validation.js';
import productsRoutes from './routes/products.js';
import shoppingListsRoutes from './routes/shoppingLists.js';
import priceHistoryRoutes from './routes/priceHistory.js';
import pushRoutes from './routes/push.js';
import uploadsRoutes from './routes/uploads.js';
import favoritesRoutes from './routes/favorites.js';
import searchRoutes from './routes/search.js';

// Middleware
import { authLimiter, apiLimiter, strictLimiter } from './middleware/rateLimit.js';
import { securityHeaders, sanitizeInput, suspiciousRequestLogger } from './middleware/security.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security headers
app.use(securityHeaders);

// CORS
app.use(cors({
    origin: true, // Allow any origin
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Suspicious request logging
app.use(suspiciousRequestLogger);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check (no rate limiting)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        features: ['password-reset', 'price-freshness', 'photo-requirement', 'open-now', 'favorites', 'search', 'list-sharing']
    });
});

// API Routes with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/stores', apiLimiter, storesRoutes);
app.use('/api/prices', apiLimiter, pricesRoutes);
app.use('/api/validation', apiLimiter, validationRoutes);
app.use('/api/products', apiLimiter, productsRoutes);
app.use('/api/shopping-lists', apiLimiter, shoppingListsRoutes);
app.use('/api/price-history', apiLimiter, priceHistoryRoutes);
app.use('/api/push', apiLimiter, pushRoutes);
app.use('/api/uploads', strictLimiter, uploadsRoutes);
app.use('/api/favorites', apiLimiter, favoritesRoutes);
app.use('/api/search', apiLimiter, searchRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
    console.log(`🚀 PreçoJá API v2.1 running on http://localhost:${PORT}`);
    console.log(`📦 Health check: http://localhost:${PORT}/health`);
    console.log('🔒 Security middleware enabled');
    console.log('📊 New features: password-reset, favorites, search, list-sharing');
});

export default app;

