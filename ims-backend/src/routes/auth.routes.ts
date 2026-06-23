import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as SignOptions
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8),
    });
    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) {
      res.status(404).json({ error: 'Not found', message: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(400).json({ error: 'Bad Request', message: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });
    if (!user) {
      // Don't reveal if email exists — always return success
      res.json({ message: 'If the email exists, a reset notification has been sent to the administrator.' });
      return;
    }

    // Notify all admins about the password reset request
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, email: true },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: 'Password Reset Request',
          body: `${user.name} (${user.email}) has requested a password reset. Please go to User Management to reset their password.`,
          entityType: 'User',
          entityId: user.id,
        },
      }).catch(() => {});
    }

    // Also try to send email to admin
    try {
      const { sendEmail } = require('../lib/email');
      if (admins[0]) {
        sendEmail({
          to: admins[0].email,
          subject: `[IMS] Password Reset Request — ${user.name}`,
          text: `${user.name} (${user.email}) has requested a password reset.\n\nPlease log in to IMS → User Management to reset their password.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🔑 Password Reset Request</h2><p><strong>${user.name}</strong> (${user.email}) has requested a password reset.</p><p>Please go to User Management to reset their password.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.json({ message: 'If the email exists, a reset notification has been sent to the administrator.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
