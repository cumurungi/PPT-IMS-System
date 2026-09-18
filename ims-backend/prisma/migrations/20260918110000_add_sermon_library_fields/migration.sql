ALTER TABLE "Recording" ADD COLUMN "series" TEXT;
ALTER TABLE "Recording" ADD COLUMN "preacher" TEXT;
ALTER TABLE "Recording" ADD COLUMN "language" TEXT;
ALTER TABLE "Recording" ADD COLUMN "cameraman" TEXT;
ALTER TABLE "Recording" ADD COLUMN "shootingStorage" TEXT;
ALTER TABLE "Recording" ADD COLUMN "reviser" TEXT;
ALTER TABLE "Recording" ADD COLUMN "youtubeUrl" TEXT;
ALTER TABLE "Recording" ADD COLUMN "cloudUrl" TEXT;
ALTER TABLE "Recording" ADD COLUMN "appUrl" TEXT;
ALTER TABLE "Recording" ADD COLUMN "websiteUrl" TEXT;

CREATE INDEX "Recording_preacher_idx" ON "Recording"("preacher");
CREATE INDEX "Recording_cameraman_idx" ON "Recording"("cameraman");
CREATE INDEX "Recording_language_idx" ON "Recording"("language");
