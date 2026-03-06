import { z } from 'zod';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@uaejobs/shared';

export { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
