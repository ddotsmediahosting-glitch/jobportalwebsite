import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["JOB_SEEKER", "EMPLOYER"]),
  phone: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  otp: z.string().optional()
});

export const createCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

export const createJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),
  categoryId: z.string().uuid(),
  emirate: z.enum([
    "Abu Dhabi",
    "Dubai",
    "Sharjah",
    "Ajman",
    "Umm Al Quwain",
    "Ras Al Khaimah",
    "Fujairah"
  ]),
  locationText: z.string().min(2),
  salaryMin: z.number().int().nonnegative(),
  salaryMax: z.number().int().nonnegative(),
  currency: z.string().default("AED"),
  negotiable: z.boolean().default(false),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE"]),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY", "INTERNSHIP", "FREELANCE"]),
  visa: z.enum(["VISA_PROVIDED", "TRANSFER_AVAILABLE", "NOT_PROVIDED", "NOT_REQUIRED"]),
  experienceMin: z.number().int().min(0),
  experienceMax: z.number().int().min(0),
  immediateJoiner: z.boolean().default(false),
  languageRequirements: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  screeningQuestions: z
    .array(
      z.object({
        question: z.string().min(5),
        type: z.enum(["TEXT", "YES_NO", "MULTIPLE_CHOICE"]),
        options: z.array(z.string()).optional()
      })
    )
    .default([])
});

export const applyJobSchema = z.object({
  cvId: z.string().uuid().optional(),
  coverLetter: z.string().max(2000).optional(),
  answers: z.record(z.string(), z.any()).default({})
});
