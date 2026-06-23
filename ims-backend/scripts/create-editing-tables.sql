-- Create Editing module tables if they don't exist

CREATE TABLE IF NOT EXISTS `EditingProject` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'PENDING',
  `deadline` DATETIME(3) NOT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `EditingProject_status_idx`(`status`),
  INDEX `EditingProject_deadline_idx`(`deadline`),
  CONSTRAINT `EditingProject_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EditingTask` (
  `id` VARCHAR(191) NOT NULL,
  `projectId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD') NOT NULL DEFAULT 'PENDING',
  `assigneeId` VARCHAR(191) NOT NULL,
  `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `deadline` DATETIME(3) NULL,
  `fileUrl` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `EditingTask_projectId_idx`(`projectId`),
  INDEX `EditingTask_assigneeId_idx`(`assigneeId`),
  INDEX `EditingTask_status_idx`(`status`),
  CONSTRAINT `EditingTask_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `EditingProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `EditingTask_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EditingComment` (
  `id` VARCHAR(191) NOT NULL,
  `taskId` VARCHAR(191) NOT NULL,
  `authorId` VARCHAR(191) NOT NULL,
  `body` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `EditingComment_taskId_idx`(`taskId`),
  CONSTRAINT `EditingComment_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `EditingTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `EditingComment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
