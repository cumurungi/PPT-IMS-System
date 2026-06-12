-- AlterTable
ALTER TABLE `Recording` ADD COLUMN `editedVideoUrl` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Recording_editedVideoUrl_idx` ON `Recording`(`editedVideoUrl`);
