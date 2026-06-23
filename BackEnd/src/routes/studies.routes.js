import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const studySchema = z.object({
  title: z.string().min(2),
  progress: z.number().int().min(0).max(100).default(0),
  hours: z.number().min(0).default(0),
  color: z.string().min(2).default('blue'),
});

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const studies = await prisma.study.findMany({
    where: { userId: req.user.id },
    orderBy: [{ createdAt: 'desc' }],
  });

  return res.json({ status: 'ok', studies });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = studySchema.parse(req.body);

  const study = await prisma.study.create({
    data: { ...data, userId: req.user.id },
  });

  return res.status(201).json({ status: 'ok', study });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = studySchema.partial().parse(req.body);

  const updated = await prisma.study.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data,
  });

  if (updated.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Study not found',
    });
  }

  const study = await prisma.study.findUnique({ where: { id: req.params.id } });

  return res.json({ status: 'ok', study });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await prisma.study.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (deleted.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Study not found',
    });
  }

  return res.status(204).send();
}));

export default router;

