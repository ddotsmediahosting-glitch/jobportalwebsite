-- Company Reviews
CREATE TABLE IF NOT EXISTS "CompanyReview" (
    "id"               TEXT NOT NULL,
    "employerId"       TEXT NOT NULL,
    "reviewerId"       TEXT NOT NULL,
    "title"            TEXT NOT NULL,
    "pros"             TEXT NOT NULL,
    "cons"             TEXT NOT NULL,
    "rating"           INTEGER NOT NULL,
    "workLifeBalance"  INTEGER NOT NULL,
    "salaryBenefits"   INTEGER NOT NULL,
    "management"       INTEGER NOT NULL,
    "careerGrowth"     INTEGER NOT NULL,
    "jobTitle"         TEXT,
    "employmentStatus" TEXT NOT NULL DEFAULT 'CURRENT',
    "isAnonymous"      BOOLEAN NOT NULL DEFAULT true,
    "isVerified"       BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount"     INTEGER NOT NULL DEFAULT 0,
    "status"           TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CompanyReview_employerId_reviewerId_key"
    ON "CompanyReview"("employerId","reviewerId");
CREATE INDEX IF NOT EXISTS "CompanyReview_employerId_idx" ON "CompanyReview"("employerId");
CREATE INDEX IF NOT EXISTS "CompanyReview_status_idx" ON "CompanyReview"("status");
CREATE INDEX IF NOT EXISTS "CompanyReview_rating_idx" ON "CompanyReview"("rating");

ALTER TABLE "CompanyReview"
    ADD CONSTRAINT "CompanyReview_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CompanyReview"
    ADD CONSTRAINT "CompanyReview_reviewerId_fkey"
    FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Salary Data
CREATE TABLE IF NOT EXISTS "SalaryData" (
    "id"            TEXT NOT NULL,
    "jobTitle"      TEXT NOT NULL,
    "industry"      TEXT,
    "emirate"       "Emirates",
    "experienceMin" INTEGER NOT NULL DEFAULT 0,
    "experienceMax" INTEGER,
    "salaryMin"     INTEGER NOT NULL,
    "salaryMax"     INTEGER NOT NULL,
    "currency"      TEXT NOT NULL DEFAULT 'AED',
    "source"        TEXT NOT NULL DEFAULT 'user',
    "userId"        TEXT,
    "isAnonymous"   BOOLEAN NOT NULL DEFAULT true,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryData_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SalaryData_jobTitle_idx" ON "SalaryData"("jobTitle");
CREATE INDEX IF NOT EXISTS "SalaryData_emirate_idx" ON "SalaryData"("emirate");
CREATE INDEX IF NOT EXISTS "SalaryData_industry_idx" ON "SalaryData"("industry");

-- Candidate Saves
CREATE TABLE IF NOT EXISTS "CandidateSave" (
    "id"         TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "seekerId"   TEXT NOT NULL,
    "notes"      TEXT,
    "tags"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateSave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CandidateSave_employerId_seekerId_key"
    ON "CandidateSave"("employerId","seekerId");
CREATE INDEX IF NOT EXISTS "CandidateSave_employerId_idx" ON "CandidateSave"("employerId");

ALTER TABLE "CandidateSave"
    ADD CONSTRAINT "CandidateSave_employerId_fkey"
    FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CandidateSave"
    ADD CONSTRAINT "CandidateSave_seekerId_fkey"
    FOREIGN KEY ("seekerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Interview Slots
CREATE TABLE IF NOT EXISTS "InterviewSlot" (
    "id"            TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt"   TIMESTAMP(3) NOT NULL,
    "durationMins"  INTEGER NOT NULL DEFAULT 60,
    "type"          TEXT NOT NULL DEFAULT 'VIDEO',
    "meetingLink"   TEXT,
    "location"      TEXT,
    "notes"         TEXT,
    "status"        TEXT NOT NULL DEFAULT 'PROPOSED',
    "proposedBy"    TEXT NOT NULL,
    "confirmedAt"   TIMESTAMP(3),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSlot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InterviewSlot_applicationId_idx" ON "InterviewSlot"("applicationId");
CREATE INDEX IF NOT EXISTS "InterviewSlot_scheduledAt_idx" ON "InterviewSlot"("scheduledAt");

ALTER TABLE "InterviewSlot"
    ADD CONSTRAINT "InterviewSlot_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
