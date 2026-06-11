import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = req.user!.role === 'ADMIN' || req.user!.role === 'MANAGER' ? {} : { userId: req.user!.id };
    const reports = await prisma.weeklyReport.findMany({ where, orderBy: { weekStartDate: 'desc' } });
    res.json(reports);
  } catch (err) { next(err); }
});

router.post('/weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.weeklyReport.create({ data: { ...req.body, userId: req.user!.id, submittedAt: new Date() } });
    res.status(201).json(report);
  } catch (err) { next(err); }
});

router.patch('/weekly/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.weeklyReport.update({ where: { id: req.params.id }, data: { ...req.body, reviewedById: req.user!.id } });
    res.json(report);
  } catch (err) { next(err); }
});

router.get('/performance/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notes = await prisma.performanceNote.findMany({ where: { subjectId: req.params.userId }, orderBy: { createdAt: 'desc' } });
    res.json(notes);
  } catch (err) { next(err); }
});

export default router;
