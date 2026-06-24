-- Drop and recreate Audiobook table with proper structure
DROP TABLE IF EXISTS `Audiobook`;

CREATE TABLE `Audiobook` (
  `id` VARCHAR(191) NOT NULL,
  `bookName` VARCHAR(191) NOT NULL,
  `reader` VARCHAR(191) NOT NULL,
  `chapters` TEXT NOT NULL,
  `fileUrl` VARCHAR(500) NULL,
  `approved` TINYINT(1) NOT NULL DEFAULT 0,
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Audiobook_createdById_idx`(`createdById`),
  CONSTRAINT `Audiobook_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
