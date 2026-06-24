import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

// GET /api/v1/it/tickets/mine — user's own submitted tickets
router.get('/tickets/mine', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { createdById: req.user!.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, status: true, priority: true, category: true, createdAt: true },
      take: 10,
    });
    res.json(tickets);
  } catch (err) { next(err); }
});

router.get('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let where: any = {};

    if (req.user!.role === 'ADMIN') {
      // Admin sees everything
    } else if (req.user!.department === 'IT' && req.user!.role === 'MANAGER') {
      // IT Manager sees all tickets
    } else if (req.user!.department === 'IT' && req.user!.role === 'EMPLOYEE') {
      // IT Employee sees only tickets assigned to them
      where = { assigneeId: req.user!.id };
    } else {
      // Non-IT users see only their own submitted tickets
      where = { createdById: req.user!.id };
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, department: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
    res.json(tickets);
  } catch (err) { next(err); }
});

router.post('/tickets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.supportTicket.create({
      data: { ...req.body, createdById: req.user!.id },
      include: {
        createdBy: { select: { id: true, name: true, department: true } },
      },
    });

    // Email the IT Manager about the new ticket
    try {
      const { sendEmail } = require('../lib/email');
      const itManager = await prisma.user.findFirst({
        where: { department: 'IT', role: 'MANAGER', isActive: true },
        select: { id: true, email: true, name: true },
      });
      if (itManager) {
        // In-app notification for IT manager
        await prisma.notification.create({
          data: {
            userId: itManager.id,
            type: 'SYSTEM',
            title: 'New support ticket',
            body: `${req.user!.name} (${req.user!.department || 'Admin'}) submitted: ${ticket.title}`,
            entityType: 'SupportTicket',
            entityId: ticket.id,
          },
        }).catch(() => {});

        // Email
        sendEmail({
          to: itManager.email,
          subject: `[IMS] 🎫 New support ticket: ${ticket.title}`,
          text: `A new support ticket has been submitted:\n\nTitle: ${ticket.title}\nFrom: ${req.user!.name} (${req.user!.department || 'Admin'})\nPriority: ${ticket.priority}\nCategory: ${ticket.category}\n\nPlease log in to assign and resolve it.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🎫 New Support Ticket</h2><p>A new ticket needs your attention:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Title:</strong> ${ticket.title}</p><p style="margin:4px 0;"><strong>From:</strong> ${req.user!.name} (${req.user!.department || 'Admin'})</p><p style="margin:4px 0;"><strong>Priority:</strong> ${ticket.priority}</p><p style="margin:4px 0;"><strong>Category:</strong> ${ticket.category}</p></div><p>Please log in to IMS to assign and resolve it.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }

      // In-app notification for the submitter (confirmation)
      await prisma.notification.create({
        data: {
          userId: req.user!.id,
          type: 'SYSTEM',
          title: 'Ticket submitted successfully',
          body: `Your ticket "${ticket.title}" has been sent to the IT team.`,
          entityType: 'SupportTicket',
          entityId: ticket.id,
        },
      }).catch(() => {});
    } catch {}

    res.status(201).json(ticket);
  } catch (err) { next(err); }
});

router.patch('/tickets/:id', requireDepartment('IT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ticket = await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        createdBy: { select: { id: true, name: true, department: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // If assigneeId was changed, email the assigned person
    if (req.body.assigneeId && ticket.assignee?.email) {
      try {
        const { sendEmail } = require('../lib/email');
        sendEmail({
          to: ticket.assignee.email,
          subject: `[IMS] 🎫 Ticket assigned to you: ${ticket.title}`,
          text: `A support ticket has been assigned to you:\n\nTitle: ${ticket.title}\nFrom: ${ticket.createdBy?.name} (${ticket.createdBy?.department})\nPriority: ${ticket.priority}\n\nPlease log in to IMS to handle it.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🎫 Ticket Assigned to You</h2><p>A support ticket needs your attention:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Title:</strong> ${ticket.title}</p><p style="margin:4px 0;"><strong>From:</strong> ${ticket.createdBy?.name} (${ticket.createdBy?.department})</p><p style="margin:4px 0;"><strong>Priority:</strong> ${ticket.priority}</p></div><p>Please log in to IMS to handle it.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });

        // In-app notification
        await prisma.notification.create({
          data: {
            userId: ticket.assignee.id,
            type: 'TASK_ASSIGNED',
            title: 'Support ticket assigned to you',
            body: `"${ticket.title}" from ${ticket.createdBy?.name}`,
            entityType: 'SupportTicket',
            entityId: ticket.id,
          },
        }).catch(() => {});
      } catch {}
    }

    // If status was changed, notify IT manager and the ticket creator
    if (req.body.status) {
      try {
        const { sendEmail } = require('../lib/email');

        // Notify IT manager when status changes (if changer is employee)
        if (req.user!.role === 'EMPLOYEE') {
          const itManager = await prisma.user.findFirst({
            where: { department: 'IT', role: 'MANAGER', isActive: true },
            select: { id: true, email: true, name: true },
          });
          if (itManager) {
            sendEmail({
              to: itManager.email,
              subject: `[IMS] Ticket status updated: ${ticket.title} → ${req.body.status}`,
              text: `${req.user!.name} changed ticket "${ticket.title}" to ${req.body.status}.`,
              html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🎫 Ticket Status Updated</h2><p><strong>${req.user!.name}</strong> updated a ticket:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Title:</strong> ${ticket.title}</p><p style="margin:4px 0;"><strong>New Status:</strong> ${req.body.status}</p></div><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
            });
            await prisma.notification.create({
              data: { userId: itManager.id, type: 'TASK_STATUS', title: 'Ticket status updated', body: `"${ticket.title}" → ${req.body.status}`, entityType: 'SupportTicket', entityId: ticket.id },
            }).catch(() => {});
          }
        }

        // Notify the ticket creator when resolved/closed
        if (['RESOLVED', 'CLOSED'].includes(req.body.status) && ticket.createdBy) {
          const creator = await prisma.user.findUnique({ where: { id: ticket.createdById }, select: { id: true, email: true, name: true } });
          if (creator) {
            sendEmail({
              to: creator.email,
              subject: `[IMS] ✅ Your ticket has been ${req.body.status.toLowerCase()}: ${ticket.title}`,
              text: `Your support ticket "${ticket.title}" has been ${req.body.status.toLowerCase()} by the IT team.`,
              html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#16a34a;">✅ Ticket ${req.body.status === 'RESOLVED' ? 'Resolved' : 'Closed'}</h2><p>Your support ticket has been handled:</p><div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Title:</strong> ${ticket.title}</p><p style="margin:4px 0;"><strong>Status:</strong> ${req.body.status}</p></div><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
            });
            await prisma.notification.create({
              data: { userId: creator.id, type: 'SYSTEM', title: `Ticket ${req.body.status.toLowerCase()}`, body: `Your ticket "${ticket.title}" has been ${req.body.status.toLowerCase()}.`, entityType: 'SupportTicket', entityId: ticket.id },
            }).catch(() => {});
          }
        }
      } catch {}
    }

    res.json(ticket);
  } catch (err) { next(err); }
});

