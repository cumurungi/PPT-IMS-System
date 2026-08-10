import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

const evangOnly = requireDepartment('EVANGELISM');

// ─── SERMON SCHEDULE (stored as Event in DB) ─────────────────────────────────
// We use the existing Event model but treat it as a Sermon Schedule.
// eventType  = programme series (e.g. "Evangelistic Series", "Sabbath School")
// location   = defaults to "Studio" — can be overridden for off-site recordings
// status:    PLANNED=Scheduled, CONFIRMED=Confirmed, IN_PROGRESS=Recording,
//            COMPLETED=Recorded, CANCELLED=Cancelled

const createSermonSchema = z.object({
  title: z.string().min(1),                        // sermon title
  scheduledDate: z.string(),                        // ISO datetime — recording date/time
  series: z.string().min(1),                        // programme series / category
  scriptureReference: z.string().optional(),        // e.g. "Revelation 14:6-12"
  description: z.string().optional(),               // brief outline
  location: z.string().optional(),                  // defaults to "Studio"
  preacherIds: z.array(z.string()).optional(),
});

const updateSermonSchema = z.object({
  title: z.string().min(1).optional(),
  scheduledDate: z.string().optional(),
  series: z.string().min(1).optional(),
  scriptureReference: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  preacherIds: z.array(z.string()).optional(),
});

// GET /api/v1/evangelism/sermons
router.get('/sermons', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, series } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (series) where.eventType = series as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        // scriptureReference and description stored in the location / eventType
        // fields aren't ideal but we store extra data via eventType = series
      ];
    }

    const sermons = await prisma.event.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        preachers: {
          include: { preacher: { select: { id: true, name: true, specialization: true } } },
        },
        mediaRequests: {
          select: { id: true, status: true, recordingType: true },
        },
        recordings: {
          select: { id: true, title: true, status: true, editingProgress: true },
        },
        _count: { select: { recordings: true, mediaRequests: true } },
      },
    });

    // Map DB fields back to sermon vocabulary
    const result = sermons.map(mapToSermon);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/v1/evangelism/sermons/stats
router.get('/sermons/stats', evangOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, scheduled, confirmed, recording, recorded, cancelled] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'PLANNED' } }),
      prisma.event.count({ where: { status: 'CONFIRMED' } }),
      prisma.event.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.event.count({ where: { status: 'COMPLETED' } }),
      prisma.event.count({ where: { status: 'CANCELLED' } }),
    ]);
    res.json({ total, scheduled, confirmed, recording, recorded, cancelled });
  } catch (err) { next(err); }
});

