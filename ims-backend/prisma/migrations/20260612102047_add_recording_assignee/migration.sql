-- AlterTable
ALTER TABLE `Recording` ADD COLUMN `recordingAssigneeId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Recording_recordingAssigneeId_idx` ON `Recording`(`recordingAssigneeId`);

-- AddForeignKey
ALTER TABLE `Recording` ADD CONSTRAINT `Recording_recordingAssigneeId_fkey` FOREIGN KEY (`recordingAssigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
