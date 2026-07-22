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
  projectId: z.string().optional(),
  crossDepartment: z.boolean().optional(),
});

const sermonKeywords = ['sermon', 'record', 'recording', 'studio', 'preacher', 'message', 'audio'];

function looksLikeSermonTask(task: any) {
  const text = `${task.title || ''} ${task.description || ''} ${task.project?.name || ''}`.toLowerCase();
  const isEvangelismTask =
    task.assignee?.department === 'EVANGELISM' ||
    task.project?.department === 'EVANGELISM' ||
    task.createdBy?.department === 'EVANGELISM';

  return isEvangelismTask && sermonKeywords.some((keyword) => text.includes(keyword));
}

async function createSermonFromTask(task: any, requestedById: string) {
  const existing = await prisma.event.findFirst({ where: { sourceTaskId: task.id } });
  if (existing) return { sermon: existing, mediaRequest: null };

  const sermon = await prisma.event.create({
    data: {
      title: task.title,
      description: task.description || null,
      date: task.deadline || new Date(),
      location: 'Studio',
      eventType: 'Single Sermon',
      status: 'PLANNED',
      sourceTaskId: task.id,
      createdById: requestedById,
    },
  });

  const mediaRequest = await prisma.mediaRequest.create({
    data: {
      eventId: sermon.id,
      requestedById,
      recordingType: 'Studio Recording',
      requestedDate: task.deadline || new Date(),
      status: 'PENDING',
    },
  });

  try {
    const { sendEmail } = require('../lib/email');
    const mediaManager = await prisma.user.findFirst({
      where: { department: 'MEDIA', role: 'MANAGER', isActive: true },
      select: { id: true, email: true },
    });
    if (mediaManager) {
      await prisma.notification.create({
        data: {
          userId: mediaManager.id,
          type: 'APPROVAL_REQUIRED',
          title: 'New sermon to record',
          body: `Task created: "${task.title}" — auto-scheduled for recording.`,
          entityType: 'MediaRequest',
          entityId: mediaRequest.id,
        },
      }).catch(() => {});
      sendEmail({
        to: mediaManager.email,
        subject: `[IMS] 🎬 New sermon to record: ${task.title}`,
        text: `A new sermon task was created in Evangelism and has been auto-scheduled for recording:\n\nTitle: ${task.title}\n\nPlease log in to accept and assign a recorder.`,
        html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🎬 New Sermon Auto-Scheduled</h2><p>An Evangelism task was created and triggered a recording request:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📖 Title:</strong> ${task.title}</p></div><p>Please log in to accept and assign a recorder.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
      });
    }
  } catch (autoErr) { console.error('[Auto-schedule] Failed:', autoErr); }

  return { sermon, mediaRequest };
}

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
      // Manager sees department tasks (including tasks without projects).
      // Do NOT include tasks merely created by the manager for other departments —
      // managers should only see tasks that are in their department or assigned
      // to department members.
      where.OR = [
        { project: { department: user.department as any } },
        { projectId: null, assignee: { department: user.department as any } },
      ];
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

// GET /api/v1/tasks/upcoming — current user's tasks due soon (or overdue), for the dashboard "Due Soon" widget
router.get('/upcoming', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 86400000);

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: user.id,
        status: { not: 'COMPLETED' },
        deadline: { lte: weekFromNow },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        deadline: true,
        project: { select: { id: true, name: true } },
      },
    });

    const result = tasks.map((t: any) => {
      const deadline = new Date(t.deadline);
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / 86400000);
      return {
        id: t.id,
        title: t.title,
        project: t.project?.name || '—',
        isOverdue: diffDays < 0,
        isToday: diffDays === 0,
        dueLabel: diffDays < 0
          ? `${Math.abs(diffDays)}d overdue`
          : diffDays === 0
            ? 'Today'
            : diffDays === 1
              ? 'Tomorrow'
              : `${diffDays}d left`,
        deadline: t.deadline,
      };
    });

    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/v1/tasks/assignable-users — users this person can assign tasks to
