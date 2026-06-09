# Implementation Plan: Integrated Management System (IMS)

## Overview

Implement the IMS as a Next.js 14 App Router application with Prisma ORM (PostgreSQL), next-auth v4, Tailwind CSS, and TypeScript. Tasks are ordered so each builds on the previous: project scaffolding → database schema → auth & RBAC → shared components → feature modules → cross-cutting concerns (notifications, search, reporting, audit) → admin dashboard → tests.

---

## Tasks

- [-] 1. Scaffold project, tooling, and shared configuration
  - [-] 1.1 Initialize Next.js 14 App Router project with TypeScript and Tailwind CSS
    - Run `npx create-next-app@latest` with `--typescript --tailwind --app --eslint` flags
    - Configure `tsconfig.json` with strict mode and path aliases (`@/` → `src/`)
    - Install and configure Prettier with Tailwind plugin
    - Add `fast-check`, `jest`, `ts-jest`, `@types/jest`, `jest-mock-extended` as dev dependencies
    - Configure `jest.config.ts` for ts-jest with module path aliases
    - _Requirements: Non-Functional — Maintainability_

  - [-] 1.2 Configure Prisma with PostgreSQL and complete the database schema
    - Replace the stub `prisma/schema.prisma` with the full schema from the design document (all enums + 30+ models)
    - Add `DATABASE_URL` to `.env` and `.env.example`
    - Run `npx prisma generate` and `npx prisma migrate dev --name init` to create the initial migration
    - Add `@prisma/client` singleton helper at `src/lib/prisma.ts`
    - _Requirements: 4, 5, 6, 8, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 29, 30, 33_

  - [-] 1.3 Set up environment variable schema and global type declarations
    - Create `src/lib/env.ts` — validates required env vars using Zod at startup (DATABASE_URL, NEXTAUTH_SECRET, S3_BUCKET, etc.)
    - Add `src/types/next-auth.d.ts` augmenting the Session/JWT types to include `role` and `department`
    - _Requirements: 1, 2_

- [ ] 2. Authentication and RBAC
  - [ ] 2.1 Implement next-auth v4 CredentialsProvider and session callbacks
    - Create `src/app/api/auth/[...nextauth]/route.ts` with `CredentialsProvider.authorize()`: Prisma lookup + `bcryptjs.compare`
    - Extend `callbacks.jwt` to embed `role` and `department` into the JWT
    - Extend `callbacks.session` to expose `role` and `department` on the client session
    - Set session strategy to `jwt` with `maxAge: 86400` (24 hours per Requirement 1.4)
    - Create `src/lib/auth.ts` exporting `authOptions` for reuse across route handlers
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 2.2 Write property test: Invalid credentials never authenticate (Property 1)
    - **Property 1: Invalid Credentials Never Authenticate**
    - **Validates: Requirements 1.2**
    - Use `fc.record({ email: fc.emailAddress(), password: fc.string() })` to generate credentials that don't match any seeded user
    - Assert `authenticate()` returns `null` for all generated inputs

  - [ ]* 2.3 Write property test: Password hashing round-trip (Property 2)
    - **Property 2: Password Hashing Round-Trip**
    - **Validates: Requirements 1.3**
    - Use `fc.string({ minLength: 8 })` to generate passwords; hash with bcryptjs then compare
    - Assert original plaintext compares true; any other string compares false; hash ≠ plaintext

  - [ ] 2.4 Implement RBAC middleware guard
    - Create `middleware.ts` at project root intercepting `/(dashboard)/**` and `/api/**` (except `/api/auth/**`)
    - Implement `PERMISSIONS` map matching the design document's permission matrix
    - Redirect unauthorized page requests to `/403`; return `403 JSON` for unauthorized API requests
    - Write `src/lib/rbac.ts` exporting a pure `checkPermission(role, department, path)` function
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.3_

  - [ ]* 2.5 Write property test: Admin access is unrestricted by department (Property 4)
    - **Property 4: Admin Access Is Unrestricted by Department**
    - **Validates: Requirements 2.3**
    - Use `fc.constantFrom(...allPaths)` × `fc.constantFrom(...allDepartments)`
    - Assert `checkPermission('ADMIN', dept, path)` === `'granted'` for all combinations

  - [ ]* 2.6 Write property test: Scoped role access within department (Property 5)
    - **Property 5: Scoped Role Access Within Department**
    - **Validates: Requirements 2.4, 2.5, 2.6**
    - Use `fc.constantFrom('MANAGER', 'EMPLOYEE')` × `fc.constantFrom(...departments)`
    - Assert granted when dept matches the route scope; denied when dept differs

  - [ ] 2.7 Build login page and logout route
    - Create `src/app/(auth)/login/page.tsx` — email/password form using server action or API call
    - Create `src/app/(auth)/logout/page.tsx` — calls `signOut()` and redirects to login
    - Style with Tailwind; mobile-responsive (320px minimum)
    - _Requirements: 1.1, 1.5, 34.1, 34.2_

  - [ ] 2.8 Implement password management API
    - Create `POST /api/users/[id]/reset-password` — Admin-only; generates a signed reset token, stores in `PasswordResetToken` (add model to schema), sends email
    - Create `POST /api/auth/reset-password` — validates token, hashes new password with bcryptjs (12 rounds), updates `User.passwordHash`, deletes token
    - _Requirements: 4.5_

