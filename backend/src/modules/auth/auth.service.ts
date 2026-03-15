import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../lib/prisma';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generateOtp,
  generateResetToken,
} from '../../lib/jwt';
import { emailQueue } from '../../lib/queue';
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  checkSmtpAvailable,
} from '../../lib/email';
import { config } from '../../config';
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../middleware/errorHandler';
import { UserRole, UserStatus } from '@prisma/client';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export class AuthService {
  async register(
    email: string,
    password: string,
    role: 'SEEKER' | 'EMPLOYER',
    firstName?: string,
    lastName?: string,
    companyName?: string
  ) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    // Skip email verification when SMTP is not configured or not reachable
    const smtpConfigured = await checkSmtpAvailable();
    const otp = smtpConfigured ? generateOtp() : null;
    const otpExpiry = smtpConfigured ? new Date(Date.now() + OTP_TTL_MS) : null;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role as UserRole,
        status: smtpConfigured ? UserStatus.PENDING_VERIFICATION : UserStatus.ACTIVE,
        emailOtp: otp,
        emailOtpExpiry: otpExpiry,
        verifiedAt: smtpConfigured ? null : new Date(),
      },
    });

    // Create seeker profile
    if (role === 'SEEKER' && firstName && lastName) {
      await prisma.jobSeekerProfile.create({
        data: { userId: user.id, firstName, lastName },
      });
    }

    // Create employer shell
    if (role === 'EMPLOYER' && companyName) {
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      const employer = await prisma.employer.create({
        data: {
          ownerUserId: user.id,
          companyName,
          slug: uniqueSlug,
          subscription: {
            create: { plan: 'FREE', jobPostsLimit: 3 },
          },
        },
      });

      await prisma.employerMember.create({
        data: { employerId: employer.id, userId: user.id, role: 'OWNER', joinedAt: new Date() },
      });
    }

    // Send verification email (skipped when SMTP is not configured)
    if (smtpConfigured) {
      await emailQueue.add('send-verification', {
        to: email,
        subject: 'Verify your UAE Jobs Portal account',
        html: emailVerificationTemplate(firstName || email, otp!),
      });
    }

    return { id: user.id, email: user.email, role: user.role, verified: !smtpConfigured };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');

    if (!user.passwordHash) throw new UnauthorizedError('This account uses social login. Please sign in with Google, LinkedIn, or Facebook.');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    if (user.status === UserStatus.BANNED) throw new AppError(403, 'Account banned');
    if (user.status === UserStatus.SUSPENDED) throw new AppError(403, 'Account suspended');

    const payload = { sub: user.id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        verifiedAt: user.verifiedAt,
      },
    };
  }

  async refresh(token: string) {
    const payload = verifyRefreshToken(token);

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token invalid or expired');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === UserStatus.BANNED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedError('Account is not active');
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });

    const newPayload = { sub: user.id, role: user.role, email: user.email };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async verifyEmail(email: string, otp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError('User');

    if (user.emailOtp !== otp) throw new AppError(400, 'Invalid OTP');
    if (!user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
      throw new AppError(400, 'OTP has expired');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailOtp: null,
        emailOtpExpiry: null,
        verifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError('User');
    if (user.verifiedAt) throw new AppError(400, 'Email already verified');

    const otp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailOtp: otp, emailOtpExpiry: new Date(Date.now() + OTP_TTL_MS) },
    });

    await emailQueue.add('resend-verification', {
      to: email,
      subject: 'Your new verification code',
      html: emailVerificationTemplate(email, otp),
    });

    return { message: 'Verification email sent' };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always return success to prevent user enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent' };

    const token = generateResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const resetUrl = `${config.cors.frontendUrl}/reset-password?token=${token}`;

    await emailQueue.add('forgot-password', {
      to: email,
      subject: 'Reset your UAE Jobs Portal password',
      html: passwordResetTemplate(email, resetUrl),
    });

    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) throw new AppError(400, 'Reset token is invalid or expired');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    if (!user.passwordHash) throw new AppError(400, 'This account uses social login and has no password.');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(400, 'Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    await prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Password changed successfully' };
  }
}
