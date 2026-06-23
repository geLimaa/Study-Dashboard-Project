import { Router } from 'express';
import authRoutes from './auth.routes.js';
import tasksRoutes from './tasks.routes.js';
import habitsRoutes from './habits.routes.js';
import studiesRoutes from './studies.routes.js';
import communitiesRoutes from './communities.routes.js';
import filesRoutes from './files.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StudyFlow API',
  });
});

router.use('/auth', authRoutes);
router.use('/tasks', tasksRoutes);
router.use('/habits', habitsRoutes);
router.use('/studies', studiesRoutes);
router.use('/communities', communitiesRoutes);
router.use('/files', filesRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;

