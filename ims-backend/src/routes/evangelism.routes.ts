import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate, requireDepartment('EVANGELISM'));

router.get('/events', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({ orderBy: { date: 'desc' }, include: { preachers: true } });
    res.json(events);
  } catch (err) { next(err); }
});

router.post('/events', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.create({ data: { ...req.body, createdById: req.user!.id } });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

router.get('/preachers', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const preachers = await prisma.preacher.findMany({ orderBy: { name: 'asc' } });
    res.json(preachers);
  } catch (err) { next(err); }
});

router.post('/preachers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preacher = await prisma.preacher.create({ data: req.body });
    res.status(201).json(preacher);
  } catch (err) { next(err); }
});

export default router;
