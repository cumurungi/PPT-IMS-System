# Design Document

## Integrated Management System (IMS)

---

## Overview

The Integrated Management System (IMS) is a multi-tenant, multi-department web application built as two separate projects: a **Vue.js** single-page frontend and a **Node.js / Express** REST API backend. It consolidates organizational operations — task management, media workflows, event management, HR processes, IT support, and reporting — into a single platform. Users interact through a responsive Vue.js interface; all business logic and data access occurs in the Express API layer via Prisma ORM against a MySQL database.

The system serves four organizational departments (Media, Evangelism, IT, HR/Finance), three user roles (Admin, Manager, Employee), and supports cross-department automated workflows (Event → Media Request → Recording → Editing → Publishing Queue → Published).

### Project Structure

| Project | Technology | Description |
|---------|-----------|-------------|
| `ims-backend` | Node.js + Express + Prisma + MySQL | REST API, auth, business logic |
| `ims-frontend` | Vue.js 3 + Vite + Pinia + Tailwind CSS | SPA user interface |

### Key Design Decisions

- **Vue.js 3 (Composition API)** with Vite for the frontend SPA — fast builds, reactive UI, component-based architecture.
- **Express.js** for the REST API backend — lightweight, flexible, wide ecosystem support.
- **JWT (jsonwebtoken)** for stateless authentication — tokens stored in httpOnly cookies, refreshed automatically.
- **Prisma ORM** with MySQL — type-safe queries, automatic migrations, and a rich relational model.
- **Server-Sent Events (SSE)** for real-time notifications — lightweight push mechanism over HTTP.
- **Cloud object storage** (e.g., AWS S3 or compatible) for binary assets — keeps the MySQL database lean, stores only metadata.
- **Express middleware** for RBAC — single enforcement point for all access rules per route.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  ims-frontend  (Vue.js 3 SPA)                   │
│  Vue Router  ←→  Pinia Store  ←→  Axios HTTP Client            │
│  Tailwind CSS    Components         SSE EventSource             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS  (REST + SSE)
┌────────────────────────────▼────────────────────────────────────┐
│                  ims-backend  (Node.js / Express)               │
│                                                                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │   Routers   │  │  Middleware  │  │   SSE Connections   │   │
│  │ /api/v1/... │  │  JWT + RBAC  │  │  (per-user map)     │   │
│  └──────┬──────┘  └──────────────┘  └─────────────────────┘   │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────────┐   │
│  │            Service Layer  (business logic)               │   │
│  │  AuthService │ UserService │ TaskService │ MediaService  │   │
│  │  EventService │ HRService │ NotificationService          │   │
│  └──────┬──────────────────────────────────────────────────┘   │
│         │                                                       │
│  ┌──────▼──────────────────────────────────────────────────┐   │
│  │                    Prisma ORM                            │   │
│  └──────┬──────────────────────────────────────────────────┘   │
└─────────┼───────────────────────────────────────────────────────┘
          │
  ┌───────┴──────────┐       ┌─────────────────────┐
  │    MySQL DB      │       │  Cloud Object Store  │
  │ (all relational  │       │  (S3-compatible)     │
  │  data + meta)   │       │  media, docs, files  │
  └──────────────────┘       └─────────────────────┘
```

### Request Flow

1. Browser sends request → Next.js Middleware checks `next-auth` session.
2. If unauthenticated → redirect to `/login`.
3. If authenticated → RBAC middleware checks role and department permissions for the route.
4. Request reaches API Route handler → calls Service Layer function.
5. Service Layer executes Prisma queries → writes Audit_Log entries for mutations.
6. Service Layer queues Notification events → delivered via SSE to connected clients.
7. Response returned to browser.

### Cross-Department Workflow Automation

Automated workflow transitions are triggered within service layer functions rather than via cron jobs or external queues. When a state transition satisfies a cross-department rule, the service synchronously:

1. Creates the downstream record (e.g., a Recording when a Media Request is accepted).
2. Creates Notification records for the target department.
3. Creates an Audit_Log entry.

This keeps the system consistent and avoids eventual-consistency complexity at this scale.

---

## Components and Interfaces

### Page Structure (Next.js App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── logout/page.tsx
├── (dashboard)/
│   ├── layout.tsx               # Auth + RBAC guard, Sidebar, Header
│   ├── page.tsx                 # Role-adaptive dashboard
│   ├── admin/
│   │   ├── users/page.tsx
│   │   ├── audit-logs/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/page.tsx
│   ├── tasks/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── media/
│   │   ├── recordings/page.tsx
│   │   ├── recordings/[id]/page.tsx
│   │   ├── library/page.tsx
│   │   └── queue/page.tsx
│   ├── evangelism/
│   │   ├── events/page.tsx
│   │   ├── events/[id]/page.tsx
│   │   └── preachers/page.tsx
│   ├── hr/
│   │   ├── employees/page.tsx
│   │   ├── attendance/page.tsx
│   │   ├── leave/page.tsx
│   │   └── expenses/page.tsx
│   ├── it/
│   │   ├── tickets/page.tsx
│   │   ├── tickets/[id]/page.tsx
│   │   ├── platforms/page.tsx
│   │   └── storage/page.tsx
│   ├── reports/
│   │   ├── weekly/page.tsx
│   │   └── performance/page.tsx
│   └── notifications/page.tsx
```