// GET /api/v1/it/team — IT team members for assignment
router.get('/team', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { department: 'IT', isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

router.get('/queue', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = await prisma.publishingQueue.findMany({
      orderBy: { priority: 'asc' },
      include: {
        recording: { select: { id: true, title: true, format: true, status: true } },
        platforms: { include: { platform: { select: { id: true, name: true, type: true } } } },
      },
    });
    res.json(queue);
  } catch (err) { next(err); }
});

// POST /api/v1/it/queue/:id/publish — mark platforms as published
router.post('/queue/:id/publish', requireDepartment('IT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platformIds } = req.body; // array of platform IDs that were published

    // Link platforms to this queue item
    if (platformIds?.length) {
      for (const platformId of platformIds) {
        await prisma.publishingQueuePlatform.upsert({
          where: { queueId_platformId: { queueId: req.params.id, platformId } },
          create: { queueId: req.params.id, platformId, publishedAt: new Date() },
          update: { publishedAt: new Date() },
        });
      }
    }

    // Mark queue item as fully published
    const updated = await prisma.publishingQueue.update({
      where: { id: req.params.id },
      data: {
        publishedAt: new Date(),
        publishedById: req.user!.id,
      },
      include: { recording: true },
    });

    // Update recording status to PUBLISHED
    if (updated.recordingId) {
      await prisma.recording.update({
        where: { id: updated.recordingId },
        data: { status: 'PUBLISHED' },
      });
    }

    res.json({ message: 'Published successfully', item: updated });
  } catch (err) { next(err); }
});

router.get('/platforms', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const platforms = await prisma.platform.findMany({ orderBy: { name: 'asc' } });
    res.json(platforms);
  } catch (err) { next(err); }
});

router.post('/platforms', requireDepartment('IT'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const platform = await prisma.platform.create({ data: req.body });
    res.status(201).json(platform);
  } catch (err) { next(err); }
});

router.get('/storage', requireDepartment('IT'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const quotas = await prisma.storageQuota.findMany();
    res.json(quotas);
  } catch (err) { next(err); }
});

export default router;
