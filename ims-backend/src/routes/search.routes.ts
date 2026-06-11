import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) { res.json({ results: [] }); return; }

    const [tasks, projects, events] = await Promise.all([
      prisma.task.findMany({ where: { OR: [{ title: { contains: q } }, { description: { contains: q } }] }, take: 10, select: { id: true, title: true, status: true } }),
      prisma.project.findMany({ where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] }, take: 10, select: { id: true, name: true, department: true } }),
      prisma.event.findMany({ where: { OR: [{ title: { contains: q } }, { location: { contains: q } }] }, take: 10, select: { id: true, title: true, status: true } }),
    ]);

    res.json({
      results: [
        ...tasks.map(t => ({ ...t, type: 'task' })),
        ...projects.map(p => ({ ...p, type: 'project' })),
        ...events.map(e => ({ ...e, type: 'event' })),
      ],
    });
  } catch (err) { next(err); }
});

export default router;