- [ ] 3. Shared UI shell and reusable components
  - [ ] 3.1 Implement dashboard layout with sidebar and header
    - Create `src/app/(dashboard)/layout.tsx` — wraps pages with auth guard (`getServerSession`), renders `<Sidebar>` and `<Header>`
    - `<Sidebar>` filters nav links by `session.user.role` and `session.user.department`
    - `<Header>` includes global search input, notification bell, and user avatar menu
    - _Requirements: 2.3, 2.4, 2.5, 34.5_

  - [ ] 3.2 Build reusable DataTable component
    - Create `src/components/DataTable.tsx` — sortable columns, client-side filter prop, pagination controls
    - Accepts generic typed rows; renders `<StatusBadge>` cells where applicable
    - Keyboard accessible (WCAG 2.1 AA): `role="grid"`, `aria-sort`, focusable rows
    - _Requirements: 33.4, 34.1, 34.2_

  - [ ] 3.3 Build reusable FormModal, StatusBadge, and FilterBar components
    - `src/components/FormModal.tsx` — accessible dialog (`role="dialog"`, `aria-modal`, focus trap)
    - `src/components/StatusBadge.tsx` — color-coded chip mapping enum values to Tailwind classes
    - `src/components/FilterBar.tsx` — renders filter controls; persists active filters in URL search params
    - _Requirements: 33.2, 33.4, 33.5_

  - [ ] 3.4 Build FileUploader component with presigned S3 upload
    - Create `src/components/FileUploader.tsx` — validates file size client-side before requesting presigned URL
    - Create `POST /api/upload/presign` — validates session + context (task-attachment / media-asset / employee-doc / expense-receipt / report-attachment), generates S3 presigned POST
    - After S3 upload success, POST metadata to entity-specific attachment endpoint
    - _Requirements: 6.5, 10.5, 21.3_

  - [ ] 3.5 Build NotificationPanel and SSE connection hook
    - Create `src/components/NotificationPanel.tsx` — renders unread notification list; marks as read on click
    - Create `src/hooks/useNotifications.ts` — opens `EventSource('/api/notifications/stream')`, appends incoming events to local state
    - Create `GET /api/notifications/stream` — SSE handler with per-user `activeConnections` map
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 3.6 Implement global error handling and Zod validation helpers
    - Create `src/lib/api-error.ts` — exports `apiError(code, message, status, details?)` returning a `NextResponse` with the standard error envelope
    - Create `src/lib/validate.ts` — wraps Zod `.safeParse()` and returns `422` on failure
    - Map Prisma error codes P2002 → 409, P2025 → 404 in a shared `handlePrismaError` util
    - _Requirements: Non-Functional — Data Integrity_

- [ ] 4. User and department management API + UI
  - [ ] 4.1 Implement Users CRUD API
    - `GET /api/users` — paginated list; Admin only
    - `POST /api/users` — create user; validates name, email (unique), role, department; hashes password; writes AuditLog CREATE
    - `GET /api/users/[id]` — Admin or self
    - `PATCH /api/users/[id]` — update fields; writes AuditLog UPDATE
    - `DELETE /api/users/[id]` — sets `isActive = false`; writes AuditLog DELETE
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 30.2, 30.4_

  - [ ]* 4.2 Write property test: User creation assigns exactly one role (Property 3)
    - **Property 3: User Creation Assigns Exactly One Role**
    - **Validates: Requirements 2.2**
    - Use `fc.constantFrom('ADMIN', 'MANAGER', 'EMPLOYEE')` for role field
    - Assert persisted `User.role` equals supplied role and is non-null

  - [ ]* 4.3 Write property test: Email uniqueness invariant (Property 6)
    - **Property 6: Email Uniqueness Invariant**
    - **Validates: Requirements 4.2**
    - Generate sets of distinct emails → all creations succeed; duplicate email → fail with 409; existing record unchanged

  - [ ] 4.4 Build Admin Users management UI
    - `src/app/(dashboard)/admin/users/page.tsx` — DataTable of all users with invite/create, edit, deactivate actions
    - `src/app/(dashboard)/admin/users/[id]/page.tsx` — user detail with role/department change form
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 4.5 Implement Departments API
    - `GET /api/departments` — returns list of Department enum values with member counts
    - _Requirements: 3.1, 3.4_

