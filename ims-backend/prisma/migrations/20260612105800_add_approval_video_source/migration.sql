-- AlterTable
ALTER TABLE `Recording` ADD COLUMN `approvalVideoSource` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Recording_approvalVideoSource_idx` ON `Recording`(`approvalVideoSource`);
