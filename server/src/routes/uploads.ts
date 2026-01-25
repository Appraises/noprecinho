import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const router = Router();

// Upload directory
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

/**
 * Upload a file (image for price verification)
 * POST /api/uploads
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        // Check content type
        const contentType = req.headers['content-type'];

        if (!contentType?.includes('multipart/form-data') && !contentType?.includes('application/json')) {
            return res.status(400).json({ error: 'Content-Type inválido' });
        }

        // For base64 encoded images in JSON
        if (contentType?.includes('application/json')) {
            const { image, filename: originalName } = req.body;

            if (!image) {
                return res.status(400).json({ error: 'Imagem não fornecida' });
            }

            // Extract base64 data
            const matches = image.match(/^data:(.+);base64,(.+)$/);
            if (!matches) {
                return res.status(400).json({ error: 'Formato de imagem inválido' });
            }

            const mimeType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');

            // Generate unique filename
            const ext = mimeType.split('/')[1] || 'jpg';
            const filename = `${crypto.randomUUID()}.${ext}`;
            const filepath = path.join(UPLOAD_DIR, filename);

            // Save file
            await fs.writeFile(filepath, buffer);

            // Create database record
            const upload = await prisma.upload.create({
                data: {
                    userId: req.userId!,
                    filename: originalName || filename,
                    mimeType,
                    size: buffer.length,
                    url: `/uploads/${filename}`,
                    storageKey: filename
                }
            });

            return res.status(201).json({
                id: upload.id,
                url: upload.url,
                filename: upload.filename
            });
        }

        // For multipart form data - would need multer middleware
        return res.status(400).json({
            error: 'Use Content-Type: application/json com imagem em base64'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({ error: 'Erro no upload' });
    }
});

/**
 * Get upload by ID with OCR data
 * GET /api/uploads/:id
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const upload = await prisma.upload.findFirst({
            where: { id, userId: req.userId }
        });

        if (!upload) {
            return res.status(404).json({ error: 'Upload não encontrado' });
        }

        return res.json(upload);

    } catch (error) {
        console.error('Get upload error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Run OCR on an uploaded image
 * POST /api/uploads/:id/ocr
 * Note: This is a placeholder - actual OCR runs on frontend with Tesseract.js
 */
router.post('/:id/ocr', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { ocrText, ocrPrices } = req.body;

        const upload = await prisma.upload.update({
            where: { id },
            data: {
                ocrText,
                ocrPrices: JSON.stringify(ocrPrices || [])
            }
        });

        return res.json({
            id: upload.id,
            ocrText: upload.ocrText,
            ocrPrices: upload.ocrPrices ? JSON.parse(upload.ocrPrices) : []
        });

    } catch (error) {
        console.error('OCR update error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * Delete an upload
 * DELETE /api/uploads/:id
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const upload = await prisma.upload.findFirst({
            where: { id, userId: req.userId }
        });

        if (!upload) {
            return res.status(404).json({ error: 'Upload não encontrado' });
        }

        // Delete file
        const filepath = path.join(UPLOAD_DIR, upload.storageKey);
        await fs.unlink(filepath).catch(() => { }); // Ignore if file doesn't exist

        // Delete record
        await prisma.upload.delete({ where: { id } });

        return res.status(204).send();

    } catch (error) {
        console.error('Delete upload error:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
