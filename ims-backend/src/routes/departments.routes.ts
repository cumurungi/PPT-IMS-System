import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const departments = ['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE'];
    const counts = await Promise.all(
      departments.map(async (dept) => ({
        department: dept,
        memberCount: await prisma.user.count({ where: { department: dept as any, isActive: true } }),
      }))
    );
    res.json(counts);
  } catch (err) { next(err); }
});

export default router;
