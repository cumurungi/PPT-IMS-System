import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/v1/reports/auto-weekly — auto-generated weekly report from system data
router.get('/auto-weekly', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Calculate this week's date range (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Allow custom week via query
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : monday;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Determine which users to report on
    let userFilter: any = {};
    if (user.role === 'ADMIN') {
      // Admin sees all — grouped by department
    } else if (user.role === 'MANAGER') {
      // Manager sees their department
      userFilter = { department: user.department };
    } else {
      // Employee sees only themselves
      userFilter = { id: user.id };
    }

    const users = await prisma.user.findMany({
      where: { isActive: true, ...userFilter },
      select: { id: true, name: true, department: true, role: true },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
    });

    // For each user, gather their weekly activity
    const reports = await Promise.all(users.map(async (u) => {
      const [tasksCompleted, tasksInProgress, tasksCreated, ticketsHandled, totalCompleted] = await Promise.all([
        prisma.task.count({ where: { assigneeId: u.id, status: 'COMPLETED', updatedAt: { gte: weekStart, lte: weekEnd } } }),
        prisma.task.count({ where: { assigneeId: u.id, status: { in: ['IN_PROGRESS', 'IN_REVIEW'] } } }),
        prisma.task.count({ where: { createdById: u.id, createdAt: { gte: weekStart, lte: weekEnd } } }),
        prisma.supportTicket.count({ where: { assigneeId: u.id, updatedAt: { gte: weekStart, lte: weekEnd } } }),
        prisma.task.count({ where: { assigneeId: u.id, status: 'COMPLETED' } }),
      ]);

      // Recordings: any recording where user is editor or assignee that was touched this week
      const recordingsWorkedOn = await prisma.recording.findMany({
        where: {
          AND: [
            { OR: [{ editorId: u.id }, { recordingAssigneeId: u.id }] },
            { OR: [{ updatedAt: { gte: weekStart, lte: weekEnd } }, { createdAt: { gte: weekStart, lte: weekEnd } }] },
          ],
        },
        select: { title: true, status: true },
        take: 20,
      });

      // Sermons scheduled this week
      const sermonsScheduled = await prisma.event.findMany({
        where: { createdById: u.id, createdAt: { gte: weekStart, lte: weekEnd } },
        select: { title: true, sourceTaskId: true },
        take: 20,
      });

      // Events auto-created from completed tasks this week
      const eventsFromTasks = await prisma.event.findMany({
        where: {
          sourceTaskId: { not: null },
          createdAt: { gte: weekStart, lte: weekEnd },
          sourceTask: { assigneeId: u.id },
        },
        select: { title: true, status: true, date: true, sourceTask: { select: { title: true } } },
        take: 20,
      });

      // Approvals done this week (for preachers)
      const approvalsDone = await prisma.contentApproval.findMany({
        where: { approverId: u.id, createdAt: { gte: weekStart, lte: weekEnd } },
        include: { recording: { select: { title: true } } },
        take: 20,
      });

      // Published this week (for IT — show items this specific user published)
      const publishedThisWeek = await prisma.publishingQueue.findMany({
        where: { publishedById: u.id, publishedAt: { gte: weekStart, lte: weekEnd } },
        include: {
          recording: { select: { title: true } },
          platforms: { include: { platform: { select: { name: true } } } },
        },
      });
      const userPublished = publishedThisWeek;

      // Get task titles completed this week
      const completedTaskDetails = await prisma.task.findMany({
        where: { assigneeId: u.id, status: 'COMPLETED', updatedAt: { gte: weekStart, lte: weekEnd } },
        select: { title: true, updatedAt: true },
        take: 10,
      });

      // If nothing completed this week, show recent completions for context
      const recentCompleted = completedTaskDetails.length === 0
        ? await prisma.task.findMany({
            where: { assigneeId: u.id, status: 'COMPLETED' },
            select: { title: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 5,
          })
        : [];

      // Get task titles in progress
      const inProgressTaskDetails = await prisma.task.findMany({
        where: { assigneeId: u.id, status: { in: ['IN_PROGRESS', 'IN_REVIEW'] } },
        select: { title: true },
        take: 10,
      });

      // Tasks created/assigned to others this week (for managers/admin)
      const tasksAssignedToOthers = await prisma.task.findMany({
        where: { createdById: u.id, assigneeId: { not: u.id }, createdAt: { gte: weekStart, lte: weekEnd } },
        select: { title: true, assignee: { select: { name: true } } },
        take: 10,
      });

      // Tickets handled this week
      const ticketDetails = await prisma.supportTicket.findMany({
        where: { assigneeId: u.id, updatedAt: { gte: weekStart, lte: weekEnd } },
        select: { title: true, status: true },
        take: 10,
      });

      // Next week tasks
      const nextWeekStart = new Date(weekEnd);
      nextWeekStart.setDate(nextWeekStart.getDate() + 1);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      const nextWeekTasks = await prisma.task.findMany({
        where: {
          assigneeId: u.id,
          status: { not: 'COMPLETED' },
        },
        select: { title: true, status: true, deadline: true },
        orderBy: { deadline: 'asc' },
        take: 15,
      });

      // Events this week (sermons that happened / are happening this week)
      const eventsThisWeek = await prisma.event.findMany({
        where: {
          date: { gte: weekStart, lte: weekEnd },
        },
        select: { title: true, date: true, status: true, eventType: true, sourceTask: { select: { title: true } } },
        orderBy: { date: 'asc' },
        take: 20,
      });

      // Events next week (sermons planned for next week)
      const eventsNextWeek = await prisma.event.findMany({
        where: {
          date: { gte: nextWeekStart, lte: nextWeekEnd },
          status: { in: ['PLANNED', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        select: { title: true, date: true, status: true, eventType: true, sourceTask: { select: { title: true } } },
        orderBy: { date: 'asc' },
        take: 20,
      });

      return {
        user: u,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        summary: {
          tasksCompleted,
          totalCompleted,
          tasksInProgress,
          tasksCreated,
          recordingsWorked: recordingsWorkedOn.length,
          sermonsScheduled: sermonsScheduled.length,
          eventsFromTasks: eventsFromTasks.length,
          eventsThisWeek: eventsThisWeek.length,
          eventsNextWeek: eventsNextWeek.length,
          ticketsHandled,
          published: userPublished.length,
          approvalsDone: approvalsDone.length,
        },
        details: {
          completedTasks: completedTaskDetails.map(t => t.title),
          recentCompleted: recentCompleted.map(t => `${t.title} (${new Date(t.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`),
          inProgressTasks: inProgressTaskDetails.map(t => t.title),
          tasksAssigned: tasksAssignedToOthers.map(t => `${t.title} → ${t.assignee?.name}`),
          recordings: recordingsWorkedOn.map(r => `${r.title} (${r.status.replace('_', ' ')})`),
          sermons: sermonsScheduled.map(s => s.title),
          eventsFromTasks: eventsFromTasks.map(e => `${e.title} ← Task: "${e.sourceTask?.title}" (${e.status})`),
          eventsThisWeek: eventsThisWeek.map(e => ({
            title: e.title,
            date: e.date,
            status: e.status,
            type: e.eventType,
            fromTask: e.sourceTask?.title || null,
          })),
          eventsNextWeek: eventsNextWeek.map(e => ({
            title: e.title,
            date: e.date,
            status: e.status,
            type: e.eventType,
            fromTask: e.sourceTask?.title || null,
          })),
          approvals: approvalsDone.map(a => `${a.recording?.title} — ${a.decision ? 'Approved' : 'Rejected'}`),
          tickets: ticketDetails.map(t => `${t.title} — ${t.status}`),
          published: userPublished.map(p => `${p.recording?.title} → ${p.platforms.map(pp => pp.platform?.name).join(', ')}`),
          nextWeekTasks: nextWeekTasks.map(t => {
            const due = t.deadline ? new Date(t.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
            const statusLabel = t.status === 'TODO' ? '⬜' : t.status === 'IN_PROGRESS' ? '🔄' : t.status === 'IN_REVIEW' ? '👁️' : '🚫';
            return `${statusLabel} ${t.title}${due ? ` (due ${due})` : ''}`;
          }),
        },
      };
    }));

    // Group by department for admin/manager view
    const departments: Record<string, any[]> = {};
    for (const r of reports) {
      const dept = r.user.department || 'ADMIN';
      if (!departments[dept]) departments[dept] = [];
      departments[dept].push(r);
    }

    res.json({ weekStart: weekStart.toISOString(), weekEnd: weekEnd.toISOString(), departments, reports });
  } catch (err) { next(err); }
});

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
    if (req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only managers can review weekly reports' });
      return;
    }
    const report = await prisma.weeklyReport.update({
      where: { id: req.params.id },
      data: { ...req.body, reviewedById: req.user!.id },
    });
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
