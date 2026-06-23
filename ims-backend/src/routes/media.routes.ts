import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

// Most media routes are restricted to MEDIA department + ADMIN
// Assets routes (library) are accessible to all authenticated users so any
// department can save/view uploaded media assets.
const mediaOnly = requireDepartment('MEDIA');

// Valid status transitions for the recording workflow
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  CAPTURED: ['IN_EDITING'],
  IN_EDITING: ['EDITED'],
  EDITED: ['APPROVED', 'IN_EDITING'], // approve, or send back to editing on rejection
  APPROVED: ['PUBLISHED'],
  PUBLISHED: [],
};

// ─── RECORDINGS ──────────────────────────────────────────────────────────────

const createRecordingSchema = z.object({
  title: z.string().min(1),
  eventId: z.string().optional(),
  recordingDate: z.string(),
  durationSeconds: z.number().int().nonnegative(),
  format: z.string().min(1),
  recordingAssigneeId: z.string().optional(),
  editorId: z.string().optional(),
});

// GET /api/v1/media/recordings
router.get('/recordings', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, mine, stage } = req.query;
    const where: any = {};

    // Employees see only recordings assigned to them unless ?mine=false
    // Managers/Admins see all unless ?mine=true
    if (req.user!.role === 'EMPLOYEE' || mine === 'true') {
      where.OR = [
        { recordingAssigneeId: req.user!.id },
        { editorId: req.user!.id },
      ];
    }

    // Stage filter: 'capture' shows only CAPTURED, 'editing' shows IN_EDITING+EDITED, 'post' shows APPROVED+PUBLISHED
    if (stage === 'capture') {
      where.status = 'CAPTURED';
    } else if (stage === 'editing') {
      where.status = { in: ['IN_EDITING', 'EDITED', 'APPROVED', 'PUBLISHED'] };
    } else if (status) {
      where.status = status as string;
    }

    if (search) where.title = { contains: search as string };

    const recordings = await prisma.recording.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        editor: { select: { id: true, name: true } },
        recordingAssignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { assets: true, approvals: true } },
      },
    });
    res.json(recordings);
  } catch (err) { next(err); }
});

// GET /api/v1/media/recordings/stats
router.get('/recordings/stats', mediaOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, captured, inEditing, edited, approved, published] = await Promise.all([
      prisma.recording.count(),
      prisma.recording.count({ where: { status: 'CAPTURED' } }),
      prisma.recording.count({ where: { status: 'IN_EDITING' } }),
      prisma.recording.count({ where: { status: 'EDITED' } }),
      prisma.recording.count({ where: { status: 'APPROVED' } }),
      prisma.recording.count({ where: { status: 'PUBLISHED' } }),
    ]);
    res.json({ total, captured, inEditing, edited, approved, published });
  } catch (err) { next(err); }
});

router.get('/assignable-users', mediaOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { department: 'MEDIA' },
          { role: 'ADMIN' },
        ],
      },
      select: { id: true, name: true, email: true, role: true, department: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// GET /api/v1/media/evangelism-users — list evangelism dept users for preacher selection
router.get('/evangelism-users', mediaOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { department: 'EVANGELISM', isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// POST /api/v1/media/recordings
router.post('/recordings', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createRecordingSchema.parse(req.body);
    const recording = await prisma.recording.create({
      data: {
        title: data.title,
        eventId: data.eventId || null,
        recordingDate: new Date(data.recordingDate),
        durationSeconds: data.durationSeconds,
        format: data.format,
        status: 'CAPTURED',
        createdById: req.user!.id,
        recordingAssigneeId: data.recordingAssigneeId || null,
        editorId: data.editorId || null,
      },
      include: {
        editor: { select: { id: true, name: true } },
        recordingAssignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(recording);
  } catch (err) { next(err); }
});

// GET /api/v1/media/recordings/:id
router.get('/recordings/:id', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recording = await prisma.recording.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        editor: { select: { id: true, name: true } },
        recordingAssignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        assets: true,
        approvals: {
          orderBy: { createdAt: 'desc' },
          include: { approver: { select: { id: true, name: true } } },
        },
      },
    });
    res.json(recording);
  } catch (err) { next(err); }
});

