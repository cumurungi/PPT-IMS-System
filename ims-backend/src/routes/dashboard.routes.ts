import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/v1/dashboard/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN';
    const isManager = user.role === 'MANAGER';
    const dept = user.department;

    // Common stats for all users
    const myTasks = await prisma.task.count({ where: { assigneeId: user.id } });
    const myTasksCompleted = await prisma.task.count({ where: { assigneeId: user.id, status: 'COMPLETED' } });
    const myTasksOverdue = await prisma.task.count({
      where: { assigneeId: user.id, status: { not: 'COMPLETED' }, deadline: { lt: new Date() } },
    });
    const unreadNotifications = await prisma.notification.count({ where: { userId: user.id, isRead: false } });

    // Base response
    const stats: any = {
      role: user.role,
      department: user.department,
      personal: {
        totalTasks: myTasks,
        completedTasks: myTasksCompleted,
        overdueTasks: myTasksOverdue,
        unreadNotifications,
      },
    };

    // Admin sees everything
    if (isAdmin) {
      const [totalUsers, activeUsers, totalProjects, totalTasks, completedTasks, overdueTasks, openTickets, pendingLeave, pendingExpenses] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.project.count({ where: { isActive: true } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({ where: { status: { not: 'COMPLETED' }, deadline: { lt: new Date() } } }),
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        prisma.expenseRequest.count({ where: { status: 'PENDING' } }),
      ]);

      // Department breakdown
      const deptStats = await Promise.all(
        ['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE'].map(async (d) => ({
          department: d,
          users: await prisma.user.count({ where: { department: d as any, isActive: true } }),
          projects: await prisma.project.count({ where: { department: d as any, isActive: true } }),
          tasks: await prisma.task.count({ where: { project: { department: d as any } } }),
          completedTasks: await prisma.task.count({ where: { project: { department: d as any }, status: 'COMPLETED' } }),
        }))
      );

      // Recent audit logs
      const recentActivity = await prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      });

      stats.admin = {
        totalUsers,
        activeUsers,
        totalProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        openTickets,
        pendingLeave,
        pendingExpenses,
        departments: deptStats,
        recentActivity,
      };
    }

    // Manager sees their department
    if (isManager && dept) {
      const [deptProjects, deptTasks, deptCompletedTasks, deptOverdueTasks, deptMembers, pendingApprovals] = await Promise.all([
        prisma.project.count({ where: { department: dept as any, isActive: true } }),
        prisma.task.count({ where: { project: { department: dept as any } } }),
        prisma.task.count({ where: { project: { department: dept as any }, status: 'COMPLETED' } }),
        prisma.task.count({ where: { project: { department: dept as any }, status: { not: 'COMPLETED' }, deadline: { lt: new Date() } } }),
        prisma.user.count({ where: { department: dept as any, isActive: true } }),
        prisma.leaveRequest.count({ where: { user: { department: dept as any }, status: 'PENDING' } }),
      ]);

      stats.manager = {
        department: dept,
        projects: deptProjects,
        totalTasks: deptTasks,
        completedTasks: deptCompletedTasks,
        overdueTasks: deptOverdueTasks,
        completionRate: deptTasks > 0 ? Math.round((deptCompletedTasks / deptTasks) * 100) : 0,
        teamMembers: deptMembers,
        pendingApprovals,
      };
    }

    // Department-specific modules
    if (isAdmin || dept === 'MEDIA') {
      const [recordings, pendingApproval, published] = await Promise.all([
        prisma.recording.count(),
        prisma.recording.count({ where: { status: 'EDITED' } }),
        prisma.recording.count({ where: { status: 'PUBLISHED' } }),
      ]);
      stats.media = { recordings, pendingApproval, published };
    }

    if (isAdmin || dept === 'EVANGELISM') {
      const [upcomingEvents, completedEvents] = await Promise.all([
        prisma.event.count({ where: { status: { in: ['PLANNED', 'CONFIRMED'] } } }),
        prisma.event.count({ where: { status: 'COMPLETED' } }),
      ]);
      stats.evangelism = { upcomingEvents, completedEvents };
    }

    if (isAdmin || dept === 'IT') {
      const [openTickets, criticalTickets, queueSize] = await Promise.all([
        prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
        prisma.supportTicket.count({ where: { priority: 'CRITICAL', status: { not: 'CLOSED' } } }),
        prisma.publishingQueue.count({ where: { publishedAt: null } }),
      ]);
      stats.it = { openTickets, criticalTickets, publishingQueueSize: queueSize };
    }

    if (isAdmin || dept === 'HR_FINANCE') {
      const [pendingLeave, pendingExpenses, totalEmployees] = await Promise.all([
        prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
        prisma.expenseRequest.count({ where: { status: 'PENDING' } }),
        prisma.employeeProfile.count({ where: { isActive: true } }),
      ]);
      stats.hr = { pendingLeave, pendingExpenses, totalEmployees };
    }

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