### Component Hierarchy

```
<RootLayout>
  <AuthProvider>          ← next-auth SessionProvider
    <DashboardLayout>
      <Sidebar>           ← role/department-filtered nav links
      <Header>            ← search, notification bell, user menu
      <NotificationPanel> ← SSE-connected real-time feed
      <PageContent>       ← per-route page components
        <DataTable>       ← reusable sortable/filterable table
        <FormModal>       ← reusable create/edit modal
        <StatusBadge>     ← colored status chip
        <FileUploader>    ← validates size, type, triggers upload
        <RichTextEditor>  ← for comments, reports, notes
        <RechartsChart>   ← bar/line/pie charts for dashboards
        <FilterBar>       ← saved filter combinations
```

### API Route Structure

```
app/api/
├── auth/[...nextauth]/route.ts     # next-auth handler
├── users/
│   ├── route.ts                    # GET list, POST create
│   └── [id]/route.ts               # GET, PATCH, DELETE
├── departments/route.ts
├── projects/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── tasks/route.ts
├── tasks/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       ├── comments/route.ts
│       └── attachments/route.ts
├── media/
│   ├── recordings/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── assets/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── requests/route.ts
├── evangelism/
│   ├── events/
│   │   ├── route.ts
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── report/route.ts
│   └── preachers/
│       ├── route.ts
│       └── [id]/route.ts
├── it/
│   ├── tickets/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── platforms/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── queue/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── storage/route.ts
├── hr/
│   ├── employees/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── attendance/route.ts
│   ├── leave/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── expenses/
│       ├── route.ts
│       └── [id]/route.ts
├── reports/
│   ├── weekly/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   └── auto/route.ts
├── notifications/
│   ├── route.ts
│   └── stream/route.ts             # SSE endpoint
├── search/route.ts
└── audit-logs/route.ts
```

---

## Data Models

The Prisma schema below defines all entities. All tables include `createdAt` and `updatedAt` timestamps. Soft deletes are modeled via an `isActive` boolean on User and EmployeeProfile rather than hard deletes, preserving historical data per requirements.

