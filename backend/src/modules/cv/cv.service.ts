// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
import mammoth from 'mammoth';
import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma';
import {
  analyzeCV,
  generateCVContent,
  generateCoverLetter,
  analyzeSkillsGap,
  optimizeCVSection,
  generateInterviewQuestions,
  CVGenerationInput,
} from '../../lib/ai';
import { z } from 'zod';
import {
  analyzeSchema,
  generateSchema,
  coverLetterSchema,
  skillsGapSchema,
  optimizeSchema,
  interviewQsSchema,
  saveCVProfileSchema,
} from './cv.schema';

// ─── File parsing ─────────────────────────────────────────────────────────────

export async function parseFileToText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  // Plain text
  return buffer.toString('utf-8');
}

// ─── ATS Analysis ─────────────────────────────────────────────────────────────

export async function runATSAnalysis(
  userId: string,
  data: z.infer<typeof analyzeSchema>
) {
  const aiResult = await analyzeCV(data.cvText, data.jobDescription, data.jobTitle);

  let coverLetter: string | undefined;
  if (data.generateCoverLetter && data.jobTitle && data.companyName) {
    coverLetter = await generateCoverLetter(
      data.cvText,
      data.jobDescription,
      data.jobTitle,
      data.companyName,
      'Candidate'
    );
  }

  let interviewQs = undefined;
  if (data.generateInterviewQuestions && data.jobTitle) {
    interviewQs = await generateInterviewQuestions(data.cvText, data.jobDescription, data.jobTitle);
  }

  const analysis = await prisma.cVAnalysis.create({
    data: {
      userId,
      cvProfileId: data.cvProfileId,
      jobTitle: data.jobTitle,
      companyName: data.companyName,
      jobDescription: data.jobDescription,
      cvText: data.cvText,
      atsScore: aiResult.atsScore,
      keywordMatchScore: aiResult.keywordMatchScore,
      formatScore: aiResult.formatScore,
      contentScore: aiResult.contentScore,
      matchedKeywords: aiResult.matchedKeywords,
      missingKeywords: aiResult.missingKeywords,
      strengths: aiResult.strengths,
      weaknesses: aiResult.weaknesses,
      suggestionsJson: aiResult.suggestions as object[],
      summary: aiResult.summary,
      coverLetter,
      interviewQsJson: interviewQs ? (interviewQs as object[]) : undefined,
      analysisType: 'ats',
    },
  });

  return analysis;
}

// ─── CV Generation ────────────────────────────────────────────────────────────

export async function runCVGeneration(data: z.infer<typeof generateSchema>) {
  return generateCVContent(data as CVGenerationInput);
}

// ─── Cover Letter ─────────────────────────────────────────────────────────────

export async function runCoverLetterGeneration(data: z.infer<typeof coverLetterSchema>) {
  return generateCoverLetter(
    data.cvText,
    data.jobDescription,
    data.jobTitle,
    data.companyName,
    data.candidateName
  );
}

// ─── Skills Gap ───────────────────────────────────────────────────────────────

export async function runSkillsGapAnalysis(
  userId: string,
  data: z.infer<typeof skillsGapSchema>
) {
  const result = await analyzeSkillsGap(data.skills, data.cvText, data.jobDescription);

  await prisma.cVAnalysis.create({
    data: {
      userId,
      cvText: data.cvText,
      jobDescription: data.jobDescription,
      atsScore: result.fitPercentage,
      keywordMatchScore: result.fitPercentage,
      formatScore: 0,
      contentScore: 0,
      matchedKeywords: result.matchingSkills,
      missingKeywords: [...result.missingCriticalSkills, ...result.missingNiceToHaveSkills],
      strengths: result.matchingSkills.slice(0, 5),
      weaknesses: result.missingCriticalSkills.slice(0, 5),
      suggestionsJson: result.learningRecommendations as object[],
      summary: `Overall fit: ${result.overallFit} (${result.fitPercentage}%)`,
      analysisType: 'skills_gap',
    },
  });

  return result;
}

// ─── CV Optimization ──────────────────────────────────────────────────────────

export async function runCVOptimization(data: z.infer<typeof optimizeSchema>) {
  return optimizeCVSection(data.section, data.content, data.jobDescription);
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export async function runInterviewQuestions(data: z.infer<typeof interviewQsSchema>) {
  return generateInterviewQuestions(data.cvText, data.jobDescription, data.jobTitle);
}

// ─── CV Profile CRUD ──────────────────────────────────────────────────────────

export async function getCVProfile(userId: string) {
  return prisma.cVProfile.findUnique({ where: { userId } });
}

export async function saveCVProfile(userId: string, data: z.infer<typeof saveCVProfileSchema>) {
  const { cvDataJson, ...rest } = data;
  const jsonVal = cvDataJson ? (cvDataJson as Prisma.InputJsonValue) : undefined;
  return prisma.cVProfile.upsert({
    where: { userId },
    create: { userId, ...rest, cvDataJson: jsonVal },
    update: { ...rest, cvDataJson: jsonVal },
  });
}

export async function getAnalysisHistory(userId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.cVAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        jobTitle: true,
        companyName: true,
        atsScore: true,
        keywordMatchScore: true,
        analysisType: true,
        createdAt: true,
      },
    }),
    prisma.cVAnalysis.count({ where: { userId } }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getAnalysisById(id: string, userId: string) {
  return prisma.cVAnalysis.findFirst({ where: { id, userId } });
}

export async function deleteAnalysis(id: string, userId: string) {
  return prisma.cVAnalysis.deleteMany({ where: { id, userId } });
}
