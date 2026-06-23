import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireDepartment } from '../middleware/rbac';

// Multer config for attendance file uploads
const attendanceStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'attendance');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const attendanceUpload = multer({ storage: attendanceStorage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();
router.use(authenticate);

router.get('/employees', requireDepartment('HR_FINANCE'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const employees = await prisma.employeeProfile.findMany({
      include: { user: { select: { id: true, name: true, email: true, department: true } } },
    });
    res.json(employees);
  } catch (err) { next(err); }
});

// GET /api/v1/hr/attendance — own records (manager/admin see all)
// POST /api/v1/hr/attendance/upload — upload weekly IVM attendance report (any user can upload)
router.post('/attendance/upload', attendanceUpload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    const fileInfo = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      fileName: file.originalname,
      fileUrl: `/uploads/attendance/${file.filename}`,
      fileSizeBytes: file.size,
      uploadedById: req.user!.id,
      uploadedByName: req.user!.name,
      uploadedAt: new Date().toISOString(),
    };
    // Store file reference
    const logPath = path.join(process.cwd(), 'uploads', 'attendance', '_files.json');
    let files: any[] = [];
    try { files = JSON.parse(fs.readFileSync(logPath, 'utf-8')); } catch {}
    files.unshift(fileInfo);
    fs.writeFileSync(logPath, JSON.stringify(files, null, 2));

    // Notify HR Manager
    try {
      const { sendEmail } = require('../lib/email');
      const hrManager = await prisma.user.findFirst({
        where: { department: 'HR_FINANCE', role: 'MANAGER', isActive: true },
        select: { id: true, email: true, name: true },
      });
      if (hrManager) {
        await prisma.notification.create({
          data: { userId: hrManager.id, type: 'SYSTEM', title: 'New attendance report uploaded', body: `${req.user!.name} uploaded: ${file.originalname}`, entityType: 'AttendanceFile', entityId: fileInfo.id },
        }).catch(() => {});
        sendEmail({
          to: hrManager.email,
          subject: `[IMS] 📄 New attendance report: ${file.originalname}`,
          text: `${req.user!.name} uploaded a new weekly attendance report.\n\nFile: ${file.originalname}\n\nPlease log in to IMS to view it.`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">📄 New Attendance Report</h2><p><strong>${req.user!.name}</strong> uploaded a weekly attendance report:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>File:</strong> ${file.originalname}</p></div><p>Please log in to IMS to view/download it.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.status(201).json(fileInfo);
  } catch (err) { next(err); }
});

// GET /api/v1/hr/attendance/files — list uploaded attendance reports
router.get('/attendance/files', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const logPath = path.join(process.cwd(), 'uploads', 'attendance', '_files.json');
    let files: any[] = [];
    try { files = JSON.parse(fs.readFileSync(logPath, 'utf-8')); } catch {}
    res.json(files);
  } catch (err) { next(err); }
});

// GET /api/v1/hr/attendance — own records (manager/admin see all)
router.get('/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const where = req.user!.role === 'ADMIN' || req.user!.role === 'MANAGER'
      ? {}
      : { userId: req.user!.id };
    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30,
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(records);
  } catch (err) { next(err); }
});

router.post('/attendance/checkin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendanceRecord.create({ data: { userId: req.user!.id, date: today, checkIn: new Date() } });
    res.status(201).json(record);
  } catch (err) { next(err); }
});

router.post('/attendance/checkout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceRecord.findUnique({ where: { userId_date: { userId: req.user!.id, date: today } } });
    if (!existing) { res.status(404).json({ error: 'No check-in found for today' }); return; }
    const checkOut = new Date();
    const totalHours = existing.checkIn ? (checkOut.getTime() - existing.checkIn.getTime()) / 3600000 : 0;
    const record = await prisma.attendanceRecord.update({ where: { id: existing.id }, data: { checkOut, totalHours } });
    res.json(record);
  } catch (err) { next(err); }
});

router.get('/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let where: any = {};
    if (req.user!.role === 'ADMIN' || (req.user!.role === 'MANAGER' && req.user!.department === 'HR_FINANCE')) {
      // HR Manager and Admin see all
    } else {
      // Everyone else sees only their own
      where = { userId: req.user!.id };
    }
    const requests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, department: true } } },
    });
    res.json(requests);
  } catch (err) { next(err); }
});