- [ ] 5. Project and task management
  - [ ] 5.1 Implement Projects CRUD API
    - `GET /api/projects` — filtered by department for Managers/Employees; all for Admin; paginated
    - `POST /api/projects` — Manager+ only; requires name, description, department, deadline
    - `GET /api/projects/[id]`, `PATCH /api/projects/[id]` — with AuditLog entries
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 5.2 Implement Tasks CRUD API
    - `GET /api/projects/[id]/tasks` — tasks for a project; `GET /api/tasks` — cross-department for Admin
    - `POST /api/tasks` — Manager+ only; requires title, description, assigneeId, deadline, projectId; dispatches TASK_ASSIGNED notification; writes AuditLog
    - `PATCH /api/tasks/[id]` — status update by assignee; other fields by Manager+; updates `updatedAt`
    - `GET /api/tasks/[id]`, `DELETE /api/tasks/[id]` (soft via isActive flag or Manager only)
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 7.1_

  - [ ]* 5.3 Write property test: Task status update advances timestamp (Property 7)
    - **Property 7: Task Status Update Advances Timestamp**
    - **Validates: Requirements 6.3**
    - Use `fc.constantFrom(...TaskStatus values)` for new status; record `updatedAt` before and after call
    - Assert stored `status` === new status and new `updatedAt` ≥ old `updatedAt`

  - [ ] 5.4 Implement task comments and attachments APIs
    - `GET/POST /api/tasks/[id]/comments` — any authenticated user in the task's department; auto-detect @username mentions and dispatch TASK_MENTION notification
    - `GET/POST /api/tasks/[id]/attachments` — saves `TaskAttachment` record after S3 upload confirmation
    - _Requirements: 6.4, 6.5, 7.3_

  - [ ]* 5.5 Write property test: Task attachment file size gate (Property 8)
    - **Property 8: Task Attachment File Size Gate**
    - **Validates: Requirements 6.5**
    - Use `fc.integer({ min: 0, max: 200_000_000 })` for file size
    - Assert accept when ≤ 52,428,800 bytes; reject with size-exceeded error when >

  - [ ] 5.6 Build Projects and Tasks UI
    - `src/app/(dashboard)/projects/page.tsx` — DataTable of projects with create modal
    - `src/app/(dashboard)/projects/[id]/page.tsx` — project detail with task list, Kanban-style status columns
    - `src/app/(dashboard)/tasks/page.tsx` — all tasks for current user with FilterBar
    - `src/app/(dashboard)/tasks/[id]/page.tsx` — task detail with comments thread and attachment list
    - _Requirements: 5.4, 5.5, 6.1, 6.2, 6.4, 6.5, 6.6, 34.1_

  - [ ] 5.7 Implement task deadline notifications (24-hour reminder)
    - Add deadline check to `GET /api/workflows/check-delays` — query Tasks with `deadline` within next 24 h and status ≠ COMPLETED; dispatch TASK_DEADLINE notification for each
    - Update status to IN_REVIEW triggers TASK_STATUS notification to Manager (Requirement 7.4)
    - _Requirements: 7.2, 7.4, 24.5_

