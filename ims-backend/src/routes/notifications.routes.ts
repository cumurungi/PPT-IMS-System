import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(notifications);
  } catch (err) { next(err); }
});

router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json(notification);
  } catch (err) { next(err); }
});

router.patch('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

export default router;
