import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  company: z.string().min(2),
  serviceInterest: z.string().min(2),
  message: z.string().min(20),
  website: z.string().optional(),
  submittedAt: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