```prisma
// ─── Enums ────────────────────────────────────────────────────────────────────

enum Role {
  ADMIN
  MANAGER
  EMPLOYEE
}

enum Department {
  MEDIA
  EVANGELISM
  IT
  HR_FINANCE
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  COMPLETED
  BLOCKED
}

enum RecordingStatus {
  CAPTURED
  IN_EDITING
  EDITED
  APPROVED
  PUBLISHED
}

enum EventStatus {
  PLANNED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  WAITING
  RESOLVED
  CLOSED
}

enum TicketPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TicketCategory {
  HARDWARE
  SOFTWARE
  NETWORK
  ACCESS
  OTHER
}

enum LeaveType {
  VACATION
  SICK_LEAVE
  PERSONAL_LEAVE
  OTHER
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ExpenseCategory {
  TRAVEL
  MEALS
  EQUIPMENT
  SUPPLIES
  OTHER
}

enum ExpenseStatus {
  PENDING
  APPROVED
  REJECTED
  PAID
  INFO_REQUESTED
}

enum PlatformType {
  VIDEO
  AUDIO
  WEBSITE
  SOCIAL_MEDIA
  OTHER
}

enum MediaRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum ReportStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REVISION_REQUESTED
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_DEADLINE
  TASK_MENTION
  TASK_STATUS
  APPROVAL_REQUIRED
  APPROVAL_RESULT
  REPORT_DUE
  REPORT_SUBMITTED
  WORKFLOW_ALERT
  SYSTEM
}

enum NotificationDelivery {
  IN_APP
  EMAIL
  BOTH
}

enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAIL
  LOGOUT
  CREATE
  UPDATE
  DELETE
  APPROVE
  REJECT
  PERMISSION_CHANGE
}

// ─── Core User & Auth ──────────────────────────────────────────────────────────

model User {
  id                   String    @id @default(cuid())
  name                 String
  email                String    @unique
  passwordHash         String
  role                 Role
  department           Department?
  isActive             Boolean   @default(true)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // Relations
  assignedTasks        Task[]               @relation("TaskAssignee")
  createdTasks         Task[]               @relation("TaskCreator")
  taskComments         TaskComment[]
  taskAttachments      TaskAttachment[]
  projects             Project[]            @relation("ProjectCreator")
  recordings           Recording[]          @relation("RecordingCreator")
  editingTasks         Recording[]          @relation("RecordingEditor")
  approvals            ContentApproval[]
  mediaRequests        MediaRequest[]       @relation("MediaRequestCreator")
  events               Event[]              @relation("EventCreator")
  publishQueueActions  PublishingQueue[]    @relation("QueuePublisher")
  tickets              SupportTicket[]      @relation("TicketCreator")
  ticketAssignee       SupportTicket[]      @relation("TicketAssignee")
  ticketComments       TicketComment[]
  attendanceRecords    AttendanceRecord[]
  leaveRequests        LeaveRequest[]
  expenseRequests      ExpenseRequest[]
  weeklyReports        WeeklyReport[]
  reportReviews        WeeklyReport[]       @relation("ReportReviewer")
  performanceNotes     PerformanceNote[]    @relation("NoteAuthor")
  performanceSubject   PerformanceNote[]    @relation("NoteSubject")
  notifications        Notification[]
  notificationPrefs    NotificationPreference?
  auditLogs            AuditLog[]
  savedFilters         SavedFilter[]
  storageQuotas        StorageQuota[]       @relation("QuotaSetBy")
  employeeProfile      EmployeeProfile?

  @@index([email])
  @@index([role])
  @@index([department])
}

// ─── Employee Profile (HR) ────────────────────────────────────────────────────

model EmployeeProfile {
  id                   String    @id @default(cuid())
  userId               String    @unique
  user                 User      @relation(fields: [userId], references: [id])
  dateOfBirth          DateTime?
  phone                String?
  address              String?
  emergencyContact     String?
  emergencyPhone       String?
  position             String
  hireDate             DateTime
  isActive             Boolean   @default(true)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  employmentHistory    EmploymentHistory[]
  documents            EmployeeDocument[]
}

model EmploymentHistory {
  id                   String    @id @default(cuid())
  profileId            String
  profile              EmployeeProfile @relation(fields: [profileId], references: [id])
  position             String
  department           Department
  startDate            DateTime
  endDate              DateTime?
  notes                String?
  createdAt            DateTime  @default(now())
}

model EmployeeDocument {
  id                   String    @id @default(cuid())
  profileId            String
  profile              EmployeeProfile @relation(fields: [profileId], references: [id])
  name                 String
  fileUrl              String
  fileSizeBytes        Int
  uploadedAt           DateTime  @default(now())
}

// ─── Projects & Tasks ─────────────────────────────────────────────────────────

model Project {
  id                   String    @id @default(cuid())
  name                 String
  description          String
  department           Department
  deadline             DateTime
  isActive             Boolean   @default(true)
  createdById          String
  createdBy            User      @relation("ProjectCreator", fields: [createdById], references: [id])
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  tasks                Task[]

  @@index([department])
  @@index([deadline])
}

model Task {
  id                   String    @id @default(cuid())
  title                String
  description          String
  status               TaskStatus @default(TODO)
  deadline             DateTime
  projectId            String
  project              Project   @relation(fields: [projectId], references: [id])
  assigneeId           String
  assignee             User      @relation("TaskAssignee", fields: [assigneeId], references: [id])
  createdById          String
  createdBy            User      @relation("TaskCreator", fields: [createdById], references: [id])
  crossDepartment      Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  comments             TaskComment[]
  attachments          TaskAttachment[]

  @@index([assigneeId])
  @@index([status])
  @@index([deadline])
  @@index([projectId])
}

model TaskComment {
  id                   String    @id @default(cuid())
  taskId               String
  task                 Task      @relation(fields: [taskId], references: [id])
  authorId             String
  author               User      @relation(fields: [authorId], references: [id])
  body                 String
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([taskId])
}

model TaskAttachment {
  id                   String    @id @default(cuid())
  taskId               String
  task                 Task      @relation(fields: [taskId], references: [id])
  uploadedById         String
  uploadedBy           User      @relation(fields: [uploadedById], references: [id])
  fileName             String
  fileUrl              String
  fileSizeBytes        Int
  uploadedAt           DateTime  @default(now())

  @@index([taskId])
}

// ─── Media Department ─────────────────────────────────────────────────────────

model Recording {
  id                   String    @id @default(cuid())
  title                String
  eventId              String?
  event                Event?    @relation(fields: [eventId], references: [id])
  mediaRequestId       String?   @unique
  mediaRequest         MediaRequest? @relation(fields: [mediaRequestId], references: [id])
  recordingDate        DateTime
  durationSeconds      Int
  format               String
  status               RecordingStatus @default(CAPTURED)
  editingProgress      Int       @default(0)     // 0-100
  editorId             String?
  editor               User?     @relation("RecordingEditor", fields: [editorId], references: [id])
  createdById          String
  createdBy            User      @relation("RecordingCreator", fields: [createdById], references: [id])
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  assets               MediaAsset[]
  approvals            ContentApproval[]
  publishingQueue      PublishingQueue?

  @@index([status])
  @@index([eventId])
}

model MediaAsset {
  id                   String    @id @default(cuid())
  title                String
  fileUrl              String
  fileType             String
  fileSizeBytes        BigInt
  category             String
  tags                 String[]
  thumbnailUrl         String?
  recordingId          String?
  recording            Recording? @relation(fields: [recordingId], references: [id])
  uploadedById         String
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([category])
  @@index([tags])
  @@index([createdAt])
}

model ContentApproval {
  id                   String    @id @default(cuid())
  recordingId          String
  recording            Recording @relation(fields: [recordingId], references: [id])
  approverId           String
  approver             User      @relation(fields: [approverId], references: [id])
  decision             Boolean                   // true=approved, false=rejected
  notes                String?
  rejectionReason      String?
  createdAt            DateTime  @default(now())

  @@index([recordingId])
}

model MediaRequest {
  id                   String    @id @default(cuid())
  eventId              String
  event                Event     @relation(fields: [eventId], references: [id])
  requestedById        String
  requestedBy          User      @relation("MediaRequestCreator", fields: [requestedById], references: [id])
  recordingType        String
  requestedDate        DateTime
  status               MediaRequestStatus @default(PENDING)
  declineReason        String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  recording            Recording?

  @@index([eventId])
  @@index([status])
}

// ─── Publishing ───────────────────────────────────────────────────────────────

model PublishingQueue {
  id                   String    @id @default(cuid())
  recordingId          String    @unique
  recording            Recording @relation(fields: [recordingId], references: [id])
  priority             Int       @default(50)    // 1=highest, 100=lowest
  scheduledDate        DateTime?
  publishedAt          DateTime?
  publishedById        String?
  publishedBy          User?     @relation("QueuePublisher", fields: [publishedById], references: [id])
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  platforms            PublishingQueuePlatform[]

  @@index([priority])
  @@index([scheduledDate])
}

model Platform {
  id                   String    @id @default(cuid())
  name                 String
  type                 PlatformType
  url                  String
  apiCredentials       String?   // stored encrypted
  isActive             Boolean   @default(true)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  publishingRecords    PublishingQueuePlatform[]

  @@index([type])
  @@index([isActive])
}

model PublishingQueuePlatform {
  id                   String    @id @default(cuid())
  queueId              String
  queue                PublishingQueue @relation(fields: [queueId], references: [id])
  platformId           String
  platform             Platform  @relation(fields: [platformId], references: [id])
  publishedAt          DateTime?

  @@unique([queueId, platformId])
}

// ─── Evangelism Department ────────────────────────────────────────────────────

model Event {
  id                   String    @id @default(cuid())
  title                String
  date                 DateTime
  location             String
  eventType            String
  status               EventStatus @default(PLANNED)
  createdById          String
  createdBy            User      @relation("EventCreator", fields: [createdById], references: [id])
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  preachers            EventPreacher[]
  recordings           Recording[]
  mediaRequests        MediaRequest[]
  reports              EventReport[]

  @@index([date])
  @@index([status])
}

model Preacher {
  id                   String    @id @default(cuid())
  name                 String
  email                String?
  phone                String?
  specialization       String
  notes                String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  events               EventPreacher[]
}

model EventPreacher {
  id                   String    @id @default(cuid())
  eventId              String
  event                Event     @relation(fields: [eventId], references: [id])
  preacherId           String
  preacher             Preacher  @relation(fields: [preacherId], references: [id])
  role                 String?

  @@unique([eventId, preacherId])
}

model EventReport {
  id                   String    @id @default(cuid())
  eventId              String
  event                Event     @relation(fields: [eventId], references: [id])
  submittedById        String
  attendanceCount      Int
  activitiesSummary    String
  outcomes             String
  challenges           String
  status               ReportStatus @default(DRAFT)
  reviewNotes          String?
  reviewedById         String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  attachments          EventReportAttachment[]

  @@index([eventId])
}

model EventReportAttachment {
  id                   String    @id @default(cuid())
  reportId             String
  report               EventReport @relation(fields: [reportId], references: [id])
  fileName             String
  fileUrl              String
  fileSizeBytes        Int
  uploadedAt           DateTime  @default(now())
}

// ─── IT Department ────────────────────────────────────────────────────────────

model SupportTicket {
  id                   String    @id @default(cuid())
  title                String
  description          String
  priority             TicketPriority
  category             TicketCategory
  status               TicketStatus @default(OPEN)
  createdById          String
  createdBy            User      @relation("TicketCreator", fields: [createdById], references: [id])
  assigneeId           String?
  assignee             User?     @relation("TicketAssignee", fields: [assigneeId], references: [id])
  resolvedAt           DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  comments             TicketComment[]
  attachments          TicketAttachment[]

  @@index([status])
  @@index([priority])
  @@index([assigneeId])
}

model TicketComment {
  id                   String    @id @default(cuid())
  ticketId             String
  ticket               SupportTicket @relation(fields: [ticketId], references: [id])
  authorId             String
  author               User      @relation(fields: [authorId], references: [id])
  body                 String
  createdAt            DateTime  @default(now())
}

model TicketAttachment {
  id                   String    @id @default(cuid())
  ticketId             String
  ticket               SupportTicket @relation(fields: [ticketId], references: [id])
  fileName             String
  fileUrl              String
  fileSizeBytes        Int
  uploadedAt           DateTime  @default(now())
}

model StorageQuota {
  id                   String    @id @default(cuid())
  department           Department @unique
  quotaBytes           BigInt
  usedBytes            BigInt    @default(0)
  fileCount            Int       @default(0)
  setById              String
  setBy                User      @relation("QuotaSetBy", fields: [setById], references: [id])
  updatedAt            DateTime  @updatedAt
}

model StorageUsageSnapshot {
  id                   String    @id @default(cuid())
  department           Department
  usedBytes            BigInt
  fileCount            Int
  snapshotDate         DateTime

  @@index([department, snapshotDate])
}

// ─── HR / Finance Department ──────────────────────────────────────────────────

model AttendanceRecord {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  date                 DateTime  @db.Date
  checkIn              DateTime?
  checkOut             DateTime?
  totalHours           Float?
  justificationNote    String?
  manuallyEdited       Boolean   @default(false)
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
}

model LeaveRequest {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  leaveType            LeaveType
  startDate            DateTime  @db.Date
  endDate              DateTime  @db.Date
  reason               String
  status               LeaveStatus @default(PENDING)
  reviewedById         String?
  reviewerComment      String?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([startDate, endDate])
}

model ExpenseRequest {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  description          String
  amount               Decimal   @db.Decimal(12, 2)
  category             ExpenseCategory
  expenseDate          DateTime  @db.Date
  receiptUrl           String
  status               ExpenseStatus @default(PENDING)
  reviewedById         String?
  reviewerComment      String?
  paidAt               DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  @@index([userId])
  @@index([status])
  @@index([category])
}

// ─── Reporting ────────────────────────────────────────────────────────────────

model WeeklyReport {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  weekStartDate        DateTime  @db.Date
  workCompleted        String
  challengesFaced      String
  nextWeekPlans        String
  status               ReportStatus @default(DRAFT)
  reviewedById         String?
  reviewer             User?     @relation("ReportReviewer", fields: [reviewedById], references: [id])
  reviewComments       String?
  submittedAt          DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  attachments          WeeklyReportAttachment[]

  @@unique([userId, weekStartDate])
  @@index([userId])
  @@index([status])
  @@index([weekStartDate])
}

model WeeklyReportAttachment {
  id                   String    @id @default(cuid())
  reportId             String
  report               WeeklyReport @relation(fields: [reportId], references: [id])
  fileName             String
  fileUrl              String
  fileSizeBytes        Int
  uploadedAt           DateTime  @default(now())
}

model PerformanceNote {
  id                   String    @id @default(cuid())
  subjectId            String
  subject              User      @relation("NoteSubject", fields: [subjectId], references: [id])
  authorId             String
  author               User      @relation("NoteAuthor", fields: [authorId], references: [id])
  note                 String
  createdAt            DateTime  @default(now())

  @@index([subjectId])
}

// ─── Notifications ────────────────────────────────────────────────────────────

model Notification {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  type                 NotificationType
  title                String
  body                 String
  entityType           String?   // e.g., "Task", "Recording"
  entityId             String?
  isRead               Boolean   @default(false)
  isMandatory          Boolean   @default(false)
  createdAt            DateTime  @default(now())

  @@index([userId, isRead])
  @@index([userId, createdAt])
}

model NotificationPreference {
  id                   String    @id @default(cuid())
  userId               String    @unique
  user                 User      @relation(fields: [userId], references: [id])
  taskAssigned         Boolean   @default(true)
  taskDeadline         Boolean   @default(true)
  taskMention          Boolean   @default(true)
  approvalRequired     Boolean   @default(true)
  approvalResult       Boolean   @default(true)
  reportDue            Boolean   @default(true)
  workflowAlerts       Boolean   @default(true)
  deliveryMethod       NotificationDelivery @default(IN_APP)
  quietHoursStart      String?   // "HH:MM" format
  quietHoursEnd        String?
  updatedAt            DateTime  @updatedAt
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

model AuditLog {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  action               AuditAction
  entityType           String
  entityId             String?
  details              Json?
  ipAddress            String?
  createdAt            DateTime  @default(now())

  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
}

// ─── Saved Filters ────────────────────────────────────────────────────────────

model SavedFilter {
  id                   String    @id @default(cuid())
  userId               String
  user                 User      @relation(fields: [userId], references: [id])
  name                 String
  filterContext        String    // e.g., "tasks", "reports"
  filterParams         Json
  createdAt            DateTime  @default(now())

  @@index([userId, filterContext])
}
```

