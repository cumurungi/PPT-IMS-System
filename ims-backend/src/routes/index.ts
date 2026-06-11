import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import departmentsRoutes from './departments.routes';
import projectsRoutes from './projects.routes';
import tasksRoutes from './tasks.routes';
import mediaRoutes from './media.routes';
import evangelismRoutes from './evangelism.routes';
import hrRoutes from './hr.routes';
import itRoutes from './it.routes';
import reportsRoutes from './reports.routes';
import notificationsRoutes from './notifications.routes';
import searchRoutes from './search.routes';
import auditRoutes from './audit.routes';
import dashboardRoutes from './dashboard.routes';
import uploadRoutes from './upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/media', mediaRoutes);
router.use('/evangelism', evangelismRoutes);
router.use('/hr', hrRoutes);
router.use('/it', itRoutes);
router.use('/reports', reportsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/upload', uploadRoutes);

export default router;