router.post('/leave', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body, userId: req.user!.id };
    // Convert date strings to proper DateTime
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    const leave = await prisma.leaveRequest.create({ data });

    // Get the requester's full info
    const requester = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, department: true } });
    const requesterName = requester?.name || 'Unknown';
    const startDate = req.body.startDate || '';
    const endDate = req.body.endDate || '';
    const leaveType = (req.body.leaveType || '').replace('_', ' ');

    // Notify department manager + HR manager
    try {
      const { sendEmail } = require('../lib/email');
      const managers = await prisma.user.findMany({
        where: {
          isActive: true,
          role: 'MANAGER',
          OR: [
            { department: requester?.department as any },
            { department: 'HR_FINANCE' },
          ],
        },
        select: { id: true, email: true, name: true },
      });
      for (const mgr of managers) {
        await prisma.notification.create({
          data: { userId: mgr.id, type: 'APPROVAL_REQUIRED', title: 'New leave request', body: `${requesterName} requested ${leaveType} from ${startDate} to ${endDate}`, entityType: 'LeaveRequest', entityId: leave.id },
        }).catch(() => {});
        sendEmail({
          to: mgr.email,
          subject: `[IMS] 🏖️ Leave request from ${requesterName}`,
          text: `${requesterName} submitted a leave request.\n\nType: ${leaveType}\nFrom: ${startDate}\nTo: ${endDate}\nReason: ${req.body.reason}`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">🏖️ Leave Request</h2><p><strong>${requesterName}</strong> submitted a leave request:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Type:</strong> ${leaveType}</p><p style="margin:4px 0;"><strong>From:</strong> ${startDate}</p><p style="margin:4px 0;"><strong>To:</strong> ${endDate}</p><p style="margin:4px 0;"><strong>Reason:</strong> ${req.body.reason}</p></div><p>Please log in to approve or reject.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.status(201).json(leave);
  } catch (err) { next(err); }
});

// PATCH /api/v1/hr/leave/:id — HR Manager only approves or rejects
router.patch('/leave/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only HR department manager or Admin can approve/reject
    if (req.user!.role === 'EMPLOYEE') {
      res.status(403).json({ error: 'Forbidden', message: 'Only HR can review leave requests' });
      return;
    }
    if (req.user!.department !== 'HR_FINANCE' && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden', message: 'Only HR can review leave requests' });
      return;
    }
    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        reviewedById: req.user!.id,
        reviewerComment: req.body.reviewerComment || null,
      },
    });

    // Notify the employee
    try {
      const { sendEmail } = require('../lib/email');
      const employee = await prisma.user.findUnique({ where: { id: leave.userId }, select: { id: true, email: true, name: true } });
      if (employee) {
        const approved = req.body.status === 'APPROVED';
        await prisma.notification.create({
          data: { userId: employee.id, type: 'APPROVAL_RESULT', title: `Leave ${approved ? 'approved' : 'rejected'}`, body: `Your leave request has been ${approved ? 'approved' : 'rejected'} by ${req.user!.name}`, entityType: 'LeaveRequest', entityId: leave.id },
        }).catch(() => {});
        sendEmail({
          to: employee.email,
          subject: `[IMS] ${approved ? '✅' : '❌'} Leave request ${approved ? 'approved' : 'rejected'}`,
          text: `Your leave request has been ${approved ? 'approved' : 'rejected'} by ${req.user!.name}.${req.body.reviewerComment ? '\n\nComment: ' + req.body.reviewerComment : ''}`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:${approved ? '#16a34a' : '#dc2626'};">${approved ? '✅ Leave Approved' : '❌ Leave Rejected'}</h2><p>Your leave request has been <strong>${approved ? 'approved' : 'rejected'}</strong> by ${req.user!.name}.</p>${req.body.reviewerComment ? '<p style="background:#f3f4f6;border-radius:8px;padding:12px;margin:12px 0;">💬 ' + req.body.reviewerComment + '</p>' : ''}<p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.json(leave);
  } catch (err) { next(err); }
});

router.get('/expenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only HR Manager and Admin see all expenses
    if (req.user!.role !== 'ADMIN' && !(req.user!.role === 'MANAGER' && req.user!.department === 'HR_FINANCE')) {
      res.json([]); // Employees don't see the list
      return;
    }
    const expenses = await prisma.expenseRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, department: true } } },
    });
    res.json(expenses);
  } catch (err) { next(err); }
});