- [ ] 6. Media department module
  - [ ] 6.1 Implement Recordings CRUD API
    - `GET /api/media/recordings` — Media dept + Admin; paginated, filterable by status
    - `POST /api/media/recordings` — requires eventId, recordingDate, durationSeconds, format; status defaults to CAPTURED; writes AuditLog
    - `PATCH /api/media/recordings/[id]` — validates status transition; dispatches notifications on state change
    - `GET /api/media/recordings/[id]`
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 6.2 Write property test: Recording status transition validity (Property 9)
    - **Property 9: Recording Status Transition Validity**
    - **Validates: Requirements 8.2, 11.1, 11.2, 11.3**
    - Use `fc.constantFrom(...RecordingStatus)` × `fc.constantFrom(...RecordingStatus)` for (current, next) pairs
    - Assert transitions allowed only following CAPTURED → IN_EDITING → EDITED → APPROVED → PUBLISHED; all backward/skipped-step transitions rejected

  - [ ] 6.3 Implement editing workflow service
    - In `RecordingService.startEditing(id, editorId)`: set status to IN_EDITING, assign editor, auto-create editing Task in Media project, write AuditLog
    - `PATCH /api/media/recordings/[id]` handles `editingProgress` update; when progress reaches 100 set status to EDITED, notify Media Manager (Requirement 9.3, 9.5)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 6.4 Implement Content Approval API
    - `POST /api/media/recordings/[id]/approve` — Media Manager only; decision (true/false), notes, rejectionReason; updates Recording status to APPROVED or back to IN_EDITING; creates ContentApproval record; notifies editor on rejection; triggers PublishingQueue creation on approval; writes AuditLog
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 16.1_

  - [ ] 6.5 Implement Media Assets API
    - `GET /api/media/assets` — searchable by title, category, tags, date range; paginated
    - `POST /api/media/assets` — after S3 upload; requires title, fileType, category, tags; stores metadata including fileSizeBytes; increments `StorageQuota.usedBytes`
    - `GET/PATCH/DELETE /api/media/assets/[id]`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 18.1_

  - [ ]* 6.6 Write property test: Media asset file size gate (Property 10)
    - **Property 10: Media Asset File Size Gate**
    - **Validates: Requirements 10.5**
    - Use `fc.bigInt({ min: 0n, max: 5_000_000_000n })` for file size
    - Assert accept when ≤ 2,147,483,648 bytes; reject with size-exceeded error when >

  - [ ] 6.7 Implement Media Requests API
    - `GET/POST /api/media/requests` — Evangelism Employees create requests; Media Manager receives APPROVAL_REQUIRED notification
    - `PATCH /api/media/requests/[id]` — Media Manager accepts (creates Recording, assigns employee per Req 15.4) or declines with reason; writes AuditLog
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 6.8 Build Media department UI pages
    - `src/app/(dashboard)/media/recordings/page.tsx` — DataTable with status filter and create modal
    - `src/app/(dashboard)/media/recordings/[id]/page.tsx` — detail with editing progress bar, approval action, attachment upload
    - `src/app/(dashboard)/media/library/page.tsx` — media asset grid with search/filter, upload button
    - `src/app/(dashboard)/media/queue/page.tsx` — publishing queue table (see also Task 8.2)
    - _Requirements: 8.1, 8.4, 9.2, 10.3, 10.4, 11.5, 34.1_

- [ ] 7. Evangelism department module
  - [ ] 7.1 Implement Events CRUD API
    - `GET /api/evangelism/events` — Evangelism dept + Admin; paginated, filterable by status/date
    - `POST /api/evangelism/events` — requires title, date, location, preacherId(s), eventType; status defaults to PLANNED
    - `PATCH /api/evangelism/events/[id]` — status update; when set to COMPLETED prompt event report creation (Requirement 12.5); writes AuditLog
    - `GET /api/evangelism/events/[id]`
    - _Requirements: 12.1, 12.2, 12.3, 12.5_

  - [ ] 7.2 Implement Preachers CRUD API
    - `GET /api/evangelism/preachers` — list with event participation count
    - `POST /api/evangelism/preachers` — Manager+; requires name, contact, specialization
    - `PATCH /api/evangelism/preachers/[id]` — update fields, add notes
    - Link preachers to events via `EventPreacher` junction on event create/update
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 7.3 Implement Event Reports API
    - `GET/POST /api/evangelism/events/[id]/report` — Evangelism Employees submit reports; requires attendanceCount, activitiesSummary, outcomes, challenges; notifies Evangelism Manager on submit
    - `PATCH /api/evangelism/events/[id]/report` — Manager review: approve or request revision; notifies author
    - Attachments via `/api/evangelism/events/[id]/report/attachments` referencing `EventReportAttachment`
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ] 7.4 Build Evangelism department UI pages
    - `src/app/(dashboard)/evangelism/events/page.tsx` — events DataTable with create modal
    - `src/app/(dashboard)/evangelism/events/[id]/page.tsx` — event detail with preacher list, media request button, report section
    - `src/app/(dashboard)/evangelism/preachers/page.tsx` — preachers list with create/edit modal and event history
    - _Requirements: 12.4, 13.2, 13.3, 14.3, 34.1_

