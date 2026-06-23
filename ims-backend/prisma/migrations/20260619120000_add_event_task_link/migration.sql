-- AlterTable: Add sourceTaskId and description to Event
ALTER TABLE `Event` ADD COLUMN `sourceTaskId` VARCHAR(191) NULL;
ALTER TABLE `Event` ADD COLUMN `description` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Event_sourceTaskId_idx` ON `Event`(`sourceTaskId`);

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_sourceTaskId_fkey` FOREIGN KEY (`sourceTaskId`) REFERENCES `Task`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
