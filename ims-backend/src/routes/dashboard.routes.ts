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

      // Department breakdown — department-specific metrics instead of generic task counts
      const deptStats = await Promise.all(
        ['MEDIA', 'EVANGELISM', 'IT', 'HR_FINANCE'].map(async (d) => {
          if (d === 'MEDIA') {
            const [recordings, published, pendingApproval] = await Promise.all([
              prisma.recording.count(),
              prisma.recording.count({ where: { status: { in: ['EDITED', 'APPROVED', 'PUBLISHED'] } } }),
              prisma.recording.count({ where: { status: 'EDITED' } }),
            ]);
            return { department: d, users: await prisma.user.count({ where: { department: d as any, isActive: true } }), projects: await prisma.project.count({ where: { department: d as any, isActive: true } }), recordings, published, pendingApproval, metricLabel: 'Recordings', completedLabel: 'Published/Edited', completed: published, total: recordings };
          }
          if (d === 'EVANGELISM') {
            const [events, completedEvents, pendingApprovals] = await Promise.all([
              prisma.event.count(),
              prisma.event.count({ where: { status: 'COMPLETED' } }),
              prisma.contentApproval.count({ where: { decision: false } }),
            ]);
            return { department: d, users: await prisma.user.count({ where: { department: d as any, isActive: true } }), projects: await prisma.project.count({ where: { department: d as any, isActive: true } }), events, completedEvents, pendingApprovals, metricLabel: 'Sermons', completedLabel: 'Completed', completed: completedEvents, total: events };
          }
          if (d === 'IT') {
            const [openTickets, closedTickets, queueSize] = await Promise.all([
              prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
              prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
              prisma.publishingQueue.count({ where: { publishedAt: null } }),
            ]);
            return { department: d, users: await prisma.user.count({ where: { department: d as any, isActive: true } }), projects: await prisma.project.count({ where: { department: d as any, isActive: true } }), openTickets, closedTickets, queueSize, metricLabel: 'Open Tickets', completedLabel: 'Closed', completed: closedTickets, total: openTickets + closedTickets };
          }
          const [pendingLeave, pendingExpenses] = await Promise.all([
            prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
            prisma.expenseRequest.count({ where: { status: 'PENDING' } }),
          ]);
          return { department: d, users: await prisma.user.count({ where: { department: d as any, isActive: true } }), projects: await prisma.project.count({ where: { department: d as any, isActive: true } }), pendingLeave, pendingExpenses, metricLabel: 'Pending Approvals', completedLabel: 'Resolved', completed: 0, total: pendingLeave + pendingExpenses };
        })
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

// GET /api/v1/dashboard/predictions
router.get('/predictions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN';
    const isManager = user.role === 'MANAGER';
    const dept = user.department;

    const predictions: any = { generatedAt: new Date().toISOString() };

    // Task completion prediction (all roles)
    const totalTasks = await prisma.task.count();
    const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
    const overdueTasks = await prisma.task.count({ where: { status: { not: 'COMPLETED' }, deadline: { lt: new Date() } } });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    predictions.tasks = {
      completionRate,
      overdueRisk: totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0,
      insight: completionRate >= 80 ? 'On track' : completionRate >= 60 ? 'Needs attention' : 'At risk',
    };

    // Department-specific predictions
    if (isAdmin || dept === 'MEDIA') {
      const totalRecordings = await prisma.recording.count();
      const pendingApproval = await prisma.recording.count({ where: { status: 'EDITED' } });
      const published = await prisma.recording.count({ where: { status: 'PUBLISHED' } });
      const editingRate = totalRecordings > 0 ? Math.round((pendingApproval / totalRecordings) * 100) : 0;
      predictions.media = {
        editingBacklog: pendingApproval,
        publishedRate: totalRecordings > 0 ? Math.round((published / totalRecordings) * 100) : 0,
        insight: editingRate > 40 ? 'Editing backlog is growing' : 'Editing workflow is healthy',
      };
    }

    if (isAdmin || dept === 'EVANGELISM') {
      const totalEvents = await prisma.event.count();
      const completedEvents = await prisma.event.count({ where: { status: 'COMPLETED' } });
      const upcomingEvents = await prisma.event.count({ where: { status: { in: ['PLANNED', 'CONFIRMED'] } } });
      const completionRate = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;
      predictions.evangelism = {
        upcomingEvents,
        completionRate,
        insight: completionRate >= 70 ? 'Schedule is on track' : 'Many events are pending completion',
      };
    }

    if (isAdmin || dept === 'IT') {
      const openTickets = await prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } });
      const closedTickets = await prisma.supportTicket.count({ where: { status: 'CLOSED' } });
      const totalTickets = openTickets + closedTickets;
      const resolutionRate = totalTickets > 0 ? Math.round((closedTickets / totalTickets) * 100) : 0;
      predictions.it = {
        openTickets,
        resolutionRate,
        insight: openTickets > 10 ? 'Ticket backlog is high' : 'Support load is manageable',
      };
    }

    if (isAdmin || dept === 'HR_FINANCE') {
      const pendingLeave = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
      const pendingExpenses = await prisma.expenseRequest.count({ where: { status: 'PENDING' } });
      predictions.hr = {
        pendingLeave,
        pendingExpenses,
        insight: pendingLeave + pendingExpenses > 10 ? 'Approval queue is backlogged' : 'Approvals are up to date',
      };
    }

    res.json(predictions);
  } catch (err) {
    next(err);
  }
});

export default router;