---

## Authentication and RBAC Implementation

### Authentication Flow (next-auth v4)

```
POST /api/auth/signin
  → CredentialsProvider.authorize()
    → Prisma: User.findUnique({ where: { email } })
    → bcryptjs.compare(password, user.passwordHash)
    → if valid: return { id, name, email, role, department }
    → if invalid: return null (next-auth shows error)
  → next-auth sets encrypted JWT session cookie (HttpOnly, Secure)
```

The JWT payload is extended via `callbacks.jwt` to include `role` and `department`. The `callbacks.session` callback copies these into the client-accessible session object.

### Middleware RBAC Guard

`middleware.ts` at the project root intercepts all requests to `/(dashboard)/**` and `/api/**` (except `/api/auth/**`). It:

1. Validates the session JWT using `getToken()`.
2. Reads `token.role` and `token.department`.
3. Matches the request path against a permission matrix:

```typescript
const PERMISSIONS: Record<string, { roles: Role[]; departments?: Department[] }> = {
  '/admin/**':             { roles: ['ADMIN'] },
  '/media/**':             { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'], departments: ['MEDIA'] },
  '/evangelism/**':        { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'], departments: ['EVANGELISM'] },
  '/hr/**':                { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'], departments: ['HR_FINANCE'] },
  '/it/**':                { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'], departments: ['IT'] },
  '/api/admin/**':         { roles: ['ADMIN'] },
  '/api/media/**':         { roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'], departments: ['MEDIA'] },
  // etc.
}
```