- [ ] 8. IT department module
  - [ ] 8.1 Implement Support Tickets API
    - `GET /api/it/tickets` — IT dept + Admin; `GET /api/it/tickets` with `?mine=true` for non-IT users
    - `POST /api/it/tickets` — any authenticated user; requires title, description, priority, category; notifies IT dept; writes AuditLog
    - `PATCH /api/it/tickets/[id]` — IT assigns, changes status; on RESOLVED notify creator (Requirement 19.7)
    - `GET /api/it/tickets/[id]`
    - Comments: `GET/POST /api/it/tickets/[id]/comments`
    - Attachments: `POST /api/it/tickets/[id]/attachments`
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_

  - [ ] 8.2 Implement Publishing Queue API
    - `GET /api/it/queue` — IT dept + Admin; ordered by priority
    - `PATCH /api/it/queue/[id]` — reorder priority; assign platforms; IT only
    - `POST /api/it/queue/[id]/publish` — marks Recording as PUBLISHED, sets `publishedAt`, records per-platform publish; removes from queue; writes AuditLog
    - `PublishingQueue` auto-created by `ContentApproval` service (Task 6.4)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ] 8.3 Implement Platforms CRUD API
    - `GET /api/it/platforms` — IT + Admin
    - `POST /api/it/platforms` — IT Manager; requires name, type, url, apiCredentials (store encrypted)
    - `PATCH /api/it/platforms/[id]` — toggle isActive; update fields
    - `GET /api/it/platforms/[id]` — includes publishing history (count + last published date)
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ] 8.4 Implement Storage Tracking API
    - `GET /api/it/storage` — current `StorageQuota` per department + trend data from `StorageUsageSnapshot`
    - `PATCH /api/it/storage` — IT Employee sets quota per department; writes AuditLog
    - `GET /api/it/storage/snapshot` — cron-triggered endpoint; inserts `StorageUsageSnapshot` records; checks 90% threshold and dispatches notifications
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 8.5 Build IT department UI pages
    - `src/app/(dashboard)/it/tickets/page.tsx` — tickets DataTable with create modal (accessible to all users)
    - `src/app/(dashboard)/it/tickets/[id]/page.tsx` — ticket detail with comments and attachments
    - `src/app/(dashboard)/it/platforms/page.tsx` — platforms management with create/edit modal
    - `src/app/(dashboard)/it/storage/page.tsx` — storage usage dashboard with Recharts bar chart and quota edit
    - _Requirements: 16.2, 17.4, 18.4, 34.1_

- [ ] 9. HR / Finance department module
  - [ ] 9.1 Implement Employee Profiles API
    - `GET /api/hr/employees` — HR dept + Admin; paginated
    - `POST /api/hr/employees` — creates `EmployeeProfile` linked to existing User; requires position, hireDate, dateOfBirth, contactInfo
    - `GET/PATCH /api/hr/employees/[id]` — update fields; add employment history entry on department/position change
    - `DELETE /api/hr/employees/[id]` — sets `isActive = false`; writes AuditLog
    - Documents: `POST /api/hr/employees/[id]/documents` — 10 MB limit enforced at presign
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

  - [ ] 9.2 Implement Attendance Management API
    - `POST /api/hr/attendance/checkin` — creates `AttendanceRecord`; `POST /api/hr/attendance/checkout` — updates record, calculates `totalHours`
    - `GET /api/hr/attendance` — HR Manager; filterable by user, date, department
    - `PATCH /api/hr/attendance/[id]` — HR Employee manual edit; requires `justificationNote`; sets `manuallyEdited = true`
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [ ] 9.3 Implement Leave Management API
    - `GET/POST /api/hr/leave` — Employee submits leave request; notifies Manager; validates no overlap for same user
    - `PATCH /api/hr/leave/[id]` — Manager approve/reject with comment; notifies employee
    - `GET /api/hr/leave/balance/[userId]` — computes remaining leave balance from approved requests
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7_

  - [ ]* 9.4 Write property test: Leave balance consistency (Property 11)
    - **Property 11: Leave Balance Consistency**
    - **Validates: Requirements 22.5**
    - Use `fc.array(fc.record({ leaveType: fc.constantFrom(...LeaveTypes), days: fc.integer({ min: 1, max: 30 }) }))` for approved leave lists
    - Assert balance = allowance − totalApprovedDays; never negative when total ≤ allowance

  - [ ]* 9.5 Write property test: Leave request overlap rejection (Property 12)
    - **Property 12: Leave Request Overlap Rejection**
    - **Validates: Requirements 22.6**
    - Use `fc.date()` pairs for [A_start, A_end] and [B_start, B_end]
    - Assert overlap detected iff B_start ≤ A_end AND B_end ≥ A_start; creation rejected when overlapping

  - [ ] 9.6 Implement Expense Management API
    - `GET/POST /api/hr/expenses` — Employee submits; requires description, amount, category, expenseDate, receiptUrl (S3); notifies Manager
    - `PATCH /api/hr/expenses/[id]` — Manager approve/reject/INFO_REQUESTED; Finance marks PAID; notifies employee on any status change
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

  - [ ] 9.7 Build HR department UI pages
    - `src/app/(dashboard)/hr/employees/page.tsx` — employee profiles DataTable with create modal
    - `src/app/(dashboard)/hr/attendance/page.tsx` — check-in/check-out buttons and attendance table with manual edit
    - `src/app/(dashboard)/hr/leave/page.tsx` — leave request list with create form; remaining balance display
    - `src/app/(dashboard)/hr/expenses/page.tsx` — expense requests DataTable with receipt upload
    - _Requirements: 20.3, 21.2, 22.5, 23.5, 34.1_