// PATCH /api/v1/media/recordings/:id — general update (editing progress, etc.)
router.patch('/recordings/:id', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.recording.findUniqueOrThrow({ where: { id: req.params.id } });
    const updates: any = {};

    // Editing progress
    if (typeof req.body.editingProgress === 'number') {
      updates.editingProgress = Math.max(0, Math.min(100, req.body.editingProgress));
      // Auto-advance to EDITED when progress hits 100
      if (updates.editingProgress === 100 && current.status === 'IN_EDITING') {
        updates.status = 'EDITED';
      }
    }

    // Assign editor / start editing
    if (req.body.editorId) updates.editorId = req.body.editorId;
    if (req.body.recordingAssigneeId !== undefined) updates.recordingAssigneeId = req.body.recordingAssigneeId || null;
    if (req.body.editedVideoUrl !== undefined) updates.editedVideoUrl = req.body.editedVideoUrl || null;
    if (req.body.approvalVideoSource !== undefined) updates.approvalVideoSource = req.body.approvalVideoSource || null;
    if (req.body.title) updates.title = req.body.title;
    if (req.body.format) updates.format = req.body.format;

    const recording = await prisma.recording.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        editor: { select: { id: true, name: true } },
        recordingAssignee: { select: { id: true, name: true } },
      },
    });
    res.json(recording);
  } catch (err) { next(err); }
});

// POST /api/v1/media/recordings/:id/start-editing — assign editor + move to IN_EDITING
router.post('/recordings/:id/start-editing', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.recording.findUniqueOrThrow({
      where: { id: req.params.id },
      include: { event: { select: { title: true } } },
    });
    if (!ALLOWED_TRANSITIONS[current.status]?.includes('IN_EDITING')) {
      res.status(400).json({ error: 'Invalid transition', message: `Cannot start editing from ${current.status}` });
      return;
    }
    // Use explicitly provided editorId, or fall back to recordingAssignee, then the current user
    const editorId = req.body.editorId || current.recordingAssigneeId || req.user!.id;
    const recording = await prisma.recording.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_EDITING',
        editorId,
        editingProgress: 0,
      },
      include: {
        editor: { select: { id: true, name: true } },
        recordingAssignee: { select: { id: true, name: true } },
      },
    });

    // Auto-create an editing task so it shows up on the Editing page
    try {
      // Find or create a default editing project for recordings
      let editingProject = await prisma.editingProject.findFirst({
        where: { title: 'Sermon Recordings' },
      });
      if (!editingProject) {
        editingProject = await prisma.editingProject.create({
          data: {
            title: 'Sermon Recordings',
            description: 'Auto-created project for sermon recording edits',
            status: 'IN_PROGRESS',
            deadline: new Date(Date.now() + 30 * 86400000), // 30 days from now
            createdById: req.user!.id,
          },
        });
      }

      // Create the editing task linked to this recording
      await prisma.editingTask.create({
        data: {
          projectId: editingProject.id,
          title: `Edit: ${current.title}`,
          description: current.event?.title
            ? `Edit the recording for sermon "${current.event.title}"`
            : `Edit recording: ${current.title}`,
          assigneeId: editorId,
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          deadline: new Date(Date.now() + 7 * 86400000), // 7 days deadline
          fileUrl: (current as any).editedVideoUrl || null,
        },
      });
    } catch (editingErr) {
      console.error('[Auto-editing-task] Failed:', editingErr);
    }

    res.json(recording);
  } catch (err) { next(err); }
});

// POST /api/v1/media/recordings/:id/send-for-approval — Editor sends to preacher for approval
const sendForApprovalSchema = z.object({
  preacherUserId: z.string().min(1),  // The evangelism user who will approve
  videoLink: z.string().optional(),    // YouTube/private link for preacher to watch
});

