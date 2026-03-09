import { z } from "zod";

export const consultationSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  phone: z.string().min(7),
  company: z.string().min(2),
  projectScope: z.string().min(20),
  preferredTimeline: z.string().min(2),
  website: z.string().optional(),
  submittedAt: z.string().optional(),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;
