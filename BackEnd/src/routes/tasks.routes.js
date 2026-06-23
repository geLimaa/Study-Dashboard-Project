import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const taskSchema = z.object({
  title: z.string().min(2),
  course: z.string().min(2),
  dueDateLabel: z.string().min(1),
  priority: z.enum(['Baixa', 'Media', 'Alta']).default('Media'),
  status: z.enum(['Pendente', 'Em progresso', 'Concluida']).default('Pendente'),
  notes: z.string().optional(),
});

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user.id },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  return res.json({ status: 'ok', tasks });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = taskSchema.parse(req.body);

  const task = await prisma.task.create({
    data: { ...data, userId: req.user.id },
  });

  return res.status(201).json({ status: 'ok', task });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = taskSchema.partial().parse(req.body);

  const task = await prisma.task.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data,
  });

  if (task.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Task not found',
    });
  }

  const updated = await prisma.task.findUnique({ where: { id: req.params.id } });

  return res.json({ status: 'ok', task: updated });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const data = z.object({
    status: z.enum(['Pendente', 'Em progresso', 'Concluida']),
  }).parse(req.body);

  const task = await prisma.task.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data,
  });

  if (task.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Task not found',
    });
  }

  const updated = await prisma.task.findUnique({ where: { id: req.params.id } });

  return res.json({ status: 'ok', task: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const task = await prisma.task.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (task.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Task not found',
    });
  }

  return res.status(204).send();
}));

export default router;

