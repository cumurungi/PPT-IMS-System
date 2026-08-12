import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    const { action, entityType, userId, search, startDate, endDate } = req.query;

    const where: any = {};
    if (action) where.action = action as string;
    if (entityType) where.entityType = entityType as string;
    if (userId) where.userId = userId as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    if (search) {
      where.OR = [
        { user: { name: { contains: search as string } } },
        { user: { email: { contains: search as string } } },
        { entityType: { contains: search as string } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ data: logs, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

export default router;
