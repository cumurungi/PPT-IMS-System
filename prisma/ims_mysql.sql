-- =============================================================================
-- IMS Database Schema — MySQL 8.0+
-- Generated from prisma/schema.prisma
-- Import with: mysql -u <user> -p <database> < ims_mysql.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- -----------------------------------------------------------------------------
-- User
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `User` (
  `id`          VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `email`       VARCHAR(255) NOT NULL,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role`        ENUM('ADMIN','MANAGER','EMPLOYEE') NOT NULL,
  `department`  ENUM('MEDIA','EVANGELISM','IT','HR_FINANCE') NULL,
  `isActive`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  INDEX `User_email_idx` (`email`),
  INDEX `User_role_idx` (`role`),
  INDEX `User_department_idx` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EmployeeProfile
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EmployeeProfile` (
  `id`               VARCHAR(30)  NOT NULL,
  `userId`           VARCHAR(30)  NOT NULL,
  `dateOfBirth`      DATETIME(3)  NULL,
  `phone`            VARCHAR(50)  NULL,
  `address`          TEXT         NULL,
  `emergencyContact` VARCHAR(255) NULL,
  `emergencyPhone`   VARCHAR(50)  NULL,
  `position`         VARCHAR(255) NOT NULL,
  `hireDate`         DATETIME(3)  NOT NULL,
  `isActive`         TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmployeeProfile_userId_key` (`userId`),
  CONSTRAINT `fk_ep_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EmploymentHistory
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EmploymentHistory` (
  `id`         VARCHAR(30)  NOT NULL,
  `profileId`  VARCHAR(30)  NOT NULL,
  `position`   VARCHAR(255) NOT NULL,
  `department` ENUM('MEDIA','EVANGELISM','IT','HR_FINANCE') NOT NULL,
  `startDate`  DATETIME(3)  NOT NULL,
  `endDate`    DATETIME(3)  NULL,
  `notes`      TEXT         NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_eh_profile` FOREIGN KEY (`profileId`) REFERENCES `EmployeeProfile`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EmployeeDocument
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EmployeeDocument` (
  `id`            VARCHAR(30)  NOT NULL,
  `profileId`     VARCHAR(30)  NOT NULL,
  `name`          VARCHAR(255) NOT NULL,
  `fileUrl`       TEXT         NOT NULL,
  `fileSizeBytes` INT          NOT NULL,
  `uploadedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ed_profile` FOREIGN KEY (`profileId`) REFERENCES `EmployeeProfile`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Project
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Project` (
  `id`          VARCHAR(30)  NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` TEXT         NOT NULL,
  `department`  ENUM('MEDIA','EVANGELISM','IT','HR_FINANCE') NOT NULL,
  `deadline`    DATETIME(3)  NOT NULL,
  `isActive`    TINYINT(1)   NOT NULL DEFAULT 1,
  `createdById` VARCHAR(30)  NOT NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Project_department_idx` (`department`),
  INDEX `Project_deadline_idx` (`deadline`),
  CONSTRAINT `fk_proj_creator` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Task
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Task` (
  `id`              VARCHAR(30)  NOT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `description`     TEXT         NOT NULL,
  `status`          ENUM('TODO','IN_PROGRESS','IN_REVIEW','COMPLETED','BLOCKED') NOT NULL DEFAULT 'TODO',
  `deadline`        DATETIME(3)  NOT NULL,
  `projectId`       VARCHAR(30)  NOT NULL,
  `assigneeId`      VARCHAR(30)  NOT NULL,
  `createdById`     VARCHAR(30)  NOT NULL,
  `crossDepartment` TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Task_assigneeId_idx` (`assigneeId`),
  INDEX `Task_status_idx` (`status`),
  INDEX `Task_deadline_idx` (`deadline`),
  INDEX `Task_projectId_idx` (`projectId`),
  CONSTRAINT `fk_task_project`   FOREIGN KEY (`projectId`)   REFERENCES `Project`(`id`),
  CONSTRAINT `fk_task_assignee`  FOREIGN KEY (`assigneeId`)  REFERENCES `User`(`id`),
  CONSTRAINT `fk_task_creator`   FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TaskComment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `TaskComment` (
  `id`        VARCHAR(30) NOT NULL,
  `taskId`    VARCHAR(30) NOT NULL,
  `authorId`  VARCHAR(30) NOT NULL,
  `body`      TEXT        NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TaskComment_taskId_idx` (`taskId`),
  CONSTRAINT `fk_tc_task`   FOREIGN KEY (`taskId`)   REFERENCES `Task`(`id`),
  CONSTRAINT `fk_tc_author` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TaskAttachment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `TaskAttachment` (
  `id`            VARCHAR(30)  NOT NULL,
  `taskId`        VARCHAR(30)  NOT NULL,
  `uploadedById`  VARCHAR(30)  NOT NULL,
  `fileName`      VARCHAR(255) NOT NULL,
  `fileUrl`       TEXT         NOT NULL,
  `fileSizeBytes` INT          NOT NULL,
  `uploadedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `TaskAttachment_taskId_idx` (`taskId`),
  CONSTRAINT `fk_ta_task`     FOREIGN KEY (`taskId`)       REFERENCES `Task`(`id`),
  CONSTRAINT `fk_ta_uploader` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Event  (Evangelism)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Event` (
  `id`          VARCHAR(30)  NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `date`        DATETIME(3)  NOT NULL,
  `location`    VARCHAR(255) NOT NULL,
  `eventType`   VARCHAR(100) NOT NULL,
  `status`      ENUM('PLANNED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PLANNED',
  `createdById` VARCHAR(30)  NOT NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Event_date_idx` (`date`),
  INDEX `Event_status_idx` (`status`),
  CONSTRAINT `fk_event_creator` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Preacher
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Preacher` (
  `id`             VARCHAR(30)  NOT NULL,
  `name`           VARCHAR(255) NOT NULL,
  `email`          VARCHAR(255) NULL,
  `phone`          VARCHAR(50)  NULL,
  `specialization` VARCHAR(255) NOT NULL,
  `notes`          TEXT         NULL,
  `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EventPreacher  (junction)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EventPreacher` (
  `id`         VARCHAR(30)  NOT NULL,
  `eventId`    VARCHAR(30)  NOT NULL,
  `preacherId` VARCHAR(30)  NOT NULL,
  `role`       VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `EventPreacher_eventId_preacherId_key` (`eventId`, `preacherId`),
  CONSTRAINT `fk_ep2_event`    FOREIGN KEY (`eventId`)    REFERENCES `Event`(`id`),
  CONSTRAINT `fk_ep2_preacher` FOREIGN KEY (`preacherId`) REFERENCES `Preacher`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EventReport
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EventReport` (
  `id`                 VARCHAR(30)  NOT NULL,
  `eventId`            VARCHAR(30)  NOT NULL,
  `submittedById`      VARCHAR(30)  NOT NULL,
  `attendanceCount`    INT          NOT NULL,
  `activitiesSummary`  TEXT         NOT NULL,
  `outcomes`           TEXT         NOT NULL,
  `challenges`         TEXT         NOT NULL,
  `status`             ENUM('DRAFT','SUBMITTED','APPROVED','REVISION_REQUESTED') NOT NULL DEFAULT 'DRAFT',
  `reviewNotes`        TEXT         NULL,
  `reviewedById`       VARCHAR(30)  NULL,
  `createdAt`          DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`          DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `EventReport_eventId_idx` (`eventId`),
  CONSTRAINT `fk_er_event` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- EventReportAttachment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `EventReportAttachment` (
  `id`            VARCHAR(30)  NOT NULL,
  `reportId`      VARCHAR(30)  NOT NULL,
  `fileName`      VARCHAR(255) NOT NULL,
  `fileUrl`       TEXT         NOT NULL,
  `fileSizeBytes` INT          NOT NULL,
  `uploadedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_era_report` FOREIGN KEY (`reportId`) REFERENCES `EventReport`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MediaRequest
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `MediaRequest` (
  `id`            VARCHAR(30)  NOT NULL,
  `eventId`       VARCHAR(30)  NOT NULL,
  `requestedById` VARCHAR(30)  NOT NULL,
  `recordingType` VARCHAR(100) NOT NULL,
  `requestedDate` DATETIME(3)  NOT NULL,
  `status`        ENUM('PENDING','ACCEPTED','DECLINED') NOT NULL DEFAULT 'PENDING',
  `declineReason` TEXT         NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `MediaRequest_eventId_idx` (`eventId`),
  INDEX `MediaRequest_status_idx` (`status`),
  CONSTRAINT `fk_mr_event`     FOREIGN KEY (`eventId`)       REFERENCES `Event`(`id`),
  CONSTRAINT `fk_mr_requester` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Recording
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Recording` (
  `id`              VARCHAR(30)  NOT NULL,
  `title`           VARCHAR(255) NOT NULL,
  `eventId`         VARCHAR(30)  NULL,
  `mediaRequestId`  VARCHAR(30)  NULL,
  `recordingDate`   DATETIME(3)  NOT NULL,
  `durationSeconds` INT          NOT NULL,
  `format`          VARCHAR(50)  NOT NULL,
  `status`          ENUM('CAPTURED','IN_EDITING','EDITED','APPROVED','PUBLISHED') NOT NULL DEFAULT 'CAPTURED',
  `editingProgress` INT          NOT NULL DEFAULT 0,
  `editorId`        VARCHAR(30)  NULL,
  `createdById`     VARCHAR(30)  NOT NULL,
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Recording_mediaRequestId_key` (`mediaRequestId`),
  INDEX `Recording_status_idx` (`status`),
  INDEX `Recording_eventId_idx` (`eventId`),
  CONSTRAINT `fk_rec_event`      FOREIGN KEY (`eventId`)        REFERENCES `Event`(`id`),
  CONSTRAINT `fk_rec_request`    FOREIGN KEY (`mediaRequestId`) REFERENCES `MediaRequest`(`id`),
  CONSTRAINT `fk_rec_editor`     FOREIGN KEY (`editorId`)       REFERENCES `User`(`id`),
  CONSTRAINT `fk_rec_creator`    FOREIGN KEY (`createdById`)    REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- MediaAsset
-- note: tags stored as JSON array (MySQL 8 supports JSON natively)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `MediaAsset` (
  `id`            VARCHAR(30)   NOT NULL,
  `title`         VARCHAR(255)  NOT NULL,
  `fileUrl`       TEXT          NOT NULL,
  `fileType`      VARCHAR(100)  NOT NULL,
  `fileSizeBytes` BIGINT        NOT NULL,
  `category`      VARCHAR(100)  NOT NULL,
  `tags`          JSON          NOT NULL,
  `thumbnailUrl`  TEXT          NULL,
  `recordingId`   VARCHAR(30)   NULL,
  `uploadedById`  VARCHAR(30)   NOT NULL,
  `createdAt`     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)   NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `MediaAsset_category_idx` (`category`),
  INDEX `MediaAsset_createdAt_idx` (`createdAt`),
  CONSTRAINT `fk_ma_recording` FOREIGN KEY (`recordingId`) REFERENCES `Recording`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ContentApproval
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ContentApproval` (
  `id`              VARCHAR(30) NOT NULL,
  `recordingId`     VARCHAR(30) NOT NULL,
  `approverId`      VARCHAR(30) NOT NULL,
  `decision`        TINYINT(1)  NOT NULL,
  `notes`           TEXT        NULL,
  `rejectionReason` TEXT        NULL,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ContentApproval_recordingId_idx` (`recordingId`),
  CONSTRAINT `fk_ca_recording` FOREIGN KEY (`recordingId`) REFERENCES `Recording`(`id`),
  CONSTRAINT `fk_ca_approver`  FOREIGN KEY (`approverId`)  REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Platform
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Platform` (
  `id`             VARCHAR(30)  NOT NULL,
  `name`           VARCHAR(255) NOT NULL,
  `type`           ENUM('VIDEO','AUDIO','WEBSITE','SOCIAL_MEDIA','OTHER') NOT NULL,
  `url`            TEXT         NOT NULL,
  `apiCredentials` TEXT         NULL,
  `isActive`       TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Platform_type_idx` (`type`),
  INDEX `Platform_isActive_idx` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PublishingQueue
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PublishingQueue` (
  `id`            VARCHAR(30) NOT NULL,
  `recordingId`   VARCHAR(30) NOT NULL,
  `priority`      INT         NOT NULL DEFAULT 50,
  `scheduledDate` DATETIME(3) NULL,
  `publishedAt`   DATETIME(3) NULL,
  `publishedById` VARCHAR(30) NULL,
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PublishingQueue_recordingId_key` (`recordingId`),
  INDEX `PublishingQueue_priority_idx` (`priority`),
  INDEX `PublishingQueue_scheduledDate_idx` (`scheduledDate`),
  CONSTRAINT `fk_pq_recording`   FOREIGN KEY (`recordingId`)   REFERENCES `Recording`(`id`),
  CONSTRAINT `fk_pq_publisher`   FOREIGN KEY (`publishedById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PublishingQueuePlatform  (junction)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PublishingQueuePlatform` (
  `id`          VARCHAR(30) NOT NULL,
  `queueId`     VARCHAR(30) NOT NULL,
  `platformId`  VARCHAR(30) NOT NULL,
  `publishedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `PQP_queueId_platformId_key` (`queueId`, `platformId`),
  CONSTRAINT `fk_pqp_queue`    FOREIGN KEY (`queueId`)    REFERENCES `PublishingQueue`(`id`),
  CONSTRAINT `fk_pqp_platform` FOREIGN KEY (`platformId`) REFERENCES `Platform`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- SupportTicket
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `SupportTicket` (
  `id`          VARCHAR(30)  NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `description` TEXT         NOT NULL,
  `priority`    ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
  `category`    ENUM('HARDWARE','SOFTWARE','NETWORK','ACCESS','OTHER') NOT NULL,
  `status`      ENUM('OPEN','IN_PROGRESS','WAITING','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
  `createdById` VARCHAR(30)  NOT NULL,
  `assigneeId`  VARCHAR(30)  NULL,
  `resolvedAt`  DATETIME(3)  NULL,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `SupportTicket_status_idx` (`status`),
  INDEX `SupportTicket_priority_idx` (`priority`),
  INDEX `SupportTicket_assigneeId_idx` (`assigneeId`),
  CONSTRAINT `fk_st_creator`  FOREIGN KEY (`createdById`) REFERENCES `User`(`id`),
  CONSTRAINT `fk_st_assignee` FOREIGN KEY (`assigneeId`)  REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TicketComment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `TicketComment` (
  `id`        VARCHAR(30) NOT NULL,
  `ticketId`  VARCHAR(30) NOT NULL,
  `authorId`  VARCHAR(30) NOT NULL,
  `body`      TEXT        NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tcom_ticket` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`),
  CONSTRAINT `fk_tcom_author` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TicketAttachment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `TicketAttachment` (
  `id`            VARCHAR(30)  NOT NULL,
  `ticketId`      VARCHAR(30)  NOT NULL,
  `fileName`      VARCHAR(255) NOT NULL,
  `fileUrl`       TEXT         NOT NULL,
  `fileSizeBytes` INT          NOT NULL,
  `uploadedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_tattach_ticket` FOREIGN KEY (`ticketId`) REFERENCES `SupportTicket`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- StorageQuota
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `StorageQuota` (
  `id`         VARCHAR(30) NOT NULL,
  `department` ENUM('MEDIA','EVANGELISM','IT','HR_FINANCE') NOT NULL,
  `quotaBytes` BIGINT      NOT NULL,
  `usedBytes`  BIGINT      NOT NULL DEFAULT 0,
  `fileCount`  INT         NOT NULL DEFAULT 0,
  `setById`    VARCHAR(30) NOT NULL,
  `updatedAt`  DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `StorageQuota_department_key` (`department`),
  CONSTRAINT `fk_sq_setter` FOREIGN KEY (`setById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- StorageUsageSnapshot
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `StorageUsageSnapshot` (
  `id`           VARCHAR(30) NOT NULL,
  `department`   ENUM('MEDIA','EVANGELISM','IT','HR_FINANCE') NOT NULL,
  `usedBytes`    BIGINT      NOT NULL,
  `fileCount`    INT         NOT NULL,
  `snapshotDate` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `StorageUsageSnapshot_dept_date_idx` (`department`, `snapshotDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- AttendanceRecord
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `AttendanceRecord` (
  `id`                VARCHAR(30)   NOT NULL,
  `userId`            VARCHAR(30)   NOT NULL,
  `date`              DATE          NOT NULL,
  `checkIn`           DATETIME(3)   NULL,
  `checkOut`          DATETIME(3)   NULL,
  `totalHours`        DOUBLE        NULL,
  `justificationNote` TEXT          NULL,
  `manuallyEdited`    TINYINT(1)    NOT NULL DEFAULT 0,
  `createdAt`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)   NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AttendanceRecord_userId_date_key` (`userId`, `date`),
  INDEX `AttendanceRecord_userId_idx` (`userId`),
  INDEX `AttendanceRecord_date_idx` (`date`),
  CONSTRAINT `fk_ar_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- LeaveRequest
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `LeaveRequest` (
  `id`              VARCHAR(30)  NOT NULL,
  `userId`          VARCHAR(30)  NOT NULL,
  `leaveType`       ENUM('VACATION','SICK_LEAVE','PERSONAL_LEAVE','OTHER') NOT NULL,
  `startDate`       DATE         NOT NULL,
  `endDate`         DATE         NOT NULL,
  `reason`          TEXT         NOT NULL,
  `status`          ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `reviewedById`    VARCHAR(30)  NULL,
  `reviewerComment` TEXT         NULL,
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `LeaveRequest_userId_idx` (`userId`),
  INDEX `LeaveRequest_status_idx` (`status`),
  INDEX `LeaveRequest_dates_idx` (`startDate`, `endDate`),
  CONSTRAINT `fk_lr_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- ExpenseRequest
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ExpenseRequest` (
  `id`              VARCHAR(30)    NOT NULL,
  `userId`          VARCHAR(30)    NOT NULL,
  `description`     TEXT           NOT NULL,
  `amount`          DECIMAL(12, 2) NOT NULL,
  `category`        ENUM('TRAVEL','MEALS','EQUIPMENT','SUPPLIES','OTHER') NOT NULL,
  `expenseDate`     DATE           NOT NULL,
  `receiptUrl`      TEXT           NOT NULL,
  `status`          ENUM('PENDING','APPROVED','REJECTED','PAID','INFO_REQUESTED') NOT NULL DEFAULT 'PENDING',
  `reviewedById`    VARCHAR(30)    NULL,
  `reviewerComment` TEXT           NULL,
  `paidAt`          DATETIME(3)    NULL,
  `createdAt`       DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)    NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ExpenseRequest_userId_idx` (`userId`),
  INDEX `ExpenseRequest_status_idx` (`status`),
  INDEX `ExpenseRequest_category_idx` (`category`),
  CONSTRAINT `fk_exr_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- WeeklyReport
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `WeeklyReport` (
  `id`              VARCHAR(30) NOT NULL,
  `userId`          VARCHAR(30) NOT NULL,
  `weekStartDate`   DATE        NOT NULL,
  `workCompleted`   TEXT        NOT NULL,
  `challengesFaced` TEXT        NOT NULL,
  `nextWeekPlans`   TEXT        NOT NULL,
  `status`          ENUM('DRAFT','SUBMITTED','APPROVED','REVISION_REQUESTED') NOT NULL DEFAULT 'DRAFT',
  `reviewedById`    VARCHAR(30) NULL,
  `reviewComments`  TEXT        NULL,
  `submittedAt`     DATETIME(3) NULL,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `WeeklyReport_userId_weekStartDate_key` (`userId`, `weekStartDate`),
  INDEX `WeeklyReport_userId_idx` (`userId`),
  INDEX `WeeklyReport_status_idx` (`status`),
  INDEX `WeeklyReport_weekStartDate_idx` (`weekStartDate`),
  CONSTRAINT `fk_wr_user`     FOREIGN KEY (`userId`)       REFERENCES `User`(`id`),
  CONSTRAINT `fk_wr_reviewer` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- WeeklyReportAttachment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `WeeklyReportAttachment` (
  `id`            VARCHAR(30)  NOT NULL,
  `reportId`      VARCHAR(30)  NOT NULL,
  `fileName`      VARCHAR(255) NOT NULL,
  `fileUrl`       TEXT         NOT NULL,
  `fileSizeBytes` INT          NOT NULL,
  `uploadedAt`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_wra_report` FOREIGN KEY (`reportId`) REFERENCES `WeeklyReport`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PerformanceNote
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PerformanceNote` (
  `id`        VARCHAR(30) NOT NULL,
  `subjectId` VARCHAR(30) NOT NULL,
  `authorId`  VARCHAR(30) NOT NULL,
  `note`      TEXT        NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PerformanceNote_subjectId_idx` (`subjectId`),
  CONSTRAINT `fk_pn_subject` FOREIGN KEY (`subjectId`) REFERENCES `User`(`id`),
  CONSTRAINT `fk_pn_author`  FOREIGN KEY (`authorId`)  REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Notification
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `Notification` (
  `id`          VARCHAR(30)  NOT NULL,
  `userId`      VARCHAR(30)  NOT NULL,
  `type`        ENUM('TASK_ASSIGNED','TASK_DEADLINE','TASK_MENTION','TASK_STATUS',
                     'APPROVAL_REQUIRED','APPROVAL_RESULT','REPORT_DUE',
                     'REPORT_SUBMITTED','WORKFLOW_ALERT','SYSTEM') NOT NULL,
  `title`       VARCHAR(255) NOT NULL,
  `body`        TEXT         NOT NULL,
  `entityType`  VARCHAR(100) NULL,
  `entityId`    VARCHAR(30)  NULL,
  `isRead`      TINYINT(1)   NOT NULL DEFAULT 0,
  `isMandatory` TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Notification_userId_isRead_idx` (`userId`, `isRead`),
  INDEX `Notification_userId_createdAt_idx` (`userId`, `createdAt`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- NotificationPreference
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `NotificationPreference` (
  `id`               VARCHAR(30)  NOT NULL,
  `userId`           VARCHAR(30)  NOT NULL,
  `taskAssigned`     TINYINT(1)   NOT NULL DEFAULT 1,
  `taskDeadline`     TINYINT(1)   NOT NULL DEFAULT 1,
  `taskMention`      TINYINT(1)   NOT NULL DEFAULT 1,
  `approvalRequired` TINYINT(1)   NOT NULL DEFAULT 1,
  `approvalResult`   TINYINT(1)   NOT NULL DEFAULT 1,
  `reportDue`        TINYINT(1)   NOT NULL DEFAULT 1,
  `workflowAlerts`   TINYINT(1)   NOT NULL DEFAULT 1,
  `deliveryMethod`   ENUM('IN_APP','EMAIL','BOTH') NOT NULL DEFAULT 'IN_APP',
  `quietHoursStart`  VARCHAR(5)   NULL,
  `quietHoursEnd`    VARCHAR(5)   NULL,
  `updatedAt`        DATETIME(3)  NOT NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `NotificationPreference_userId_key` (`userId`),
  CONSTRAINT `fk_np_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- AuditLog
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `AuditLog` (
  `id`         VARCHAR(30)  NOT NULL,
  `userId`     VARCHAR(30)  NOT NULL,
  `action`     ENUM('LOGIN_SUCCESS','LOGIN_FAIL','LOGOUT','CREATE','UPDATE',
                    'DELETE','APPROVE','REJECT','PERMISSION_CHANGE') NOT NULL,
  `entityType` VARCHAR(100) NOT NULL,
  `entityId`   VARCHAR(30)  NULL,
  `details`    JSON         NULL,
  `ipAddress`  VARCHAR(45)  NULL,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `AuditLog_userId_idx` (`userId`),
  INDEX `AuditLog_action_idx` (`action`),
  INDEX `AuditLog_entityType_entityId_idx` (`entityType`, `entityId`),
  INDEX `AuditLog_createdAt_idx` (`createdAt`),
  CONSTRAINT `fk_al_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- SavedFilter
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `SavedFilter` (
  `id`            VARCHAR(30)  NOT NULL,
  `userId`        VARCHAR(30)  NOT NULL,
  `name`          VARCHAR(255) NOT NULL,
  `filterContext` VARCHAR(100) NOT NULL,
  `filterParams`  JSON         NOT NULL,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `SavedFilter_userId_context_idx` (`userId`, `filterContext`),
  CONSTRAINT `fk_sf_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- PasswordResetToken  (referenced in task 2.8)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `PasswordResetToken` (
  `id`        VARCHAR(30)  NOT NULL,
  `userId`    VARCHAR(30)  NOT NULL,
  `token`     VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME(3)  NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PasswordResetToken_token_key` (`token`),
  INDEX `PasswordResetToken_userId_idx` (`userId`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
