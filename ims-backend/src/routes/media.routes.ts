import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate, requireDepartment('MEDIA'));

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
});

// GET /api/v1/media/recordings
router.get('/recordings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    if (status) where.status = status as string;
    if (search) where.title = { contains: search as string };

    const recordings = await prisma.recording.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        editor: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
        _count: { select: { assets: true, approvals: true } },
      },
    });
    res.json(recordings);
  } catch (err) { next(err); }
});

// GET /api/v1/media/recordings/stats
router.get('/recordings/stats', async (_req: Request, res: Response, next: NextFunction) => {
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

// POST /api/v1/media/recordings
router.post('/recordings', async (req: Request, res: Response, next: NextFunction) => {
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
      },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    res.status(201).json(recording);
  } catch (err) { next(err); }
});

// GET /api/v1/media/recordings/:id
router.get('/recordings/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const recording = await prisma.recording.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        editor: { select: { id: true, name: true } },
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
router.patch('/recordings/:id', async (req: Request, res: Response, next: NextFunction) => {
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
    if (req.body.title) updates.title = req.body.title;
    if (req.body.format) updates.format = req.body.format;

    const recording = await prisma.recording.update({
      where: { id: req.params.id },
      data: updates,
      include: { editor: { select: { id: true, name: true } } },
    });
    res.json(recording);
  } catch (err) { next(err); }
});

// POST /api/v1/media/recordings/:id/start-editing — assign editor + move to IN_EDITING
router.post('/recordings/:id/start-editing', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.recording.findUniqueOrThrow({ where: { id: req.params.id } });
    if (!ALLOWED_TRANSITIONS[current.status]?.includes('IN_EDITING')) {
      res.status(400).json({ error: 'Invalid transition', message: `Cannot start editing from ${current.status}` });
      return;
    }
    const recording = await prisma.recording.update({
      where: { id: req.params.id },
      data: {
        status: 'IN_EDITING',
        editorId: req.body.editorId || req.user!.id,
        editingProgress: 0,
      },
      include: { editor: { select: { id: true, name: true } } },
    });
    res.json(recording);
  } catch (err) { next(err); }
});

// POST /api/v1/media/recordings/:id/approve — Manager approve/reject
const approvalSchema = z.object({
  decision: z.boolean(),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

router.post('/recordings/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only managers/admins can approve
    if (req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only managers can approve content' });
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

    // If approved, auto-add to publishing queue
    if (decision) {
      await prisma.publishingQueue.create({
        data: { recordingId: req.params.id, priority: 50 },
      }).catch(() => {}); // ignore if already queued
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
router.get('/requests', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await prisma.mediaRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { id: true, title: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });
    res.json(requests);
  } catch (err) { next(err); }
});

function safeParseTags(tags: string): string[] {
  try { return JSON.parse(tags); } catch { return []; }
}

export default router;
