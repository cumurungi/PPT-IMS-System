import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/v1/messages/users/all — list all users for starting new conversations
// (must be before /:userId to avoid "users" matching as a userId)
router.get('/users/all', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true, department: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
});

// GET /api/v1/messages/conversations — list all users you've messaged with
router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get unique conversation partners with last message
    const sent = await prisma.directMessage.findMany({
      where: { senderId: userId },
      distinct: ['receiverId'],
      orderBy: { createdAt: 'desc' },
      select: { receiverId: true, body: true, createdAt: true },
    });

    const received = await prisma.directMessage.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      orderBy: { createdAt: 'desc' },
      select: { senderId: true, body: true, createdAt: true, isRead: true },
    });

    // Merge into unique partners
    const partnerMap = new Map<string, { lastMessage: string; lastDate: Date; unread: number }>();

    for (const m of sent) {
      if (!partnerMap.has(m.receiverId) || m.createdAt > partnerMap.get(m.receiverId)!.lastDate) {
        partnerMap.set(m.receiverId, { lastMessage: m.body, lastDate: m.createdAt, unread: 0 });
      }
    }
    for (const m of received) {
      const existing = partnerMap.get(m.senderId);
      if (!existing || m.createdAt > existing.lastDate) {
        partnerMap.set(m.senderId, { lastMessage: m.body, lastDate: m.createdAt, unread: 0 });
      }
    }

    // Count unread per partner (simplified to avoid memory issues)
    const unreadMessages = await prisma.directMessage.findMany({
      where: { receiverId: userId, isRead: false },
      select: { senderId: true },
    });
    const unreadByPartner: Record<string, number> = {};
    for (const m of unreadMessages) {
      unreadByPartner[m.senderId] = (unreadByPartner[m.senderId] || 0) + 1;
    }
    for (const [senderId, count] of Object.entries(unreadByPartner)) {
      const p = partnerMap.get(senderId);
      if (p) p.unread = count;
    }

    // Load partner user info
    const partnerIds = Array.from(partnerMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: partnerIds } },
      select: { id: true, name: true, email: true, role: true, department: true },
    });

    const conversations = users.map(u => ({
      user: u,
      ...(partnerMap.get(u.id) || { lastMessage: '', lastDate: new Date(), unread: 0 }),
    })).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());

    res.json(conversations);
  } catch (err) { next(err); }
});

// GET /api/v1/messages/:userId — get messages with a specific user
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const me = req.user!.id;
    const other = req.params.userId;

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: me, receiverId: other },
          { senderId: other, receiverId: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Mark received messages as read
    await prisma.directMessage.updateMany({
      where: { senderId: other, receiverId: me, isRead: false },
      data: { isRead: true },
    });

    res.json(messages);
  } catch (err) { next(err); }
});

// POST /api/v1/messages/:userId — send a message
const sendSchema = z.object({ body: z.string().min(1) });

router.post('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { body } = sendSchema.parse(req.body);
    const message = await prisma.directMessage.create({
      data: {
        id: generateId(),
        senderId: req.user!.id,
        receiverId: req.params.userId,
        body,
      },
      include: {
        sender: { select: { id: true, name: true } },
      },
    });

    // Send email to receiver
    try {
      const { sendNewMessageEmail } = require('../lib/email');
      const receiver = await prisma.user.findUnique({ where: { id: req.params.userId }, select: { email: true, name: true } });
      if (receiver) sendNewMessageEmail(receiver.email, receiver.name, message.sender.name, body);
    } catch {}

    res.status(201).json(message);
  } catch (err) { next(err); }
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export default router;
