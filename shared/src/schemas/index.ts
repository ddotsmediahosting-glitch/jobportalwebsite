import { z } from 'zod';

// ─── Auth schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
    role: z.enum(['SEEKER', 'EMPLOYER']).default('SEEKER'),
    firstName: z.string().min(2, 'First name too short').optional(),
    lastName: z.string().min(2, 'Last name too short').optional(),
    companyName: z.string().min(2, 'Company name too short').optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ─── Job schemas ───────────────────────────────────────────────────────────────

export const emirateEnum = z.enum([
  'ABU_DHABI',
  'DUBAI',
  'SHARJAH',
  'AJMAN',
  'UMM_AL_QUWAIN',
  'RAS_AL_KHAIMAH',
  'FUJAIRAH',
]);

export const workModeEnum = z.enum(['ONSITE', 'HYBRID', 'REMOTE']);
export const employmentTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
  'FREELANCE',
]);
export const visaStatusEnum = z.enum([
  'PROVIDED',
  'TRANSFER_AVAILABLE',
  'NOT_PROVIDED',
  'NOT_REQUIRED',
]);

export const createJobSchema = z.object({
  title: z.string().min(5, 'Title too short').max(120),
  description: z.string().min(50, 'Description too short').max(10000),
  requirements: z.string().max(5000).optional(),
  benefits: z.string().max(3000).optional(),
  categoryId: z.string().cuid(),
  emirate: emirateEnum,
  location: z.string().max(200).optional(),
  workMode: workModeEnum.default('ONSITE'),
  employmentType: employmentTypeEnum.default('FULL_TIME'),
  visaStatus: visaStatusEnum.default('NOT_PROVIDED'),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  salaryCurrency: z.string().default('AED'),
  salaryNegotiable: z.boolean().default(false),
  experienceMin: z.number().int().min(0).default(0),
  experienceMax: z.number().int().positive().optional(),
  level: z.string().optional(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  screeningQuestions: z
    .array(
      z.object({
        question: z.string().min(5),
        type: z.enum(['TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'YES_NO']),
        options: z.array(z.string()).default([]),
        required: z.boolean().default(false),
        sortOrder: z.number().int().default(0),
      })
    )
    .default([]),
});

export const updateJobSchema = createJobSchema.partial();

export const jobFiltersSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  emirate: emirateEnum.optional(),
  workMode: workModeEnum.optional(),
  employmentType: employmentTypeEnum.optional(),
  visaStatus: visaStatusEnum.optional(),
  salaryMin: z.coerce.number().optional(),
  salaryMax: z.coerce.number().optional(),
  experienceMin: z.coerce.number().optional(),
  level: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  sortBy: z.enum(['publishedAt', 'salaryMin', 'relevance']).default('publishedAt'),
});

// ─── Seeker profile schema ─────────────────────────────────────────────────────

export const seekerProfileSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().min(2).max(60),
  headline: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  emirate: emirateEnum.optional(),
  location: z.string().max(200).optional(),
  nationality: z.string().max(100).optional(),
  desiredRole: z.string().max(120).optional(),
  desiredSalaryMin: z.number().int().positive().optional(),
  desiredSalaryMax: z.number().int().positive().optional(),
  desiredWorkModes: z.array(workModeEnum).default([]),
  yearsOfExperience: z.number().int().min(0).optional(),
  noticePeriod: z.string().max(50).optional(),
  immediateJoiner: z.boolean().default(false),
  languages: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  linkedInUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  isProfilePublic: z.boolean().default(true),
});

// ─── Employer profile schema ───────────────────────────────────────────────────

export const employerProfileSchema = z.object({
  companyName: z.string().min(2).max(120),
  industry: z.string().max(100).optional(),
  companySize: z.string().optional(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  description: z.string().max(5000).optional(),
  website: z.string().url().optional().or(z.literal('')),
  emirate: emirateEnum.optional(),
  location: z.string().max(200).optional(),
  tradeLicenseNumber: z.string().max(100).optional(),
});

// ─── Application schema ────────────────────────────────────────────────────────

export const applyJobSchema = z.object({
  resumeId: z.string().cuid().optional(),
  coverLetter: z.string().max(3000).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        answer: z.union([z.string(), z.array(z.string())]),
      })
    )
    .default([]),
});

// ─── Category schema ───────────────────────────────────────────────────────────

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  parentId: z.string().cuid().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  iconUrl: z.string().url().optional().or(z.literal('')),
});

// ─── Pagination helper ─────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
export type SeekerProfileInput = z.infer<typeof seekerProfileSchema>;
export type EmployerProfileInput = z.infer<typeof employerProfileSchema>;
export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