// POST /api/v1/evangelism/sermons
// When a sermon is scheduled, automatically create a media request so the
// Media team is notified immediately — no separate manual step needed.
router.post('/sermons', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSermonSchema.parse(req.body);

    const sermon = await prisma.event.create({
      data: {
        title: data.title,
        date: new Date(data.scheduledDate),
        location: data.location || 'Studio',
        eventType: data.series,          // reuse eventType for series
        status: 'PLANNED',
        createdById: req.user!.id,
        preachers: data.preacherIds?.length
          ? {
              create: data.preacherIds.map((preacherId) => ({
                preacher: { connect: { id: preacherId } },
              })),
            }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        preachers: {
          include: { preacher: { select: { id: true, name: true, specialization: true } } },
        },
      },
    });

    // Auto-create a media request so Media team sees it immediately
    const mediaRequest = await prisma.mediaRequest.create({
      data: {
        eventId: sermon.id,
        requestedById: req.user!.id,
        recordingType: 'Studio Recording',
        requestedDate: new Date(data.scheduledDate),
        status: 'PENDING',
      },
    });

    // Notify Media Manager by email + notification
    try {
      const { sendEmail } = require('../lib/email');
      const requester = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
      const mediaManager = await prisma.user.findFirst({
        where: { department: 'MEDIA', role: 'MANAGER', isActive: true },
        select: { id: true, email: true, name: true },
      });
      if (mediaManager) {
        await prisma.notification.create({
          data: { userId: mediaManager.id, type: 'APPROVAL_REQUIRED', title: 'New sermon to record', body: `${requester?.name} scheduled "${data.title}" for ${data.scheduledDate.split('T')[0]}`, entityType: 'MediaRequest', entityId: mediaRequest.id },
        }).catch(() => {});
        sendEmail({
          to: mediaManager.email,
          subject: `[IMS] 🎬 New sermon to record: ${data.title}`,
          text: `A new sermon has been scheduled for recording:\n\nTitle: ${data.title}\nDate: ${data.scheduledDate}\nScheduled by: ${requester?.name}\n\nPlease log in to IMS to accept and assign a team member.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🎬 New Sermon to Record</h2><p>A new sermon has been scheduled:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📖 Title:</strong> ${data.title}</p><p style="margin:4px 0;"><strong>📅 Date:</strong> ${data.scheduledDate.split('T')[0]}</p><p style="margin:4px 0;"><strong>👤 By:</strong> ${requester?.name}</p></div><p>Please log in to accept and assign a recorder.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }

      // Notify the Evangelism Manager so they are aware a sermon was scheduled
      const evangelismManager = await prisma.user.findFirst({
        where: { department: 'EVANGELISM', role: 'MANAGER', isActive: true },
        select: { id: true, email: true, name: true },
      });
      if (evangelismManager && evangelismManager.id !== req.user!.id) {
        await prisma.notification.create({
          data: { userId: evangelismManager.id, type: 'WORKFLOW_ALERT', title: 'New sermon scheduled', body: `${requester?.name} scheduled "${data.title}" for ${data.scheduledDate.split('T')[0]}`, entityType: 'Sermon', entityId: sermon.id },
        }).catch(() => {});
        sendEmail({
          to: evangelismManager.email,
          subject: `[IMS] 📖 New sermon scheduled: ${data.title}`,
          text: `A new sermon has been scheduled:\n\nTitle: ${data.title}\nDate: ${data.scheduledDate}\nScheduled by: ${requester?.name}\n\nPlease log in to IMS to review.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">📖 New Sermon Scheduled</h2><p>A new sermon has been scheduled:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📖 Title:</strong> ${data.title}</p><p style="margin:4px 0;"><strong>📅 Date:</strong> ${data.scheduledDate.split('T')[0]}</p><p style="margin:4px 0;"><strong>👤 By:</strong> ${requester?.name}</p></div><p>Please log in to review.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.status(201).json({ ...mapToSermon(sermon), mediaRequestId: mediaRequest.id });
  } catch (err) { next(err); }
});

// GET /api/v1/evangelism/sermons/:id
router.get('/sermons/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sermon = await prisma.event.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true } },
        preachers: { include: { preacher: true } },
        mediaRequests: {
          include: { requestedBy: { select: { id: true, name: true } } },
        },
        recordings: { select: { id: true, title: true, status: true, format: true, editingProgress: true } },
        reports: { select: { id: true, status: true, attendanceCount: true, createdAt: true } },
      },
    });
    res.json(mapToSermon(sermon));
  } catch (err) { next(err); }
});

// PATCH /api/v1/evangelism/sermons/:id
router.patch('/sermons/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSermonSchema.parse(req.body);

    // Status transitions (confirm, cancel, etc.) are manager-only
    if (data.status && req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only managers can change sermon status' });
      return;
    }

    const { preacherIds, scheduledDate, series, scriptureReference, ...rest } = data;

    const updateData: any = { ...rest };
    if (scheduledDate) updateData.date = new Date(scheduledDate);
    if (series) updateData.eventType = series;

    if (preacherIds !== undefined) {
      await prisma.eventPreacher.deleteMany({ where: { eventId: req.params.id } });
      updateData.preachers = preacherIds.length
        ? { create: preacherIds.map((id) => ({ preacher: { connect: { id } } })) }
        : undefined;
    }

    const sermon = await prisma.event.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, name: true } },
        preachers: {
          include: { preacher: { select: { id: true, name: true, specialization: true } } },
        },
        mediaRequests: { select: { id: true, status: true } },
        recordings: { select: { id: true, title: true, status: true } },
        _count: { select: { recordings: true, mediaRequests: true } },
      },
    });
    res.json(mapToSermon(sermon));
  } catch (err) { next(err); }
});

