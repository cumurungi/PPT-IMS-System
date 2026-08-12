import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = ['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE'];
    const counts = await Promise.all(
      departments.map(async (dept) => ({
        department: dept,
        memberCount: await prisma.user.count({ where: { department: dept as any, isActive: true } }),
      }))
    );
    res.json(counts);
  } catch (err) { next(err); }
});

const createDepartmentSchema = z.object({
  department: z.enum(['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE']),
  managerId: z.string().optional(),
  description: z.string().optional(),
});

// GET /api/v1/departments/:id — department details with members
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = req.params.id;
    const members = await prisma.user.findMany({
      where: { department: dept as any, isActive: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    const manager = members.find(m => m.role === 'MANAGER');
    const projectCount = await prisma.project.count({ where: { department: dept as any, isActive: true } });
    res.json({ department: dept, manager, members, memberCount: members.length, projectCount });
  } catch (err) { next(err); }
});

// POST /api/v1/departments — create a new department (admin only)
router.post('/', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createDepartmentSchema.parse(req.body);
    const existing = await prisma.user.findFirst({ where: { department: data.department } });
    if (existing) {
      res.status(409).json({ error: 'Department already exists', message: `Department ${data.department} already has members` });
      return;
    }
    res.status(201).json({ department: data.department, description: data.description || '' });
  } catch (err) { next(err); }
});

// PATCH /api/v1/departments/:id — update department settings (admin only)
router.patch('/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = req.params.id;
    const { managerId, description } = req.body;
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } });
      if (!manager || manager.department !== dept) {
        res.status(400).json({ error: 'Invalid manager', message: 'Manager must belong to this department' });
        return;
      }
    }
    res.json({ department: dept, managerId, description: description || '' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/departments/:id — remove department (admin only, reassigns members)
router.delete('/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = req.params.id;
    await prisma.user.updateMany({
      where: { department: dept as any },
      data: { department: null as any },
    });
    await prisma.project.updateMany({
      where: { department: dept as any },
      data: { department: null as any, isActive: false },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
