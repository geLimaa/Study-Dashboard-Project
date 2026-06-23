import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

const habitSchema = z.object({
  title: z.string().min(2),
  frequency: z.enum(['Diario', 'Seg-Sex', 'Semanal']).default('Diario'),
  streak: z.number().int().min(0).default(0),
  doneToday: z.boolean().default(false),
});

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user.id },
    orderBy: [{ createdAt: 'desc' }],
  });

  return res.json({ status: 'ok', habits });
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = habitSchema.parse(req.body);

  const habit = await prisma.habit.create({
    data: { ...data, userId: req.user.id },
  });

  return res.status(201).json({ status: 'ok', habit });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const data = habitSchema.partial().parse(req.body);

  const updated = await prisma.habit.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data,
  });

  if (updated.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Habit not found',
    });
  }

  const habit = await prisma.habit.findUnique({ where: { id: req.params.id } });

  return res.json({ status: 'ok', habit });
}));

router.post('/:id/check-in', asyncHandler(async (req, res) => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (!habit) {
    return res.status(404).json({
      status: 'error',
      message: 'Habit not found',
    });
  }

  const nextDoneToday = !habit.doneToday;
  const nextStreak = nextDoneToday ? habit.streak + 1 : Math.max(0, habit.streak - 1);

  const updated = await prisma.habit.update({
    where: { id: habit.id },
    data: {
      doneToday: nextDoneToday,
      streak: nextStreak,
    },
  });

  return res.json({ status: 'ok', habit: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await prisma.habit.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });

  if (deleted.count === 0) {
    return res.status(404).json({
      status: 'error',
      message: 'Habit not found',
    });
  }

  return res.status(204).send();
}));

export default router;