router.get('/assignable-users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const where: any = { isActive: true };

    if (user.role === 'MANAGER') {
      // Managers see only their department members
      where.department = user.department;
    } else if (user.role === 'EMPLOYEE') {
      // Employees can only assign to themselves
      where.id = user.id;
    }
    // Admin sees everyone

    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true, department: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
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
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const user = req.user!;

    // Employees can only create tasks assigned to themselves
    if (user.role === 'EMPLOYEE') {
      data.assigneeId = user.id;
    }

    // Managers can only assign to their own department members
    if (user.role === 'MANAGER' && data.assigneeId !== user.id) {
      const assignee = await prisma.user.findUnique({ where: { id: data.assigneeId }, select: { department: true } });
      if (assignee && assignee.department !== user.department) {
        res.status(403).json({ error: 'Forbidden', message: 'You can only assign tasks to employees in your department' });
        return;
      }
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        deadline: new Date(data.deadline),
        projectId: data.projectId || null,
        createdById: user.id,
        crossDepartment: data.crossDepartment || false,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, department: true } },
      },
    });

    // Send email notification
    // If employee created it (self-assigned), notify their manager
    // If manager assigned it, notify the assignee
    try {
      const { sendTaskAssignedEmail, sendEmail } = require('../lib/email');
      if (user.role === 'EMPLOYEE') {
        // Notify the department manager that an employee created a task
        const manager = await prisma.user.findFirst({
          where: { department: user.department as any, role: 'MANAGER', isActive: true },
          select: { email: true, name: true },
        });
        if (manager) {
          sendEmail({
            to: manager.email,
            subject: `[IMS] New task from ${user.name}: ${task.title}`,
            text: `${user.name} created a new task "${task.title}" in project "${task.project?.name}". Please review and accept or deny it.`,
            html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">📋 New Task Created</h2><p><strong>${user.name}</strong> created a new task that needs your review:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📋 Task:</strong> ${task.title}</p><p style="margin:4px 0;"><strong>📁 Project:</strong> ${task.project?.name}</p></div><p>Please log in to accept or deny it.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
          });
        }
      } else if (task.assignee?.email && task.assigneeId !== user.id) {
        sendTaskAssignedEmail(task.assignee.email, task.assignee.name, task.title, task.project?.name || 'Unknown');
      }
    } catch {}

    if (looksLikeSermonTask(task)) {
      await createSermonFromTask(task, user.id);
    }

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
    const user = req.user!;
    const body = req.body;

    // Employees can only update the status of their own assigned tasks
    if (user.role === 'EMPLOYEE') {
      const task = await prisma.task.findUniqueOrThrow({ where: { id: req.params.id } });
      if (task.assigneeId !== user.id) {
        res.status(403).json({ error: 'Forbidden', message: 'You can only update tasks assigned to you' });
        return;
      }
      // Employees may only change status — not reassign, retitle, or change project
      const allowedFields = ['status'];
      const attempted = Object.keys(body).filter(k => !allowedFields.includes(k));
      if (attempted.length > 0) {
        res.status(403).json({ error: 'Forbidden', message: 'Employees can only update task status' });
        return;
      }
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: body,
      include: {
        assignee: { select: { id: true, name: true, email: true, department: true } },
        project: { select: { id: true, name: true, department: true } },
        linkedEvents: { select: { id: true, title: true, status: true, date: true } },
      },
    });

    // Auto-trigger: When an Evangelism sermon task is marked COMPLETED, ensure it already has a sermon entry.
    if (body.status === 'COMPLETED' && looksLikeSermonTask(task)) {
      try {
        await createSermonFromTask(task, user.id);
      } catch (autoErr) { console.error('[Auto-schedule] Failed:', autoErr); }
    }

    res.json(task);
  } catch (err) { next(err); }
});

// POST /api/v1/tasks/:id/accept — Assignee accepts the task
router.post('/:id/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await prisma.task.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (task.assigneeId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Only the assignee can accept/deny a task' });
      return;
    }

    // Move to IN_PROGRESS on accept
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, department: true } },
      },
    });

    // Email the creator that task was accepted
    try {
      const { sendEmail } = require('../lib/email');
      if (task.createdBy?.email) {
        sendEmail({
          to: task.createdBy.email,
          subject: `[IMS] ✅ Task accepted: ${task.title}`,
          text: `${task.assignee?.name} has accepted the task "${task.title}" in project "${task.project?.name}".`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#16a34a;">✅ Task Accepted</h2><p><strong>${task.assignee?.name}</strong> has accepted the task:</p><div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📋 Task:</strong> ${task.title}</p><p style="margin:4px 0;"><strong>📁 Project:</strong> ${task.project?.name}</p></div><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.json(updated);
  } catch (err) { next(err); }
});

// POST /api/v1/tasks/:id/deny — Assignee denies the task
router.post('/:id/deny', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = z.object({ reason: z.string().min(1) }).parse(req.body);

    const task = await prisma.task.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (task.assigneeId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Only the assignee can accept/deny a task' });
      return;
    }

    // Move to BLOCKED on deny
    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status: 'BLOCKED' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, department: true } },
      },
    });

    // Add a comment explaining the denial
    await prisma.taskComment.create({
      data: { taskId: req.params.id, authorId: req.user!.id, body: `❌ Task denied: ${reason}` },
    });

    // Email the creator that task was denied
    try {
      const { sendEmail } = require('../lib/email');
      if (task.createdBy?.email) {
        sendEmail({
          to: task.createdBy.email,
          subject: `[IMS] ❌ Task denied: ${task.title}`,
          text: `${task.assignee?.name} has denied the task "${task.title}".\n\nReason: ${reason}`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#dc2626;">❌ Task Denied</h2><p><strong>${task.assignee?.name}</strong> has denied the task:</p><div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📋 Task:</strong> ${task.title}</p><p style="margin:4px 0;"><strong>📁 Project:</strong> ${task.project?.name}</p><p style="margin:4px 0;"><strong>💬 Reason:</strong> ${reason}</p></div><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.json(updated);
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
