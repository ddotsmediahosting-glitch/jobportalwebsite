import { z } from 'zod';

export const analyzeSchema = z.object({
  cvText: z.string().min(100, 'CV text must be at least 100 characters'),
  jobDescription: z.string().min(50, 'Job description must be at least 50 characters'),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  cvProfileId: z.string().optional(),
  generateCoverLetter: z.boolean().optional().default(false),
  generateInterviewQuestions: z.boolean().optional().default(false),
});

export const generateSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().optional(),
    linkedIn: z.string().optional(),
  }),
  targetRole: z.string().min(2),
  yearsOfExperience: z.number().min(0).max(50),
  skills: z.array(z.string()).min(1),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().optional(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string().optional(),
    endDate: z.string().optional(),
  })),
  jobDescription: z.string().optional(),
});

export const coverLetterSchema = z.object({
  cvText: z.string().min(100),
  jobDescription: z.string().min(50),
  jobTitle: z.string().min(2),
  companyName: z.string().min(2),
  candidateName: z.string().min(2),
});

export const skillsGapSchema = z.object({
  skills: z.array(z.string()).min(1),
  cvText: z.string().min(50),
  jobDescription: z.string().min(50),
});

export const optimizeSchema = z.object({
  section: z.enum(['summary', 'experience', 'skills', 'full']),
  content: z.string().min(20),
  jobDescription: z.string().min(50),
});

export const interviewQsSchema = z.object({
  cvText: z.string().min(100),
  jobDescription: z.string().min(50),
  jobTitle: z.string().min(2),
});

export const saveCVProfileSchema = z.object({
  title: z.string().optional(),
  targetRole: z.string().optional(),
  professionalSummary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  cvDataJson: z.record(z.unknown()).optional(),
});
