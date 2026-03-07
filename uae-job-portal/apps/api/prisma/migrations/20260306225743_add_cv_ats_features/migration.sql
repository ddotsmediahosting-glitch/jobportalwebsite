-- CreateTable
CREATE TABLE "CVProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "targetRole" TEXT,
    "professionalSummary" TEXT,
    "skills" TEXT[],
    "languages" TEXT[],
    "cvDataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CVProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CVAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cvProfileId" TEXT,
    "jobTitle" TEXT,
    "companyName" TEXT,
    "jobDescription" TEXT,
    "cvText" TEXT NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "keywordMatchScore" INTEGER NOT NULL,
    "formatScore" INTEGER NOT NULL,
    "contentScore" INTEGER NOT NULL,
    "matchedKeywords" TEXT[],
    "missingKeywords" TEXT[],
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "suggestionsJson" JSONB,
    "summary" TEXT,
    "coverLetter" TEXT,
    "interviewQsJson" JSONB,
    "aiModel" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "analysisType" TEXT NOT NULL DEFAULT 'ats',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CVAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CVProfile_userId_key" ON "CVProfile"("userId");

-- CreateIndex
CREATE INDEX "CVProfile_userId_idx" ON "CVProfile"("userId");

-- CreateIndex
CREATE INDEX "CVAnalysis_userId_idx" ON "CVAnalysis"("userId");

-- CreateIndex
CREATE INDEX "CVAnalysis_createdAt_idx" ON "CVAnalysis"("createdAt");

-- AddForeignKey
ALTER TABLE "CVProfile" ADD CONSTRAINT "CVProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CVAnalysis" ADD CONSTRAINT "CVAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CVAnalysis" ADD CONSTRAINT "CVAnalysis_cvProfileId_fkey" FOREIGN KEY ("cvProfileId") REFERENCES "CVProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
