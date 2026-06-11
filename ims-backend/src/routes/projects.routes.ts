import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  department: z.enum(['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE']),
  deadline: z.string(),
});

// GET /api/v1/projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { department, search, status } = req.query;

    const where: any = { isActive: true };

    // Role-based filtering
    if (user.role === 'ADMIN') {
      if (department) where.department = department as any;
    } else {
      where.department = user.department as any;
    }

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true },
        },
      },
    });

    // Compute progress for each project
    const result = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter(t => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const overdueTasks = p.tasks.filter(t => t.status !== 'COMPLETED').length; // simplified

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        department: p.department,
        deadline: p.deadline,
        isActive: p.isActive,
        createdBy: p.createdBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        taskCount: totalTasks,
        completedTasks,
        progress,
        statusBreakdown: {
          TODO: p.tasks.filter(t => t.status === 'TODO').length,
          IN_PROGRESS: p.tasks.filter(t => t.status === 'IN_PROGRESS').length,
          IN_REVIEW: p.tasks.filter(t => t.status === 'IN_REVIEW').length,
          COMPLETED: completedTasks,
          BLOCKED: p.tasks.filter(t => t.status === 'BLOCKED').length,
        },
      };
    });

    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/v1/projects/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const baseWhere: any = { isActive: true };

    if (user.role !== 'ADMIN') {
      baseWhere.department = user.department as any;
    }

    const [total, byDept] = await Promise.all([
      prisma.project.count({ where: baseWhere }),
      prisma.project.groupBy({
        by: ['department'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    res.json({ total, byDepartment: byDept });
  } catch (err) { next(err); }
});

// POST /api/v1/projects
router.post('/', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: { ...data, deadline: new Date(data.deadline), createdById: req.user!.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
});

// GET /api/v1/projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            _count: { select: { comments: true, attachments: true } },
          },
        },
      },
    });

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;

    res.json({
      ...project,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      taskCount: totalTasks,
      completedTasks,
    });
  } catch (err) { next(err); }
});

// PATCH /api/v1/projects/:id
router.patch('/:id', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.json(project);
  } catch (err) { next(err); }
});

// DELETE /api/v1/projects/:id (soft delete)
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.project.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