router.post('/recordings/:id/send-for-approval', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { preacherUserId, videoLink } = sendForApprovalSchema.parse(req.body);
    const current = await prisma.recording.findUniqueOrThrow({ where: { id: req.params.id } });

    if (current.status !== 'EDITED') {
      res.status(400).json({ error: 'Invalid state', message: 'Recording must be in EDITED status to send for approval' });
      return;
    }

    // Save the video link and mark who should approve
    await prisma.recording.update({
      where: { id: req.params.id },
      data: {
        editedVideoUrl: videoLink || current.editedVideoUrl,
      },
    });

    // Notify the preacher (Evangelism user) by email + notification
    try {
      const { sendEmail } = require('../lib/email');
      const preacher = await prisma.user.findUnique({ where: { id: preacherUserId }, select: { id: true, email: true, name: true } });
      if (preacher) {
        await prisma.notification.create({
          data: { userId: preacher.id, type: 'APPROVAL_REQUIRED', title: 'Sermon ready for your approval', body: `"${current.title}" has been edited and needs your approval.`, entityType: 'Recording', entityId: req.params.id },
        }).catch(() => {});
        sendEmail({
          to: preacher.email,
          subject: `[IMS] 🎬 Sermon ready for approval: ${current.title}`,
          text: `Your sermon "${current.title}" has been edited and is ready for your approval.\n\n${videoLink ? 'Watch here: ' + videoLink + '\n\n' : ''}Please log in to IMS to approve or request changes.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🎬 Sermon Ready for Approval</h2><p>Your sermon has been edited and needs your approval:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>📖 Title:</strong> ${current.title}</p>${videoLink ? '<p style="margin:4px 0;"><strong>🔗 Watch:</strong> <a href="' + videoLink + '">' + videoLink + '</a></p>' : ''}</div><p>Please log in to IMS to approve or request changes.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.json({ message: 'Sent to preacher for approval' });
  } catch (err) { next(err); }
});

// POST /api/v1/media/recordings/:id/approve — Preacher (Evangelism) approves/rejects
const approvalSchema = z.object({
  decision: z.boolean(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

router.post('/recordings/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // All Evangelism dept users and Admins can approve
    const user = req.user!;
    if (user.department !== 'EVANGELISM' && user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden', message: 'Only Evangelism team members can approve sermons' });
      return;
    }

    const { decision, notes, rejectionReason } = approvalSchema.parse(req.body);
    const current = await prisma.recording.findUniqueOrThrow({ where: { id: req.params.id } });

    if (current.status !== 'EDITED') {
      res.status(400).json({ error: 'Invalid state', message: 'Recording must be in EDITED status to approve' });
      return;
    }

    const newStatus = decision ? 'APPROVED' : 'IN_EDITING';

    const [recording] = await prisma.$transaction([
      prisma.recording.update({
        where: { id: req.params.id },
        data: { status: newStatus, ...(decision ? {} : { editingProgress: 50 }) },
      }),
      prisma.contentApproval.create({
        data: {
          recordingId: req.params.id,
          approverId: req.user!.id,
          decision,
          notes: notes || null,
          rejectionReason: decision ? null : (rejectionReason || null),
        },
      }),
    ]);

    // If approved, auto-add to publishing queue and notify IT team
    if (decision) {
      await prisma.publishingQueue.create({
        data: { recordingId: req.params.id, priority: 50 },
      }).catch(() => {}); // ignore if already queued

      // Notify all IT department members (manager + employees)
      try {
        const { sendEmail } = require('../lib/email');
        const recordingTitle = current.title || 'Untitled';
        const itMembers = await prisma.user.findMany({
          where: { department: 'IT', isActive: true },
          select: { id: true, email: true, name: true },
        });
        for (const member of itMembers) {
          await prisma.notification.create({
            data: { userId: member.id, type: 'WORKFLOW_ALERT', title: 'New recording ready to publish', body: `"${recordingTitle}" has been approved and added to the publishing queue.`, entityType: 'Recording', entityId: req.params.id },
          }).catch(() => {});
          sendEmail({
            to: member.email,
            subject: `[IMS] 📡 Ready to publish: ${recordingTitle}`,
            text: `A recording has been approved and is ready to be published:\n\nTitle: ${recordingTitle}\n\nPlease log in to IMS and publish it on the platforms.`,
            html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">📡 Ready to Publish</h2><p>A recording has been approved and added to the publishing queue:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>🎬 Title:</strong> ${recordingTitle}</p></div><p>Please log in to IMS and publish it on YouTube, Website, App, Instagram, Facebook, TikTok.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
          });
        }
      } catch {}
    }

    res.json({ recording, message: decision ? 'Recording approved and queued for publishing' : 'Recording sent back for editing' });
  } catch (err) { next(err); }
});

// ─── MEDIA LIBRARY (ASSETS) ──────────────────────────────────────────────────

const createAssetSchema = z.object({
  title: z.string().min(1),
  fileUrl: z.string().min(1),
  fileType: z.string().min(1),
  fileSizeBytes: z.number().int().nonnegative(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
  recordingId: z.string().optional(),
});

// GET /api/v1/media/assets
router.get('/assets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category } = req.query;
    const where: any = {};
    if (category) where.category = category as string;
    if (search) where.title = { contains: search as string };

    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Parse tags JSON string + convert BigInt to string
    const result = assets.map((a) => ({
      ...a,
      fileSizeBytes: a.fileSizeBytes.toString(),
      tags: safeParseTags(a.tags),
    }));
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/v1/media/assets
router.post('/assets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAssetSchema.parse(req.body);
    const asset = await prisma.mediaAsset.create({
      data: {
        title: data.title,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSizeBytes: BigInt(data.fileSizeBytes),
        category: data.category,
        tags: JSON.stringify(data.tags || []),
        thumbnailUrl: data.thumbnailUrl || null,
        recordingId: data.recordingId || null,
        uploadedById: req.user!.id,
      },
    });
    res.status(201).json({ ...asset, fileSizeBytes: asset.fileSizeBytes.toString(), tags: safeParseTags(asset.tags) });
  } catch (err) { next(err); }
});

// DELETE /api/v1/media/assets/:id
router.delete('/assets/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.mediaAsset.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// ─── MEDIA REQUESTS ──────────────────────────────────────────────────────────

// GET /api/v1/media/requests
router.get('/requests', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status as string;

    const requests = await prisma.mediaRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { id: true, title: true, date: true, location: true } },
        requestedBy: { select: { id: true, name: true, department: true } },
      },
    });
    res.json(requests);
  } catch (err) { next(err); }
});

// PATCH /api/v1/media/requests/:id — Media team accept or decline
const respondRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  declineReason: z.string().optional(),
  assignedToId: z.string().optional(), // team member assigned to do the recording
});

router.patch('/requests/:id', mediaOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = respondRequestSchema.parse(req.body);

    const mediaRequest = await prisma.mediaRequest.update({
      where: { id: req.params.id },
      data: {
        status: data.status,
        declineReason: data.status === 'DECLINED' ? (data.declineReason || null) : null,
      },
      include: {
        event: { select: { id: true, title: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    // When accepted, auto-create a Recording record linked to this event
    // and assign the chosen team member as recordingAssignee
    if (data.status === 'ACCEPTED') {
      const event = await prisma.event.findUnique({ where: { id: mediaRequest.eventId } });
      if (event) {
        await prisma.recording.create({
          data: {
            title: event.title,
            eventId: event.id,
            mediaRequestId: mediaRequest.id,
            recordingDate: event.date,
            durationSeconds: 0,
            format: 'MP4',
            status: 'CAPTURED',
            createdById: req.user!.id,
            recordingAssigneeId: data.assignedToId || null,
          },
        }).catch(() => {}); // ignore if recording already exists for this request

        // Email the assigned team member
        try {
          const { sendRecordingAssignedEmail } = require('../lib/email');
          if (data.assignedToId) {
            const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { id: true, email: true, name: true } });
            if (assignee) {
              sendRecordingAssignedEmail(assignee.email, assignee.name, event.title);
              await prisma.notification.create({
                data: { userId: assignee.id, type: 'TASK_ASSIGNED', title: 'Recording assigned to you', body: `"${event.title}" — please record this sermon.`, entityType: 'Recording', entityId: mediaRequest.id },
              }).catch(() => {});
            }
          }
        } catch {}

        // Email the person who requested (from evangelism)
        try {
          const { sendMediaRequestAcceptedEmail } = require('../lib/email');
          const requester = await prisma.user.findUnique({ where: { id: mediaRequest.requestedBy?.id || '' }, select: { email: true, name: true } });
          const assignee = data.assignedToId ? await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { name: true } }) : null;
          if (requester) sendMediaRequestAcceptedEmail(requester.email, requester.name, event.title, assignee?.name || 'Media team');
        } catch {}
      }
    }

    res.json(mediaRequest);
  } catch (err) { next(err); }
});

function safeParseTags(tags: string | null): string[] {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return []; }
}

export default router;