4. If access is denied → API routes return `403 JSON`; page routes redirect to `/403`.
5. All denied access attempts are written to `AuditLog` with action `PERMISSION_CHANGE` equivalent.

### Password Management

- On user creation: `bcryptjs.hash(password, 12)` — 12 rounds balances security and latency.
- On login: `bcryptjs.compare(plaintext, hash)`.
- Password reset: Admin-triggered flow generates a time-limited signed token (stored in a `PasswordResetToken` record); user follows emailed link to set new password.
- Passwords are never stored in plaintext and never returned by any API response.

---

## File Storage Approach

All binary files (media assets, task attachments, employee documents, report attachments, expense receipts) are stored in an S3-compatible object store. The database stores only the metadata and the object URL.

### Upload Flow

```
Client → POST /api/upload/presign?context=task-attachment&entityId=xxx
  → Server validates session + context permissions
  → Server calls S3 SDK: createPresignedPost({ Bucket, Key, Conditions })
  → Server returns { url, fields } to client
Client → PUT directly to S3 using presigned URL (no traffic through Next.js server)
  → On success: Client POSTs metadata to /api/tasks/{id}/attachments
    → Server saves TaskAttachment record with fileUrl, fileSizeBytes
```

### File Size Enforcement

- Task attachments: 50 MB max — enforced both client-side (FileUploader component) and server-side in the presign handler.
- Media assets: 2 GB max — enforced in `/api/media/assets` presign handler.
- Employee documents: 10 MB max — enforced in `/api/hr/employees/{id}/documents`.