- [ ] 10. Notifications and preferences
  - [ ] 10.1 Implement NotificationService and notification creation helpers
    - Create `src/services/NotificationService.ts` — `send(userId, type, title, body, entityType?, entityId?)` method
    - Check `NotificationPreference` for target user; skip if type disabled and not mandatory
    - Push SSE event if user is in `activeConnections` map
    - Respect quiet hours: defer email if in quiet window; always write in-app record
    - _Requirements: 32.1, 32.3, 32.4, 32.5_

  - [ ] 10.2 Implement Notifications API
    - `GET /api/notifications` — paginated list for current user, sorted by `createdAt` DESC
    - `PATCH /api/notifications/[id]` — mark as read
    - `PATCH /api/notifications/read-all` — mark all as read for current user
    - _Requirements: 7.5_

  - [ ] 10.3 Implement Notification Preferences API
    - `GET /api/notifications/preferences` — returns `NotificationPreference` for current user (creates default if none exists)
    - `PATCH /api/notifications/preferences` — update per-type toggle, deliveryMethod, quietHours
    - _Requirements: 32.1, 32.2, 32.3_

  - [ ] 10.4 Build Notifications UI page
    - `src/app/(dashboard)/notifications/page.tsx` — full notification list with read/unread filter and preference settings panel
    - _Requirements: 7.5, 32.1, 32.2, 32.3_

- [ ] 11. Reporting module
  - [ ] 11.1 Implement Weekly Reports API
    - `GET/POST /api/reports/weekly` — Employee submits; requires workCompleted, challengesFaced, nextWeekPlans; enforces one report per (userId, weekStartDate); notifies Manager
    - `PATCH /api/reports/weekly/[id]` — Manager review: approve or REVISION_REQUESTED with comments; notifies author
    - Attachments: `POST /api/reports/weekly/[id]/attachments`
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 26.1, 26.2, 26.3, 26.4, 26.5_

  - [ ]* 11.2 Write property test: Weekly deadline is always next Friday 17:00 (Property 13)
    - **Property 13: Weekly Deadline Is Always Next Friday 17:00**
    - **Validates: Requirements 25.2**
    - Use `fc.date()` for arbitrary DateTime T
    - Assert `computeWeeklyDeadline(T)` is a Friday, has time 17:00:00 local, and is ≥ T

  - [ ] 11.3 Implement Automatic Reports API
    - `GET /api/reports/auto?type=daily-tasks&dept=MEDIA&date=...` — generates daily task completion report from live DB aggregation
    - `GET /api/reports/auto?type=weekly-attendance&dept=...` — weekly attendance summary
    - `GET /api/reports/auto?type=monthly-workflow` — monthly cross-department workflow metrics
    - All endpoints return JSON; include `?format=csv` query param for CSV export via `papaparse` or manual serialization
    - _Requirements: 27.1, 27.2, 27.3, 27.4_

  - [ ]* 11.4 Write property test: Task report count consistency (Property 14)
    - **Property 14: Task Report Count Consistency**
    - **Validates: Requirements 27.1**
    - Use `fc.array(fc.record({ status: fc.constantFrom(...TaskStatus), deadline: fc.date() }))` for task lists
    - Assert sum of per-status counts (including OVERDUE) equals total input count

  - [ ] 11.5 Implement Performance Tracking API
    - `GET /api/reports/performance/[userId]` — computes score from task completion rate, attendance rate, report submission rate; returns 6-month trend
    - `POST /api/reports/performance/[userId]/notes` — Manager+ adds `PerformanceNote`
    - `GET /api/reports/performance` — Manager view: list of employees with scores; sorted/filterable
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6_

  - [ ]* 11.6 Write property test: Performance score bounded in [0, 1] (Property 15)
    - **Property 15: Performance Score Bounded in [0, 1]**
    - **Validates: Requirements 29.1**
    - Use `fc.float({ min: 0, max: 1 })` × 3 for (taskRate, attendanceRate, reportRate)
    - Assert `computePerformanceScore(taskRate, attendanceRate, reportRate)` ∈ [0.0, 1.0]

  - [ ] 11.7 Build Reporting UI pages
    - `src/app/(dashboard)/reports/weekly/page.tsx` — weekly report form and submission history DataTable; Manager review queue
    - `src/app/(dashboard)/reports/performance/page.tsx` — performance dashboard with Recharts line charts (6-month trend), employee comparison table, notes panel
    - _Requirements: 25.4, 26.5, 29.2, 29.5, 29.6, 34.1_

