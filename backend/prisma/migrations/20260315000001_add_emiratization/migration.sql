-- Add Emiratization flag to Job table
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "isEmiratization" BOOLEAN NOT NULL DEFAULT false;

-- Index for filtering Emiratization jobs
CREATE INDEX IF NOT EXISTS "Job_isEmiratization_idx" ON "Job"("isEmiratization");