// DELETE /api/v1/evangelism/sermons/:id
router.delete('/sermons/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── ACTIVITY SUMMARY (Tasks + Events unified view) ──────────────────────────
// Provides a single endpoint that shows:
// - Completed tasks this week with their linked events
// - Upcoming tasks for next week
// - Events (sermons) scheduled from task completions
// This is the "professional" connection between Report → Task → Event

router.get('/activity-summary', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    // Calculate week range
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

    // Next week range
    const nextWeekStart = new Date(weekEnd);
    nextWeekStart.setDate(nextWeekStart.getDate() + 1);
    nextWeekStart.setHours(0, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);

    // Determine user filter (managers see whole department, employees see themselves)
    const userFilter = user.role === 'ADMIN' || user.role === 'MANAGER'
      ? { assignee: { department: 'EVANGELISM' as any } }
      : { assigneeId: user.id };

    // 1. Tasks completed this week (with linked events)
    const completedTasks = await prisma.task.findMany({
      where: {
        ...userFilter,
        status: 'COMPLETED',
        updatedAt: { gte: weekStart, lte: weekEnd },
      },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        linkedEvents: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            eventType: true,
            mediaRequests: { select: { id: true, status: true } },
            recordings: { select: { id: true, title: true, status: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Tasks currently in progress
    const inProgressTasks = await prisma.task.findMany({
      where: {
        ...userFilter,
        status: { in: ['IN_PROGRESS', 'IN_REVIEW'] },
      },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    // 3. Upcoming tasks (TODO or IN_PROGRESS, deadline in next week)
    const upcomingTasks = await prisma.task.findMany({
      where: {
        ...userFilter,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        deadline: { gte: nextWeekStart, lte: nextWeekEnd },
      },
      include: {
        assignee: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { deadline: 'asc' },
    });

    // 4. Events created this week (from completed tasks)
    const eventsFromTasks = await prisma.event.findMany({
      where: {
        sourceTaskId: { not: null },
        createdAt: { gte: weekStart, lte: weekEnd },
      },
      include: {
        sourceTask: { select: { id: true, title: true, assignee: { select: { name: true } } } },
        mediaRequests: { select: { id: true, status: true, recordingType: true } },
        recordings: { select: { id: true, title: true, status: true } },
        preachers: { include: { preacher: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 5. All upcoming events (sermons) regardless of source
    const upcomingEvents = await prisma.event.findMany({
      where: {
        date: { gte: now },
        status: { in: ['PLANNED', 'CONFIRMED'] },
      },
      include: {
        sourceTask: { select: { id: true, title: true } },
        mediaRequests: { select: { id: true, status: true } },
        preachers: { include: { preacher: { select: { id: true, name: true } } } },
      },
      orderBy: { date: 'asc' },
      take: 10,
    });

    // Summary stats
    const stats = {
      tasksCompletedThisWeek: completedTasks.length,
      tasksInProgress: inProgressTasks.length,
      tasksUpcomingNextWeek: upcomingTasks.length,
      eventsCreatedFromTasks: eventsFromTasks.length,
      upcomingEvents: upcomingEvents.length,
    };

    res.json({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      stats,
      completedTasks: completedTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        project: t.project,
        completedAt: t.updatedAt,
        linkedEvent: t.linkedEvents[0] || null, // most recent linked event
      })),
      inProgressTasks: inProgressTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        project: t.project,
        deadline: t.deadline,
      })),
      upcomingTasks: upcomingTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assignee: t.assignee,
        project: t.project,
        deadline: t.deadline,
      })),
      eventsFromTasks,
      upcomingEvents,
    });
  } catch (err) { next(err); }
});

// ─── PREACHERS ────────────────────────────────────────────────────────────────

const createPreacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  specialization: z.string().min(1),
  notes: z.string().optional(),
});

// GET /api/v1/evangelism/preachers
router.get('/preachers', evangOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const preachers = await prisma.preacher.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { events: true } } },
    });
    res.json(preachers);
  } catch (err) { next(err); }
});

// POST /api/v1/evangelism/preachers
router.post('/preachers', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only managers can add preachers' });
      return;
    }
    const data = createPreacherSchema.parse(req.body);
    const payload: any = { ...data };
    if (!payload.email) delete payload.email;
    const preacher = await prisma.preacher.create({ data: payload });
    res.status(201).json(preacher);
  } catch (err) { next(err); }
});

// GET /api/v1/evangelism/preachers/:id
router.get('/preachers/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preacher = await prisma.preacher.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        events: {
          include: { event: { select: { id: true, title: true, date: true, status: true } } },
          orderBy: { event: { date: 'desc' } },
        },
      },
    });
    res.json(preacher);
  } catch (err) { next(err); }
});

// PATCH /api/v1/evangelism/preachers/:id
router.patch('/preachers/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only managers can edit preachers' });
      return;
    }
    const data = createPreacherSchema.partial().parse(req.body);
    const preacher = await prisma.preacher.update({ where: { id: req.params.id }, data });
    res.json(preacher);
  } catch (err) { next(err); }
});

// DELETE /api/v1/evangelism/preachers/:id
router.delete('/preachers/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only managers can delete preachers' });
      return;
    }
    await prisma.preacher.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── MEDIA REQUESTS (evangelism side — read-only view of their requests) ──────

// GET /api/v1/evangelism/pending-approvals — recordings waiting for preacher approval
router.get('/pending-approvals', evangOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const recordings = await prisma.recording.findMany({
      where: { status: 'EDITED' },
      orderBy: { updatedAt: 'desc' },
      include: {
        event: { select: { id: true, title: true } },
        editor: { select: { id: true, name: true } },
      },
    });
    res.json(recordings);
  } catch (err) { next(err); }
});

