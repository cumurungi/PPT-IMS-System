import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/employees', requireDepartment('HR_FINANCE'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await prisma.employeeProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, department: true } } },
    });
    res.json(employees);
  } catch (err) { next(err); }
});

router.post('/attendance/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendanceRecord.create({ data: { userId: req.user!.id, date: today, checkIn: new Date() } });
    res.status(201).json(record);
  } catch (err) { next(err); }
});

router.post('/attendance/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceRecord.findUnique({ where: { userId_date: { userId: req.user!.id, date: today } } });
    if (!existing) { res.status(404).json({ error: 'No check-in found for today' }); return; }
    const checkOut = new Date();
    const totalHours = existing.checkIn ? (checkOut.getTime() - existing.checkIn.getTime()) / 3600000 : 0;
    const record = await prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkOut, totalHours } });
    res.json(record);
  } catch (err) { next(err); }
});

router.get('/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.id };
    const requests = await prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(requests);
  } catch (err) { next(err); }
});

router.post('/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const leave = await prisma.leaveRequest.create({ data: { ...req.body, userId: req.user!.id } });
    res.status(201).json(leave);
  } catch (err) { next(err); }
});

router.get('/expenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = req.user!.role === 'ADMIN' ? {} : { userId: req.user!.id };
    const expenses = await prisma.expenseRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(expenses);
  } catch (err) { next(err); }
});

router.post('/expenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await prisma.expenseRequest.create({ data: { ...req.body, userId: req.user!.id } });
    res.status(201).json(expense);
  } catch (err) { next(err); }
});

export default router;