### Storage Quota Tracking

After every successful upload, a server-side function increments `StorageQuota.usedBytes` and `fileCount` for the relevant department. A daily cron-style API route (`/api/it/storage/snapshot`) captures the current usage into `StorageUsageSnapshot` for trend reporting. When usage exceeds 90% of quota, notifications are dispatched synchronously.

---

## Real-Time Notifications Approach

### Server-Sent Events (SSE)

The endpoint `GET /api/notifications/stream` establishes a long-lived SSE connection per authenticated user.

```typescript
// Simplified SSE handler
export async function GET(req: Request) {
  const session = await getServerSession();
  const stream = new ReadableStream({
    start(controller) {
      // Register controller in a module-level Map<userId, controller>
      activeConnections.set(session.user.id, controller);
      req.signal.addEventListener('abort', () => {
        activeConnections.delete(session.user.id);
        controller.close();
      });
    }
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}
```

When the service layer calls `NotificationService.send(userId, notification)`:
1. A `Notification` record is written to the database.
2. If `activeConnections.has(userId)`, the SSE event is pushed immediately.
3. If the user is offline, the notification remains unread in the database and is fetched on next load.

### Notification Preference Enforcement

Before sending, `NotificationService` checks `NotificationPreference` for the target user:
- If the notification type is disabled and not `isMandatory` → skip.
- If `deliveryMethod` includes email → also dispatch to email queue.
- If current time falls in `quietHoursStart`–`quietHoursEnd` and not mandatory → defer email, still write in-app record as unread.

---

## Cross-Department Workflow Integration

The core automated workflow chain is:

```
Evangelism creates Event
  └─→ Evangelism creates MediaRequest referencing Event
        └─→ Media Manager accepts MediaRequest
              └─→ Recording created, Media Employee assigned
                    └─→ Recording moves to IN_EDITING
                          └─→ Editing Task auto-created, editor assigned
                                └─→ Editing reaches 100% → status EDITED
                                      └─→ Media Manager approves → status APPROVED
                                            └─→ PublishingQueue entry auto-created
                                                  └─→ IT Employee publishes → status PUBLISHED
```

Each transition is handled by a dedicated service method that atomically:
1. Updates the entity status.
2. Creates downstream entities if applicable.
3. Dispatches notifications to the next department.
4. Writes an Audit_Log entry.

### Workflow Delay Escalation

A lightweight scheduled check runs via `GET /api/workflows/check-delays` (triggered by a Vercel Cron Job or external scheduler at hourly intervals). It queries for:
- Tasks with `deadline < now` and status not `COMPLETED`.
- Recordings in non-terminal statuses past expected SLA windows.
- MediaRequests pending > 48 hours.

For each delayed item, it sends escalation notifications to the respective Manager.

---

## Error Handling

### API Error Contract

All API routes return a consistent JSON error envelope:

```typescript
type ApiError = {
  error: string;       // human-readable message
  code: string;        // machine-readable code, e.g., "FORBIDDEN", "NOT_FOUND"
  details?: unknown;   // optional validation detail
};
```

