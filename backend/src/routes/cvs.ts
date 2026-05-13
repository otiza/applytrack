import { Router, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../middleware/auth.js';
import type { AuthenticatedRequest } from '../types/auth.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/cvs');
const maxUploadSize = 5 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: maxUploadSize
  }
});

const createCvSchema = z.object({
  name: z.string().trim().min(2).max(120).optional().or(z.literal(''))
});

router.use(authMiddleware);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cvs = await prisma.cvDocument.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        filePath: true,
        originalFileName: true,
        mimeType: true,
        size: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.json({ cvs });
  } catch (error) {
    console.error('Error loading CVs:', error);
    return res.status(500).json({ error: 'Failed to load CVs.' });
  }
});

router.post('/', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required.' });
    }

    const parsed = createCvSchema.safeParse(req.body);
    if (!parsed.success) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ error: 'Invalid input.', details: parsed.error.flatten().fieldErrors });
    }

    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(req.file.mimetype) || !allowedExtensions.has(fileExtension)) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
      return res.status(400).json({ error: 'Only PDF, DOC, and DOCX files are allowed.' });
    }

    const fallbackName = req.file.originalname.replace(/\.[^/.]+$/, '').trim() || 'CV document';
    const name = parsed.data.name?.trim() || fallbackName;

    const cv = await prisma.cvDocument.create({
      data: {
        userId: req.user!.id,
        name,
        filePath: `/uploads/cvs/${req.file.filename}`,
        originalFileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      },
      select: {
        id: true,
        name: true,
        filePath: true,
        originalFileName: true,
        mimeType: true,
        size: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return res.status(201).json({ message: 'CV uploaded.', cv });
  } catch (error) {
    if (req.file) {
      await fs.promises.unlink(req.file.path).catch(() => undefined);
    }
    console.error('Error uploading CV:', error);
    return res.status(500).json({ error: 'Failed to upload CV.' });
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cvId = String(req.params.id);
    const existing = await prisma.cvDocument.findFirst({
      where: { id: cvId, userId: req.user!.id },
      select: { id: true, filePath: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'CV not found.' });
    }

    await prisma.cvDocument.delete({ where: { id: existing.id } });

    const fileAbsolutePath = path.resolve(__dirname, '../../', existing.filePath.replace(/^\//, ''));
    await fs.promises.unlink(fileAbsolutePath).catch(() => undefined);

    return res.json({ message: 'CV deleted.' });
  } catch (error) {
    console.error('Error deleting CV:', error);
    return res.status(500).json({ error: 'Failed to delete CV.' });
  }
});

router.get('/:id/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cvId = String(req.params.id);
    const existing = await prisma.cvDocument.findFirst({
      where: { id: cvId, userId: req.user!.id },
      select: {
        id: true,
        filePath: true,
        originalFileName: true,
        mimeType: true
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'CV not found.' });
    }

    const fileAbsolutePath = path.resolve(__dirname, '../../', existing.filePath.replace(/^\//, ''));
    const fileExists = await fs.promises
      .access(fileAbsolutePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      return res.status(404).json({ error: 'CV file not found on server.' });
    }

    res.setHeader('Content-Type', existing.mimeType);
    return res.download(fileAbsolutePath, existing.originalFileName);
  } catch (error) {
    console.error('Error downloading CV:', error);
    return res.status(500).json({ error: 'Failed to download CV.' });
  }
});

router.get('/:id/preview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cvId = String(req.params.id);
    const existing = await prisma.cvDocument.findFirst({
      where: { id: cvId, userId: req.user!.id },
      select: {
        id: true,
        filePath: true,
        originalFileName: true,
        mimeType: true
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'CV not found.' });
    }

    if (existing.mimeType !== 'application/pdf') {
      return res.status(400).json({ error: 'Preview is only available for PDF files.' });
    }

    const fileAbsolutePath = path.resolve(__dirname, '../../', existing.filePath.replace(/^\//, ''));
    const fileExists = await fs.promises
      .access(fileAbsolutePath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      return res.status(404).json({ error: 'CV file not found on server.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${existing.originalFileName}"`);
    return res.sendFile(fileAbsolutePath);
  } catch (error) {
    console.error('Error previewing CV:', error);
    return res.status(500).json({ error: 'Failed to preview CV.' });
  }
});

router.use((error: unknown, _req: AuthenticatedRequest, res: Response, _next: Function) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Maximum file size is 5MB.' });
  }

  console.error('CV upload route error:', error);
  return res.status(500).json({ error: 'Failed to process CV upload.' });
});

export default router;
