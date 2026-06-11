import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  assigneeId: z.string(),
  deadline: z.string(),
  projectId: z.string(),
  crossDepartment: z.boolean().optional(),
});

// GET /api/v1/tasks
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { status, department, assignee, project, search, sort, order } = req.query;

    // Build where clause based on role
    const where: any = {};

    if (user.role === 'ADMIN') {
      // Admin sees all tasks, can filter by department
      if (department) where.project = { department: department as any };
    } else if (user.role === 'MANAGER') {
      // Manager sees department tasks
      where.project = { department: user.department as any };
    } else {
      // Employee sees only their tasks
      where.assigneeId = user.id;
    }

    // Optional filters
    if (status) where.status = status as string;
    if (assignee) where.assigneeId = assignee as string;
    if (project) where.projectId = project as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    // Sorting
    const orderBy: any = {};
    const sortField = (sort as string) || 'createdAt';
    const sortOrder = (order as string) || 'desc';
    orderBy[sortField] = sortOrder;

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, department: true } },
        _count: { select: { comments: true, attachments: true } },
      },
    });

    res.json(tasks);
  } catch (err) { next(err); }
});

// GET /api/v1/tasks/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const baseWhere: any = {};

    if (user.role === 'MANAGER') {
      baseWhere.project = { department: user.department as any };
    } else if (user.role === 'EMPLOYEE') {
      baseWhere.assigneeId = user.id;
    }

    const [total, todo, inProgress, inReview, completed, blocked, overdue] = await Promise.all([
      prisma.task.count({ where: baseWhere }),
      prisma.task.count({ where: { ...baseWhere, status: 'TODO' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'IN_REVIEW' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
      prisma.task.count({ where: { ...baseWhere, status: 'BLOCKED' } }),
      prisma.task.count({ where: { ...baseWhere, status: { not: 'COMPLETED' }, deadline: { lt: new Date() } } }),
    ]);

    res.json({ total, todo, inProgress, inReview, completed, blocked, overdue });
  } catch (err) { next(err); }
});

// POST /api/v1/tasks
router.post('/', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.task.create({
      data: { ...data, deadline: new Date(data.deadline), createdById: req.user!.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, department: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) { next(err); }
});

// GET /api/v1/tasks/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, department: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
        attachments: true,
      },
    });
    res.json(task);
  } catch (err) { next(err); }
});

// PATCH /api/v1/tasks/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, department: true } },
      },
    });
    res.json(task);
  } catch (err) { next(err); }
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// GET /api/v1/tasks/:id/comments
router.get('/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true } } },
    });
    res.json(comments);
  } catch (err) { next(err); }
});

// POST /api/v1/tasks/:id/comments
router.post('/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await prisma.taskComment.create({
      data: { taskId: req.params.id, authorId: req.user!.id, body: req.body.body },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json(comment);
  } catch (err) { next(err); }
});

export default router;