HTTP status codes follow REST conventions: `400` bad request, `401` unauthenticated, `403` forbidden, `404` not found, `409` conflict (e.g., duplicate email), `422` validation error, `500` server error.

### Validation

All request bodies are validated with [Zod](https://zod.dev/) schemas defined alongside each API route. Invalid input returns `422` with `details` containing the Zod error array.

### Database Errors

Prisma's error codes are mapped:
- `P2002` (unique constraint) → `409 Conflict`.
- `P2025` (record not found) → `404 Not Found`.
- All others → `500` with the error logged server-side only (no stack traces to client).

### File Upload Errors

If a file size check fails at the presign step or the S3 upload is not confirmed within 10 minutes, the presigned URL expires and no database record is created. The client is instructed to retry.

---

## Performance and Caching Strategy

### Database Indexes

The Prisma schema above includes indexes on all frequently queried foreign keys and filter columns:
- `Task`: `assigneeId`, `status`, `deadline`, `projectId`
- `Notification`: `(userId, isRead)`, `(userId, createdAt)`
- `AuditLog`: `userId`, `action`, `(entityType, entityId)`, `createdAt`
- `AttendanceRecord`: `(userId, date)` unique, `date`
- `LeaveRequest`: `(startDate, endDate)`

### Next.js Caching

- **Server Components** for read-heavy pages (project lists, employee lists) use Next.js `fetch` with `{ next: { revalidate: 60 } }` — 60-second stale-while-revalidate.
- **Dashboard metrics** are computed via Server Components with `revalidate: 30`.
- **Search** (`/api/search`) is not cached — always live.
- **Static assets** (thumbnails, UI icons) are served from the CDN edge layer of the hosting platform.

### Pagination

All list endpoints accept `?page=1&pageSize=25` query params. Prisma `.findMany()` uses `skip` and `take`. Default `pageSize` is 25, maximum is 100. List responses include `{ data, total, page, pageSize }` metadata.

### Query Optimization

- `include` statements in Prisma queries are scoped to only fields needed per endpoint — no blanket eager-loading of full relation trees.
- `StorageUsageSnapshot` table is used for trend charts instead of aggregating `MediaAsset.fileSizeBytes` at query time.
- Search queries use PostgreSQL full-text search via Prisma's `contains` with `mode: 'insensitive'` for small datasets; a future migration can add `pg_trgm` indexes for larger datasets.

### Concurrency

- Prisma connection pool is configured for the deployment target (default pool size tuned to stay below PostgreSQL's `max_connections`).
- Optimistic concurrency for status transitions: each entity has `updatedAt`; API handlers verify the client-supplied `updatedAt` matches the DB value before applying changes and return `409` if there's a mismatch.

---

## Testing Strategy

### Unit Tests (Jest + ts-jest)

- Service layer functions tested in isolation with a mocked Prisma client (using `jest-mock-extended`).
- Input validation schemas (Zod) tested with representative valid and invalid payloads.
- RBAC permission matrix logic tested with all role × department combinations.
- Notification preference filtering logic tested with all flag combinations.

### Integration Tests (Jest + Prisma test database)

- API route handlers tested against a real PostgreSQL test database seeded with fixture data.
- Cross-department workflow transitions tested end-to-end within the service layer.
- File upload presign logic tested with mocked S3 SDK.

### Property-Based Tests (fast-check)

Selected service-layer functions are tested as properties using [fast-check](https://github.com/dubzzz/fast-check) (minimum 100 iterations per property). See Correctness Properties section below.

### End-to-End Tests (Playwright)

- Critical user paths: login, create task, submit weekly report, approve recording.
- Cross-department workflow: event creation → media request → recording approval → publishing queue.

### Snapshot/Visual Tests

- Dashboard components rendered with fixture data are snapshot-tested to catch regressions.
- Mobile responsive layouts validated at 320px, 768px, 1280px breakpoints.

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Testing is implemented using [fast-check](https://github.com/dubzzz/fast-check) (TypeScript). Each test runs a minimum of 100 iterations. Tests are tagged with the feature name and property number.

**Reflection Notes**

Before listing properties, redundancies are eliminated:

- 2.4 (Manager access within department) and 2.5 (Employee access within department) share the same structure — both test "role R with department D can access actions scoped to D." These are merged into a single property parameterized over role.
- 6.5 (Task attachment 50MB limit) and 10.5 (MediaAsset 2GB limit) both test file size validation but against different limits — they are NOT redundant; each tests a distinct validation boundary and distinct code path. Kept separate.
- 30.1–30.4 (audit logging for different action types) all test the same invariant — "for any logged action, a record exists with required fields." These are consolidated into a single audit completeness property parameterized over action type.

---

### Property 1: Invalid Credentials Never Authenticate

*For any* (email, password) pair that does not match a registered user's credentials, the `authenticate()` service function SHALL return a null/error result and SHALL NOT create a session.

**Validates: Requirements 1.2**

---

### Property 2: Password Hashing Round-Trip

*For any* plaintext password string, hashing it with bcryptjs and then comparing the original plaintext against the stored hash SHALL return true, and comparing any different string against the stored hash SHALL return false. The stored hash SHALL never equal the original plaintext.

**Validates: Requirements 1.3**

---

### Property 3: User Creation Assigns Exactly One Role

*For any* valid user creation input that includes a role field, the persisted User record SHALL have exactly one non-null role that equals the specified role.

**Validates: Requirements 2.2**

---

### Property 4: Admin Access Is Unrestricted by Department

*For any* route path string and *for any* department value, the RBAC check function SHALL return `granted` when the user's role is ADMIN.

**Validates: Requirements 2.3**

---

### Property 5: Scoped Role Access Within Department

*For any* role in {MANAGER, EMPLOYEE}, *for any* department D, and *for any* action scoped to department D, the RBAC check function SHALL return `granted` when the user's role matches and their assigned department equals D. The RBAC check function SHALL return `denied` when the user's assigned department differs from D.

**Validates: Requirements 2.4, 2.5, 2.6**

---

### Property 6: Email Uniqueness Invariant

*For any* set of user creation requests where all email addresses are distinct, all creations SHALL succeed. *For any* creation request where the email already exists in the system, the operation SHALL fail with a conflict error and the existing user record SHALL remain unchanged.

**Validates: Requirements 4.2**

---

### Property 7: Task Status Update Advances Timestamp

*For any* existing Task record and *for any* valid TaskStatus value, calling the status update service function SHALL result in the Task's stored `status` equaling the new value and `updatedAt` being greater than or equal to the value it held before the update.

**Validates: Requirements 6.3**

---

### Property 8: Task Attachment File Size Gate

*For any* numeric file size value, the attachment validation function SHALL accept the file when size ≤ 52,428,800 bytes (50 MB) and SHALL reject it with a size-exceeded error when size > 52,428,800 bytes.

**Validates: Requirements 6.5**

---

### Property 9: Recording Status Transition Validity

*For any* Recording and *for any* proposed (currentStatus, nextStatus) pair, the transition validation function SHALL allow the transition only when it follows the defined order (CAPTURED → IN_EDITING → EDITED → APPROVED → PUBLISHED) and SHALL reject any backward or skipped-step transition, returning a validation error.

**Validates: Requirements 8.2, 11.1, 11.2, 11.3**

---

### Property 10: Media Asset File Size Gate

*For any* numeric file size value, the media asset validation function SHALL accept the asset when size ≤ 2,147,483,648 bytes (2 GB) and SHALL reject it with a size-exceeded error when size > 2,147,483,648 bytes.

**Validates: Requirements 10.5**

---

### Property 11: Leave Balance Consistency

*For any* employee and *for any* list of approved LeaveRequest records for that employee, the computed remaining leave balance SHALL equal the configured annual allowance minus the total number of approved leave days, and SHALL never be negative when the total approved days do not exceed the allowance.

**Validates: Requirements 22.5**

---

### Property 12: Leave Request Overlap Rejection

*For any* existing approved LeaveRequest with interval [A_start, A_end] for an employee, and *for any* new LeaveRequest with interval [B_start, B_end] for the same employee, the overlap detection function SHALL return `overlapping = true` if and only if B_start ≤ A_end AND B_end ≥ A_start, and the creation SHALL be rejected in that case.

**Validates: Requirements 22.6**

---

### Property 13: Weekly Deadline Is Always Next Friday 17:00

*For any* DateTime value T, the `computeWeeklyDeadline(T)` function SHALL return a DateTime that is (a) a Friday, (b) has time component 17:00:00 local time, and (c) is strictly greater than or equal to T.

**Validates: Requirements 25.2**

---

### Property 14: Task Report Count Consistency

*For any* list of Task records with arbitrary statuses, the generated daily task completion report SHALL satisfy: count(COMPLETED) + count(IN_PROGRESS) + count(IN_REVIEW) + count(TODO) + count(BLOCKED) + count(OVERDUE) = total task count in the input list, where OVERDUE is defined as deadline < now AND status ≠ COMPLETED.

**Validates: Requirements 27.1**

---

### Property 15: Performance Score Bounded in [0, 1]

*For any* triple of rates (taskCompletionRate, attendanceRate, reportSubmissionRate) each drawn from [0.0, 1.0], the `computePerformanceScore()` function SHALL return a value in [0.0, 1.0].

**Validates: Requirements 29.1**

---

### Property 16: Audit Log Completeness

*For any* auditable action (authentication attempt, CRUD operation, approval, permission change), after the action completes, an AuditLog record SHALL exist in the database containing a non-null userId, a non-null action matching the operation type, a non-null entityType, and a createdAt timestamp within 1 second of the action's execution time.

**Validates: Requirements 30.1, 30.2, 30.3, 30.4**

---

### Property 17: Search Results Containment

*For any* search query string Q and *for any* dataset of Tasks, Projects, Events, Reports, and Users, every result returned by the search function SHALL contain the query string Q (case-insensitive) in at least one of its indexed text fields (title, name, description, body).

**Validates: Requirements 33.1**