// GET /api/v1/evangelism/media-requests
router.get('/media-requests', evangOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.mediaRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { id: true, title: true, date: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });
    res.json(requests);
  } catch (err) { next(err); }
});

// ─── HELPER ───────────────────────────────────────────────────────────────────

function mapToSermon(event: any) {
  return {
    ...event,
    scheduledDate: event.date,
    series: event.eventType,
    // keep original fields too so nothing breaks
  };
}

// ─── AUDIOBOOKS (Evangelism-managed recordings) ───────────────────────────────
// Books with chapters — record chapter by chapter, tick them off, upload ZIP, manager approves

const createAudiobookSchema = z.object({
  bookName: z.string().min(1),
  reader: z.string().min(1),
  chapters: z.array(z.string().min(1)).min(1),
});

// GET /api/v1/evangelism/audiobooks
router.get('/audiobooks', evangOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "Audiobook" ORDER BY "createdAt" DESC`
    );
    // Parse chapters JSON
    const result = rows.map(r => ({
      ...r,
      chapters: r.chapters ? JSON.parse(r.chapters) : [],
      approved: r.approved === 1 || r.approved === true,
    }));
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/v1/evangelism/audiobooks
router.post('/audiobooks', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAudiobookSchema.parse(req.body);
    const id = require('crypto').randomBytes(12).toString('hex');
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const chapters = JSON.stringify(data.chapters.map(title => ({ title, done: false })));
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Audiobook" (id, bookName, reader, chapters, fileUrl, approved, createdById, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NULL, 0, $5, $6, $7)`,
      id, data.bookName, data.reader, chapters, req.user!.id, now, now
    );
    const [audiobook] = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Audiobook" WHERE id = $1`, id);
    res.status(201).json({ ...audiobook, chapters: JSON.parse(audiobook.chapters || '[]'), approved: false });
  } catch (err) { next(err); }
});

// PATCH /api/v1/evangelism/audiobooks/:id — update fileUrl, approved, bookName, reader, chapters
router.patch('/audiobooks/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fileUrl, approved, bookName, reader, chapters } = req.body;
    const sets: string[] = [];
    const values: any[] = [];

    if (fileUrl !== undefined) { sets.push('"fileUrl" = $' + (values.length + 1)); values.push(fileUrl); }
    if (approved !== undefined) { sets.push('"approved" = $' + (values.length + 1)); values.push(approved ? 1 : 0); }
    if (bookName !== undefined) { sets.push('"bookName" = $' + (values.length + 1)); values.push(bookName); }
    if (reader !== undefined) { sets.push('"reader" = $' + (values.length + 1)); values.push(reader); }
    if (chapters !== undefined) { sets.push('"chapters" = $' + (values.length + 1)); values.push(JSON.stringify(chapters)); }

    if (sets.length === 0) { res.status(400).json({ error: 'Nothing to update' }); return; }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    sets.push('"updatedAt" = $' + (values.length + 1));
    values.push(now);
    values.push(req.params.id);

    const idPlaceholder = '$' + (values.length);
    await prisma.$executeRawUnsafe(`UPDATE "Audiobook" SET ${sets.join(', ')} WHERE id = ${idPlaceholder}`, ...values);
    const [audiobook] = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "Audiobook" WHERE id = $1`, req.params.id);
    res.json({ ...audiobook, chapters: JSON.parse(audiobook.chapters || '[]'), approved: audiobook.approved === 1 });
  } catch (err) { next(err); }
});

// PATCH /api/v1/evangelism/audiobooks/:id/chapters/:index — toggle chapter done
router.patch('/audiobooks/:id/chapters/:index', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { done } = req.body;
    const idx = parseInt(req.params.index);
    const [audiobook] = await prisma.$queryRawUnsafe<any[]>(`SELECT chapters FROM "Audiobook" WHERE id = $1`, req.params.id);
    if (!audiobook) { res.status(404).json({ error: 'Not found' }); return; }

    const chapters = JSON.parse(audiobook.chapters || '[]');
    if (idx < 0 || idx >= chapters.length) { res.status(400).json({ error: 'Invalid chapter index' }); return; }

    chapters[idx].done = !!done;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await prisma.$executeRawUnsafe(
      `UPDATE "Audiobook" SET chapters = $1, "updatedAt" = $2 WHERE id = $3`,
      JSON.stringify(chapters), now, req.params.id
    );
    res.json({ chapters });
  } catch (err) { next(err); }
});

// DELETE /api/v1/evangelism/audiobooks/:id
router.delete('/audiobooks/:id', evangOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Audiobook" WHERE id = $1`, req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
