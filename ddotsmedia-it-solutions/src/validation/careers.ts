import { z } from "zod";

export const careerApplicationSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().min(7),
  roleSlug: z.string().min(2),
  coverLetter: z.string().min(20),
  portfolioUrl: z.url().optional().or(z.literal("")),
  website: z.string().optional(),
  submittedAt: z.string().optional(),
});

export type CareerApplicationInput = z.infer<typeof careerApplicationSchema>;
