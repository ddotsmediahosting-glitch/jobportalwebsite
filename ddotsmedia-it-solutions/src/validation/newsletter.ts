import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.email(),
  source: z.string().min(2).default("website"),
  website: z.string().optional(),
  submittedAt: z.string().optional(),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
