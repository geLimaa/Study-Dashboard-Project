import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const fileSchema = z.object({
  name: z.string().min(2),
  area: z.string().min(2),
  dateLabel: z.string().min(1),
  storagePath: z.string().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  size: z.number().int().optional().nullable(),
});

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      callback(null, `${crypto.randomUUID()}-${safeName}`);
    },
  }),
});

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const files = await prisma.file.findMany({
    where: {
      OR: [
        { userId: req.user.id },
        { userId: null },
      ],
    },
    orderBy: [{ createdAt: 'desc' }],
  });

  return res.json({
    status: 'ok',
    files: files.map((file) => serializeFile(file, req)),
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = fileSchema.parse(req.body);

  const file = await prisma.file.create({
    data: {
      ...data,
      userId: req.user.id,
    },
  });

  return res.status(201).json({ status: 'ok', file: serializeFile(file, req) });
}));

router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status: 'error',
      message: 'File is required',
    });
  }

  const data = {
    name: req.file.originalname,
    area: req.body.area || 'Arquivos',
    dateLabel: 'Hoje',
    storagePath: path.join('uploads', req.file.filename),
    mimeType: req.file.mimetype,
    size: req.file.size,
  };

  const file = await prisma.file.create({
    data: {
      ...data,
      userId: req.user.id,
    },
  });

  return res.status(201).json({ status: 'ok', file: serializeFile(file, req) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const file = await prisma.file.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!file) {
    return res.status(404).json({
      status: 'error',
      message: 'File not found',
    });
  }

  if (file.storagePath) {
    const fullPath = path.join(__dirname, '..', '..', '..', file.storagePath);
    await fs.promises.unlink(fullPath).catch(() => null);
  }

  await prisma.file.delete({
    where: { id: file.id },
  });

  return res.status(204).send();
}));

function serializeFile(file, req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  return {
    ...file,
    downloadUrl: file.storagePath ? `${baseUrl}/${file.storagePath.replace(/\\/g, '/')}` : null,
  };
}

export default router;
