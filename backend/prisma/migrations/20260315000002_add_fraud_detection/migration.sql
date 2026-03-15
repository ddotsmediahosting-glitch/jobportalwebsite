-- Add fraud detection fields to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fraudRiskScore" INTEGER;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fraudRiskLevel" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fraudFlags" JSONB;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fraudExplanation" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "fraudCheckedAt" TIMESTAMP(3);

-- Index for filtering by fraud risk
CREATE INDEX IF NOT EXISTS "Job_fraudRiskLevel_idx" ON "Job"("fraudRiskLevel");