- [ ] 12. Search, saved filters, and audit logging
  - [ ] 12.1 Implement Global Search API
    - `GET /api/search?q=...&types=tasks,projects,events,reports,users&dept=...&status=...` — PostgreSQL `contains` (insensitive) across all indexed text fields; returns ranked results with entity type and matched field highlighted
    - Respect RBAC: filter results by user's accessible departments
    - _Requirements: 33.1, 33.2, 33.3_

  - [ ]* 12.2 Write property test: Search results containment (Property 17)
    - **Property 17: Search Results Containment**
    - **Validates: Requirements 33.1**
    - Use `fc.string({ minLength: 1 })` as query Q; seed DB with records that do/don't contain Q
    - Assert every returned result contains Q (case-insensitive) in at least one indexed text field

  - [ ] 12.3 Implement Saved Filters API
    - `GET /api/search/filters?context=tasks` — list saved filters for current user + context
    - `POST /api/search/filters` — save filter combination (name, context, filterParams JSON)
    - `DELETE /api/search/filters/[id]` — delete own saved filter
    - _Requirements: 33.5_

  - [ ] 12.4 Implement Audit Logging API and UI
    - `GET /api/audit-logs` — Admin only; filterable by userId, action, entityType, entityId, date range; paginated
    - Ensure `AuditService.log(userId, action, entityType, entityId?, details?, ipAddress?)` is called from all mutating service methods
    - `src/app/(dashboard)/admin/audit-logs/page.tsx` — DataTable with advanced filters
    - _Requirements: 30.1, 30.2, 30.3, 30.4, 30.5, 30.6_

  - [ ]* 12.5 Write property test: Audit log completeness (Property 16)
    - **Property 16: Audit Log Completeness**
    - **Validates: Requirements 30.1, 30.2, 30.3, 30.4**
    - Use `fc.constantFrom(...AuditAction values)` for action types
    - After executing each auditable action, query DB and assert an AuditLog record exists with non-null userId, matching action, non-null entityType, and createdAt within 1 second

- [ ] 13. Admin dashboard and cross-cutting UI
  - [ ] 13.1 Build Admin dashboard page
    - `src/app/(dashboard)/admin/page.tsx` (or `src/app/(dashboard)/page.tsx` for role-adaptive landing)
    - Server Component fetching: user counts by role/dept, task statistics (total/completed/overdue/rate), dept activity metrics, system alerts
    - Recharts bar chart for dept activity; real-time revalidation via `revalidate: 30`
    - Date-range and department filter controls wired to Server Action or search params
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6_

  - [ ] 13.2 Build role-adaptive Employee/Manager dashboard
    - `src/app/(dashboard)/page.tsx` — renders different widgets based on `session.user.role`: Employee sees my tasks, my reports, notifications; Manager sees team tasks, pending approvals, report queue
    - _Requirements: 28.1, 28.3_

  - [ ] 13.3 Build Admin settings and reports UI pages
    - `src/app/(dashboard)/admin/reports/page.tsx` — auto-report viewer with PDF/CSV export buttons; report scheduling form
    - `src/app/(dashboard)/admin/settings/page.tsx` — notification scheduling and mandatory notification config
    - _Requirements: 27.4, 27.5, 32.5_

  - [ ] 13.4 Implement data export endpoints
    - `GET /api/admin/export?entity=users&format=csv` — Admin only; streams CSV of Users
    - `GET /api/admin/export?entity=tasks&dept=...&from=...&to=...&format=csv`
    - `GET /api/admin/export?entity=projects&format=csv`
    - `GET /api/admin/export?entity=reports&format=csv`
    - _Requirements: 31.1, 31.2_

