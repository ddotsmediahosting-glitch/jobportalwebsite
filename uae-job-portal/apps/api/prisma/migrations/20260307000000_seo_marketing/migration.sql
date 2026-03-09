-- AlterTable: Add SEO fields to Job
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "metaTitle" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "metaDescription" TEXT;

-- CreateTable: SocialShareClick
CREATE TABLE IF NOT EXISTS "SocialShareClick" (
    "id" TEXT NOT NULL,
    "jobId" TEXT,
    "platform" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialShareClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SocialShareClick_jobId_idx" ON "SocialShareClick"("jobId");
CREATE INDEX IF NOT EXISTS "SocialShareClick_platform_idx" ON "SocialShareClick"("platform");
CREATE INDEX IF NOT EXISTS "SocialShareClick_createdAt_idx" ON "SocialShareClick"("createdAt");

-- AddForeignKey (with SET NULL on delete so job deletion doesn't break analytics)
ALTER TABLE "SocialShareClick"
    ADD CONSTRAINT "SocialShareClick_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
