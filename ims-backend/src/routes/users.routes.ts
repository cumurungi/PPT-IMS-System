import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(authenticate);

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
  department: z.enum(['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE']).nullable().optional(),
  permissions: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional(),
  department: z.enum(['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE']).nullable().optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

// GET /api/v1/users — list with search, role/department filters
router.get('/', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;
    const { search, role, department, status } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }
    if (role) where.role = role as string;
    if (department) where.department = department as string;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Attach permissions via raw query (works even before prisma generate)
    const userIds = users.map(u => u.id);
    let permissionsMap: Record<string, string | null> = {};
    if (userIds.length > 0) {
      try {
        const rawUsers: any[] = await prisma.$queryRawUnsafe(
          `SELECT id, permissions FROM User WHERE id IN (${userIds.map(() => '?').join(',')})`,
          ...userIds
        );
        for (const ru of rawUsers) {
          permissionsMap[ru.id] = ru.permissions || null;
        }
      } catch {}
    }

    const usersWithPerms = users.map(u => ({ ...u, permissions: permissionsMap[u.id] || null }));

    res.json({ data: usersWithPerms, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/stats — counts by role and department
router.get('/stats', requireRole('ADMIN'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, active, admins, managers, employees, byDept] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MANAGER' } }),
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      Promise.all(
        ['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE'].map(async (d) => ({
          department: d,
          count: await prisma.user.count({ where: { department: d as any } }),
        }))
      ),
    ]);
    res.json({ total, active, admins, managers, employees, byDepartment: byDept });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/permissions — available permissions for assignment
router.get('/permissions', requireRole('ADMIN'), (_req: Request, res: Response) => {
  const permissions = [
    // Task Management
    { id: 'tasks.create', label: 'Create Tasks', group: 'Tasks' },
    { id: 'tasks.edit', label: 'Edit Any Task', group: 'Tasks' },
    { id: 'tasks.delete', label: 'Delete Tasks', group: 'Tasks' },
    { id: 'tasks.assign', label: 'Assign Tasks to Others', group: 'Tasks' },
    // Projects
    { id: 'projects.create', label: 'Create Projects', group: 'Projects' },
    { id: 'projects.edit', label: 'Edit Projects', group: 'Projects' },
    { id: 'projects.delete', label: 'Delete Projects', group: 'Projects' },
    // Evangelism
    { id: 'evangelism.sermons', label: 'Manage Sermons', group: 'Evangelism' },
    { id: 'evangelism.preachers', label: 'Manage Preachers', group: 'Evangelism' },
    { id: 'evangelism.approvals', label: 'Approve Recordings', group: 'Evangelism' },
    // Media
    { id: 'media.recordings', label: 'Manage Recordings', group: 'Media' },
    { id: 'media.editing', label: 'Access Editing Module', group: 'Media' },
    { id: 'media.library', label: 'Manage Media Library', group: 'Media' },
    { id: 'media.publish', label: 'Publish Content', group: 'Media' },
    // IT
    { id: 'it.tickets', label: 'Handle Support Tickets', group: 'IT' },
    { id: 'it.platforms', label: 'Manage Platforms', group: 'IT' },
    // HR & Finance
    { id: 'hr.attendance', label: 'Manage Attendance', group: 'HR & Finance' },
    { id: 'hr.leave', label: 'Approve Leave Requests', group: 'HR & Finance' },
    { id: 'hr.expenses', label: 'Approve Expenses', group: 'HR & Finance' },
    { id: 'hr.employees', label: 'Manage Employee Profiles', group: 'HR & Finance' },
    // Reports
    { id: 'reports.view', label: 'View Reports', group: 'Reports' },
    { id: 'reports.review', label: 'Review Weekly Reports', group: 'Reports' },
    // Admin
    { id: 'admin.users', label: 'Manage Users', group: 'Administration' },
    { id: 'admin.audit', label: 'View Audit Logs', group: 'Administration' },
  ];
  res.json(permissions);
});

// POST /api/v1/users — create
router.post('/', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body);

    // Admins should not have a department; Managers/Employees must
    const department = data.role === 'ADMIN' ? null : data.department ?? null;
    if (data.role !== 'ADMIN' && !department) {
      res.status(422).json({ error: 'Validation Error', message: 'Managers and Employees must be assigned a department' });
      return;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as any,
        department: department as any,
      },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true },
    });

    // Store permissions separately if provided
    if (data.permissions?.length) {
      await prisma.$executeRawUnsafe(
        `UPDATE User SET permissions = ? WHERE id = ?`,
        JSON.stringify(data.permissions),
        user.id
      ).catch(() => {});
    }

    res.status(201).json({ ...user, permissions: data.permissions?.length ? JSON.stringify(data.permissions) : null });

    // Audit log
    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'CREATE', entityType: 'User', entityId: user.id, ipAddress: req.ip || req.socket.remoteAddress || null, details: { name: data.name, email: data.email, role: data.role, department } },
    }).catch(() => {});

    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/users/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.id !== req.params.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/:id — update
router.patch('/:id', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateUserSchema.parse(req.body);
    // If switching to ADMIN, clear department
    if (data.role === 'ADMIN') data.department = null;

    // Separate permissions from the rest
    const { permissions, ...updateFields } = data;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateFields as any,
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
    });

    // Update permissions separately
    if (permissions !== undefined) {
      await prisma.$executeRawUnsafe(
        `UPDATE User SET permissions = ? WHERE id = ?`,
        permissions.length ? JSON.stringify(permissions) : null,
        user.id
      ).catch(() => {});
    }

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'UPDATE', entityType: 'User', entityId: user.id, ipAddress: req.ip || req.socket.remoteAddress || null, details: data as any },
    }).catch(() => {});

    res.json({ ...user, permissions: permissions !== undefined ? (permissions.length ? JSON.stringify(permissions) : null) : null });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/users/:id/reset-password — admin sets a new password
router.post('/:id/reset-password', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { newPassword } = z.object({ newPassword: z.string().min(8) }).parse(req.body);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });

    await prisma.auditLog.create({
      data: { userId: req.user!.id, action: 'UPDATE', entityType: 'User', entityId: req.params.id, ipAddress: req.ip || req.socket.remoteAddress || null, details: { action: 'password_reset' } },
    }).catch(() => {});

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/users/:id/toggle-active — activate/deactivate
router.patch('/:id/toggle-active', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const current = await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } });
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !current.isActive },
      select: { id: true, name: true, email: true, role: true, department: true, isActive: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
