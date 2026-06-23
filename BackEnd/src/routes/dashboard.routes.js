import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const [tasks, habits, studies, communities, files] = await Promise.all([
    prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.habit.findMany({
      where: { userId: req.user.id },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.study.findMany({
      where: { userId: req.user.id },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.community.findMany({
      orderBy: [{ members: 'desc' }, { createdAt: 'desc' }],
      take: 3,
    }),
    prisma.file.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { userId: null },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 3,
    }),
  ]);

  const completedTasks = tasks.filter((task) => task.status === 'Concluida').length;
  const doneHabits = habits.filter((habit) => habit.doneToday).length;
  const studyHours = studies.reduce((total, study) => total + study.hours, 0);

  return res.json({
    status: 'ok',
    summary: {
      tasks: {
        total: tasks.length,
        completed: completedTasks,
      },
      habits: {
        total: habits.length,
        doneToday: doneHabits,
      },
      studies: {
        totalHours: studyHours,
      },
      communities: {
        total: communities.length,
      },
    },
    tasks,
    habits,
    studies,
    communities,
    files,
  });
}));

export default router;

