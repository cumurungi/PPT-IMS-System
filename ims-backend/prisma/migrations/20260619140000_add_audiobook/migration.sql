-- CreateTable: Audiobook (Evangelism-managed recordings)
CREATE TABLE IF NOT EXISTS `Audiobook` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `bookName` VARCHAR(191) NOT NULL,
  `chapters` VARCHAR(191) NULL,
  `reader` VARCHAR(191) NULL,
  `status` ENUM('PROOF_READING', 'READY', 'RECORDING', 'COMPLETED') NOT NULL DEFAULT 'PROOF_READING',
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `Audiobook_status_idx`(`status`),
  INDEX `Audiobook_bookName_idx`(`bookName`),
  CONSTRAINT `Audiobook_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