- [ ] 14. Workflow automation and delay escalation
  - [ ] 14.1 Implement cross-department workflow service
    - Create `src/services/WorkflowService.ts` — orchestrates the full chain: Event → MediaRequest → Recording → Editing → Approval → PublishingQueue → Published
    - Each step is an atomic Prisma transaction: update entity + create downstream record + dispatch notifications + write AuditLog
    - Add `GET /api/workflows/check-delays` endpoint — scans overdue Tasks, stalled Recordings, pending MediaRequests > 48 h; dispatches escalation notifications to respective Managers
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

  - [ ] 14.2 Build workflow history/status UI component
    - Create `src/components/WorkflowTimeline.tsx` — renders ordered list of workflow steps with status badges and timestamps; used on Event detail and Recording detail pages
    - _Requirements: 24.3, 24.4_

- [ ] 15. Mobile responsiveness and accessibility polish
  - [ ] 15.1 Audit and fix all pages for mobile responsiveness
    - Apply Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to all layout containers, grids, and DataTable wrappers
    - Replace desktop navigation with a collapsible hamburger menu on screens < `md`
    - Ensure all buttons and inputs meet 44×44px touch target minimum
    - _Requirements: 34.1, 34.2, 34.3, 34.5_

  - [ ] 15.2 Optimize media previews for mobile and implement WCAG 2.1 AA fixes
    - Serve compressed thumbnails (WebP, max 300px) via a `?thumb=1` query param on the media asset URL, generated during upload
    - Audit all interactive elements for keyboard navigability, ARIA roles, and color contrast ≥ 4.5:1
    - Add `aria-live` region for SSE notifications (`polite`)
    - _Requirements: 10.4, 34.4, Non-Functional — Accessibility_

- [ ] 16. Final checkpoint — full test suite and integration verification
  - Ensure all Jest unit tests pass (`npx jest --run`)
  - Ensure all fast-check property tests pass
  - Run `npx prisma migrate deploy` against a clean test DB and confirm no migration errors
  - Verify RBAC middleware blocks unauthorized access across all routes manually
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints (Task 16) ensure incremental validation
- Property tests (fast-check) validate universal correctness properties (Properties 1–17)
- Unit tests validate specific examples and edge cases
- All API routes use the standard `ApiError` envelope from Task 3.6
- All mutating API routes write an `AuditLog` entry via `AuditService.log()`
- The presigned S3 upload pattern (Task 3.4) is reused across all file-upload scenarios
- SSE notifications (Task 3.5) require a persistent server process; use a Node.js runtime target (not Edge) for the `/api/notifications/stream` route

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "3.6"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7", "2.8", "3.2", "3.3", "3.4", "3.5"] },
    { "id": 4, "tasks": ["4.1", "4.5"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 6, "tasks": ["5.1", "10.1", "10.2", "10.3"] },
    { "id": 7, "tasks": ["5.2", "10.4"] },
    { "id": 8, "tasks": ["5.3", "5.4", "12.3", "12.4"] },
    { "id": 9, "tasks": ["5.5", "5.6", "5.7", "12.5"] },
    { "id": 10, "tasks": ["6.1", "7.1", "8.1", "9.1", "9.2", "9.3"] },
    { "id": 11, "tasks": ["6.2", "6.3", "7.2", "7.3", "8.2", "8.3", "8.4", "9.4", "9.5", "9.6"] },
    { "id": 12, "tasks": ["6.4", "6.5", "7.4", "8.5", "9.7"] },
    { "id": 13, "tasks": ["6.6", "6.7", "11.1", "12.1"] },
    { "id": 14, "tasks": ["6.8", "11.2", "12.2", "11.3", "11.5"] },
    { "id": 15, "tasks": ["11.4", "11.6", "11.7", "13.1", "13.2", "14.1"] },
    { "id": 16, "tasks": ["13.3", "13.4", "14.2"] },
    { "id": 17, "tasks": ["15.1", "15.2"] }
  ]
}
```