router.post('/expenses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = { ...req.body, userId: req.user!.id };
    if (data.expenseDate) data.expenseDate = new Date(data.expenseDate);
    const expense = await prisma.expenseRequest.create({ data });

    // Notify HR Manager
    try {
      const { sendEmail } = require('../lib/email');
      const requester = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true } });
      const hrManager = await prisma.user.findFirst({
        where: { department: 'HR_FINANCE', role: 'MANAGER', isActive: true },
        select: { id: true, email: true },
      });
      if (hrManager) {
        await prisma.notification.create({
          data: { userId: hrManager.id, type: 'APPROVAL_REQUIRED', title: 'New expense claim', body: `${requester?.name} submitted ${Number(req.body.amount).toLocaleString()} RWF for ${req.body.category}`, entityType: 'ExpenseRequest', entityId: expense.id },
        }).catch(() => {});
        sendEmail({
          to: hrManager.email,
          subject: `[IMS] 💰 Expense claim from ${requester?.name}: ${req.body.amount} RWF`,
          text: `${requester?.name} submitted an expense claim.\n\nAmount: ${req.body.amount} RWF\nCategory: ${req.body.category}\nDescription: ${req.body.description}`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:#4f46e5;">💰 Expense Claim</h2><p><strong>${requester?.name}</strong> submitted an expense claim:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Amount:</strong> ${Number(req.body.amount).toLocaleString()} RWF</p><p style="margin:4px 0;"><strong>Category:</strong> ${req.body.category}</p><p style="margin:4px 0;"><strong>Description:</strong> ${req.body.description}</p></div><p>Log in to approve or reject.</p><p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.status(201).json(expense);
  } catch (err) { next(err); }
});

// PATCH /api/v1/hr/expenses/:id — HR Manager only approves, rejects, or requests info
router.patch('/expenses/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'ADMIN' && !(req.user!.role === 'MANAGER' && req.user!.department === 'HR_FINANCE')) {
      res.status(403).json({ error: 'Forbidden', message: 'Only HR can review expense requests' });
      return;
    }
    const expense = await prisma.expenseRequest.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        reviewedById: req.user!.id,
        reviewerComment: req.body.reviewerComment || null,
        paidAt: req.body.status === 'PAID' ? new Date() : undefined,
      },
    });

    // Notify the employee
    try {
      const { sendEmail } = require('../lib/email');
      const employee = await prisma.user.findUnique({ where: { id: expense.userId }, select: { id: true, email: true, name: true } });
      if (employee) {
        const status = req.body.status;
        const statusLabel = status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : status === 'PAID' ? 'paid' : status.toLowerCase();
        await prisma.notification.create({
          data: { userId: employee.id, type: 'APPROVAL_RESULT', title: `Expense ${statusLabel}`, body: `Your expense claim "${expense.description}" has been ${statusLabel}.`, entityType: 'ExpenseRequest', entityId: expense.id },
        }).catch(() => {});
        sendEmail({
          to: employee.email,
          subject: `[IMS] ${status === 'APPROVED' ? '✅' : status === 'PAID' ? '💸' : '❌'} Expense ${statusLabel}: ${expense.description}`,
          text: `Your expense claim "${expense.description}" (${Number(expense.amount).toLocaleString()} RWF) has been ${statusLabel}.${req.body.reviewerComment ? '\n\nComment: ' + req.body.reviewerComment : ''}`,
          html: `<div style="font-family:sans-serif;max-width:500px;"><h2 style="color:${status === 'REJECTED' ? '#dc2626' : '#16a34a'};">${status === 'APPROVED' ? '✅ Expense Approved' : status === 'PAID' ? '💸 Expense Paid' : '❌ Expense Rejected'}</h2><p>Your expense claim has been <strong>${statusLabel}</strong>:</p><div style="background:#f3f4f6;border-radius:8px;padding:16px;margin:16px 0;"><p style="margin:4px 0;"><strong>Description:</strong> ${expense.description}</p><p style="margin:4px 0;"><strong>Amount:</strong> ${Number(expense.amount).toLocaleString()} RWF</p></div>${req.body.reviewerComment ? '<p>💬 ' + req.body.reviewerComment + '</p>' : ''}<p style="color:#6b7280;font-size:12px;">— IMS System</p></div>`,
        });
      }
    } catch {}

    res.json(expense);
  } catch (err) { next(err); }
});

export default router;
