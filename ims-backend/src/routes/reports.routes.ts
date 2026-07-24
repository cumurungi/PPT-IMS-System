import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

async function getPreacherIdsForUser(user: { name: string; email?: string | null }) {
  const conditions: any[] = [{ name: user.name }];
  if (user.email) conditions.push({ email: user.email });

  const preachers = await prisma.preacher.findMany({
    where: { OR: conditions },
    select: { id: true },
  });
  return preachers.map((preacher) => preacher.id);
}

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
      select: { id: true, name: true, email: true, department: true, role: true },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
    });

    // For each user, gather their weekly activity
    const reports = await Promise.all(users.map(async (u) => {
      const isEvang = u.department === 'EVANGELISM';
      const preacherIds = isEvang ? await getPreacherIdsForUser(u) : [];

      // For Evangelism we should not include task-related stats/details (they are reported via sermons/audiobooks)
      let tasksCompleted = 0;
      let tasksInProgress = 0;
      let tasksCreated = 0;
      let ticketsHandled = 0;
      let totalCompleted = 0;

      if (!isEvang) {
        [tasksCompleted, tasksInProgress, tasksCreated, ticketsHandled, totalCompleted] = await Promise.all([
          prisma.task.count({ where: { assigneeId: u.id, status: 'COMPLETED', updatedAt: { gte: weekStart, lte: weekEnd } } }),
          prisma.task.count({ where: { assigneeId: u.id, status: { in: ['IN_PROGRESS', 'IN_REVIEW'] } } }),
          prisma.task.count({ where: { createdById: u.id, createdAt: { gte: weekStart, lte: weekEnd } } }),
          prisma.supportTicket.count({ where: { assigneeId: u.id, updatedAt: { gte: weekStart, lte: weekEnd } } }),
          prisma.task.count({ where: { assigneeId: u.id, status: 'COMPLETED' } }),
        ]);
      }

      const isMedia = u.department === 'MEDIA';

      // Next week date range (used for next-week tasks and recordings)
      const nextWeekStart = new Date(weekEnd);
      nextWeekStart.setDate(nextWeekStart.getDate() + 1);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      // Recordings touched this week: editor or assignee, created or updated within the week
      const recordingsWorkedOn = await prisma.recording.findMany({
        where: {
          AND: [
            { OR: [{ editorId: u.id }, { recordingAssigneeId: u.id }] },
            { OR: [{ updatedAt: { gte: weekStart, lte: weekEnd } }, { createdAt: { gte: weekStart, lte: weekEnd } }] },
          ],
        },
        select: { title: true, status: true, editingDueDate: true },
        take: 20,
      });

      // Split worked-on recordings into "done" / "in progress" / "next week"
      const DONE_STATUSES = ['EDITED', 'APPROVED', 'PUBLISHED'];
      const IN_PROGRESS_STATUSES = ['IN_EDITING'];
      const NEXT_WEEK_STATUSES = ['CAPTURED'];
      const recordingsDone = recordingsWorkedOn.filter((r) => DONE_STATUSES.includes(r.status));
      const recordingsInProgress = recordingsWorkedOn.filter((r) => IN_PROGRESS_STATUSES.includes(r.status));
      const capturedThisWeek = recordingsWorkedOn.filter((r) => NEXT_WEEK_STATUSES.includes(r.status));

      // Recordings planned to be worked on next week (captured + open edits with due date in next week)
      const nextWeekRecordingsQuery = isMedia ? await prisma.recording.findMany({
        where: {
          AND: [
            { OR: [{ editorId: u.id }, { recordingAssigneeId: u.id }] },
            { status: { in: ['CAPTURED', 'IN_EDITING'] } },
            { editingDueDate: { gte: nextWeekStart, lte: nextWeekEnd } },
          ],
        },
        select: { title: true, status: true, editingDueDate: true },
        take: 15,
      }) : [];
      const nextWeekRecordings = [...nextWeekRecordingsQuery, ...capturedThisWeek.filter(r => !nextWeekRecordingsQuery.find(q => q.title === r.title))];

      // Sermons scheduled this week (by event date, not creation date)
      const sermonsScheduled = await prisma.event.findMany({
        where: isEvang
          ? { preachers: { some: { preacherId: { in: preacherIds } } }, date: { gte: weekStart, lte: weekEnd } }
          : { createdById: u.id, date: { gte: weekStart, lte: weekEnd } },
        select: { title: true, sourceTaskId: true },
        take: 20,
      });

      // Events auto-created from completed tasks this week
      const eventsFromTasks = isEvang ? [] : await prisma.event.findMany({
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

      // Task-related details: skip for Evangelism
      const completedTaskDetails = isEvang ? [] : await prisma.task.findMany({
        where: { assigneeId: u.id, status: 'COMPLETED', updatedAt: { gte: weekStart, lte: weekEnd } },
        select: { title: true, updatedAt: true },
        take: 10,
      });

      // If nothing completed this week, show recent completions for context
      const recentCompleted = isEvang ? [] : (completedTaskDetails.length === 0
        ? await prisma.task.findMany({
            where: { assigneeId: u.id, status: 'COMPLETED' },
            select: { title: true, updatedAt: true },
            orderBy: { updatedAt: 'desc' },
            take: 5,
          })
        : []);

      // Get task titles in progress
      const inProgressTaskDetails = isEvang ? [] : await prisma.task.findMany({
        where: { assigneeId: u.id, status: { in: ['IN_PROGRESS', 'IN_REVIEW'] } },
        select: { title: true },
        take: 10,
      });

      // Tasks created/assigned to others this week (for managers/admin)
      const tasksAssignedToOthers = isEvang ? [] : await prisma.task.findMany({
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
      const nextWeekTasks = isEvang ? [] : await prisma.task.findMany({
        where: {
          assigneeId: u.id,
          status: { not: 'COMPLETED' },
        },
        select: { title: true, status: true, deadline: true },
        orderBy: { deadline: 'asc' },
        take: 15,
      });

      // Events this week (sermons done/recorded this week — based on recording status)
      const eventsThisWeek = await prisma.event.findMany({
        where: {
          date: { gte: weekStart, lte: weekEnd },
          preachers: { some: { preacherId: { in: preacherIds } } },
          recordings: { some: { status: { in: ['EDITED', 'APPROVED', 'PUBLISHED'] } } },
        },
        select: { title: true, date: true, status: true, eventType: true, sourceTask: { select: { title: true } }, recordings: { select: { status: true } } },
        orderBy: { date: 'asc' },
        take: 20,
      });

      // Events in progress this week (sermons being edited — recording status IN_EDITING)
      const eventsInProgress = isEvang ? await prisma.event.findMany({
        where: {
          date: { gte: weekStart, lte: weekEnd },
          preachers: { some: { preacherId: { in: preacherIds } } },
          recordings: { some: { status: 'IN_EDITING' } },
        },
        select: { title: true, date: true, status: true, eventType: true, sourceTask: { select: { title: true } }, recordings: { select: { status: true } } },
        orderBy: { date: 'asc' },
        take: 20,
      }) : [];

      // Events next week (sermons with captured recordings planned for next week)
      const eventsNextWeek = await prisma.event.findMany({
        where: {
          date: { gte: nextWeekStart, lte: nextWeekEnd },
          preachers: { some: { preacherId: { in: preacherIds } } },
          recordings: { some: { status: 'CAPTURED' } },
        },
        select: { title: true, date: true, status: true, eventType: true, sourceTask: { select: { title: true } }, recordings: { select: { status: true } } },
        orderBy: { date: 'asc' },
        take: 20,
      });

      return {
        user: { id: u.id, name: u.name, department: u.department, role: u.role },
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        summary: {
          tasksCompleted,
          totalCompleted,
          tasksInProgress,
          tasksCreated,
          recordingsWorked: recordingsWorkedOn.length,
          recordingsDone: recordingsDone.length,
          recordingsInProgress: recordingsInProgress.length,
          sermonsScheduled: sermonsScheduled.length,
          eventsFromTasks: eventsFromTasks.length,
          eventsThisWeek: eventsThisWeek.length,
          eventsInProgress: eventsInProgress.length,
          eventsNextWeek: eventsNextWeek.length,
          ticketsHandled,
          published: userPublished.length,
          approvalsDone: approvalsDone.length,
          // Unified Done / In Progress / Next Week counts for consistent UI
          doneThisWeek: isMedia
            ? recordingsDone.length
            : isEvang
              ? eventsThisWeek.length + approvalsDone.length
              : tasksCompleted + userPublished.length,
          inProgress: isMedia
            ? recordingsInProgress.length
            : isEvang
              ? eventsInProgress.length
              : tasksInProgress + ticketDetails.length,
          nextWeekCount: isMedia
            ? nextWeekRecordings.length
            : isEvang
              ? eventsNextWeek.length
              : nextWeekTasks.length,
        },
        details: {
          completedTasks: completedTaskDetails.map(t => t.title),
          recentCompleted: recentCompleted.map(t => `${t.title} (${new Date(t.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`),
          inProgressTasks: inProgressTaskDetails.map(t => t.title),
          tasksAssigned: tasksAssignedToOthers.map(t => `${t.title} → ${t.assignee?.name}`),
          recordingsDone: recordingsDone.map(r => `${r.title} (${r.status.replace('_', ' ')})`),
          recordingsInProgress: recordingsInProgress.map(r => `${r.title} (${r.status.replace('_', ' ')})`),
          nextWeekRecordings: nextWeekRecordings.map(r => {
            const due = r.editingDueDate ? new Date(r.editingDueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
            return `${r.title}${due ? ` (due ${due})` : ''}`;
          }),
          sermons: sermonsScheduled.map(s => s.title),
          eventsFromTasks: eventsFromTasks.map(e => `${e.title} ← Task: "${e.sourceTask?.title}" (${e.status})`),
          eventsThisWeek: eventsThisWeek.map(e => ({
            title: e.title,
            date: e.date,
            status: e.status,
            type: e.eventType,
            fromTask: e.sourceTask?.title || null,
            recordings: e.recordings,
          })),
          eventsInProgress: eventsInProgress.map(e => ({
            title: e.title,
            date: e.date,
            status: e.status,
            type: e.eventType,
            fromTask: e.sourceTask?.title || null,
            recordings: e.recordings,
          })),
          eventsNextWeek: eventsNextWeek.map(e => ({
            title: e.title,
            date: e.date,
            status: e.status,
            type: e.eventType,
            fromTask: e.sourceTask?.title || null,
            recordings: e.recordings,
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
