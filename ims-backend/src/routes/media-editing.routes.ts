import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireMediaSubModule, requireEditingManager } from '../middleware/rbac';

const router = Router();
router.use(authenticate, requireMediaSubModule('EDITING'));

// ─── EDITING PROJECT ROUTES ───────────────────────────────────────────────────

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  deadline: z.string().datetime(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).default('PENDING'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  deadline: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
});

// GET /api/v1/media/editing/projects
router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    const where: any = {};

    if (status) where.status = status as string;
    if (search) where.title = { contains: search as string };

    const projects = await prisma.editingProject.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/media/editing/projects/stats
router.get('/projects/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, pending, inProgress, completed, onHold] = await Promise.all([
      prisma.editingProject.count(),
      prisma.editingProject.count({ where: { status: 'PENDING' } }),
      prisma.editingProject.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.editingProject.count({ where: { status: 'COMPLETED' } }),
      prisma.editingProject.count({ where: { status: 'ON_HOLD' } }),
    ]);
    res.json({ total, pending, inProgress, completed, onHold });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/media/editing/projects
router.post('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await prisma.editingProject.create({
      data: {
        title: data.title,
        description: data.description,
        deadline: new Date(data.deadline),
        status: data.status,
        createdById: req.user!.id,
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/media/editing/projects/:id
router.get('/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.editingProject.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        tasks: {
          include: { assignee: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/media/editing/projects/:id (manager only for status changes)
router.patch('/projects/:id', requireEditingManager(), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProjectSchema.parse(req.body);
    const project = await prisma.editingProject.update({
      where: { id: req.params.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.status && { status: data.status }),
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// ─── EDITING TASK ROUTES ───────────────────────────────────────────────────────

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigneeId: z.string().min(1, 'Assignee is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  deadline: z.string().datetime().optional(),
  fileUrl: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).default('PENDING'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  deadline: z.string().datetime().optional(),
  fileUrl: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
});

// GET /api/v1/media/editing/tasks
router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, status, priority, search } = req.query;
    const where: any = {};

    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as string;
    if (priority) where.priority = priority as string;
    if (search) where.title = { contains: search as string };

    const tasks = await prisma.editingTask.findMany({
      where,
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/media/editing/tasks
router.post('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await prisma.editingTask.create({
      data: {
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : null,
        fileUrl: data.fileUrl,
        status: data.status,
      },
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/media/editing/tasks/:id
router.get('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.editingTask.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/media/editing/tasks/:id
router.patch('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateTaskSchema.parse(req.body);

    // Only managers can change status
    if (data.status) {
      if (req.user!.role !== 'MANAGER' && req.user!.role !== 'ADMIN') {
        res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Only managers can change task status' 
        });
        return;
      }
    }

    const task = await prisma.editingTask.update({
      where: { id: req.params.id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.assigneeId && { assigneeId: data.assigneeId }),
        ...(data.priority && { priority: data.priority }),
        ...(data.deadline && { deadline: new Date(data.deadline) }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.status && { status: data.status }),
      },
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/media/editing/tasks/:id/comments
const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty'),
});

router.post('/tasks/:id/comments', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = commentSchema.parse(req.body);
    const comment = await prisma.editingComment.create({
      data: {
        taskId: req.params.id,
        authorId: req.user!.id,
        body,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

export default router;
