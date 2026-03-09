import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().min(2),
  sessionId: z.string().min(2),
});

export const aiLeadQualificationSchema = z.object({
  fullName: z.string().min(2),
  email: z.email(),
  message: z.string().min(10),
  serviceInterest: z.string().min(2),
});
