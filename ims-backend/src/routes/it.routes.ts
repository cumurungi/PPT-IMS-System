import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = req.user!.role === 'ADMIN' || req.user!.department === 'IT' ? {} : { createdById: req.user!.id };
    const tickets = await prisma.supportTicket.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(tickets);
  } catch (err) { next(err); }
});

router.post('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.supportTicket.create({ data: { ...req.body, createdById: req.user!.id } });
    res.status(201).json(ticket);
  } catch (err) { next(err); }
});

router.patch('/tickets/:id', requireDepartment('IT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data: req.body });
    res.json(ticket);
  } catch (err) { next(err); }
});

router.get('/queue', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = await prisma.publishingQueue.findMany({ orderBy: { priority: 'asc' }, include: { recording: true, platforms: true } });
    res.json(queue);
  } catch (err) { next(err); }
});

router.get('/platforms', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const platforms = await prisma.platform.findMany({ orderBy: { name: 'asc' } });
    res.json(platforms);
  } catch (err) { next(err); }
});

router.post('/platforms', requireDepartment('IT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = await prisma.platform.create({ data: req.body });
    res.status(201).json(platform);
  } catch (err) { next(err); }
});

router.get('/storage', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const quotas = await prisma.storageQuota.findMany();
    res.json(quotas);
  } catch (err) { next(err); }
});

export default router;
