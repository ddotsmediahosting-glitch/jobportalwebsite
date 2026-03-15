import prisma from '../../lib/prisma';
import { signAccessToken, signRefreshToken } from '../../lib/jwt';
import { UserRole, UserStatus } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler';
import slugify from 'slugify';
import { config } from '../../config';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface SocialProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

// ── Google ─────────────────────────────────────────────────────────────────────

export async function getGoogleAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: config.oauth.google.clientId,
    redirect_uri: config.oauth.google.callbackUrl,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string): Promise<SocialProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.oauth.google.clientId,
      client_secret: config.oauth.google.clientSecret,
      redirect_uri: config.oauth.google.callbackUrl,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) throw new AppError(400, 'Google token exchange failed');

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const u = await userRes.json() as { sub?: string; email?: string; name?: string; picture?: string };
  if (!u.sub || !u.email) throw new AppError(400, 'Could not get Google profile');

  return { id: u.sub, email: u.email, displayName: u.name, avatarUrl: u.picture };
}

// ── LinkedIn ───────────────────────────────────────────────────────────────────

export async function getLinkedInAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.oauth.linkedin.clientId,
    redirect_uri: config.oauth.linkedin.callbackUrl,
    scope: 'openid profile email',
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

export async function exchangeLinkedInCode(code: string): Promise<SocialProfile> {
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.oauth.linkedin.callbackUrl,
      client_id: config.oauth.linkedin.clientId,
      client_secret: config.oauth.linkedin.clientSecret,
    }),
  });
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) throw new AppError(400, 'LinkedIn token exchange failed');

  const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const u = await userRes.json() as { sub?: string; email?: string; name?: string; picture?: string };
  if (!u.sub || !u.email) throw new AppError(400, 'Could not get LinkedIn profile');

  return { id: u.sub, email: u.email, displayName: u.name, avatarUrl: u.picture };
}

// ── Facebook ───────────────────────────────────────────────────────────────────

export async function getFacebookAuthUrl(state: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: config.oauth.facebook.appId,
    redirect_uri: config.oauth.facebook.callbackUrl,
    scope: 'email,public_profile',
    state,
    response_type: 'code',
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export async function exchangeFacebookCode(code: string): Promise<SocialProfile> {
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    new URLSearchParams({
      client_id: config.oauth.facebook.appId,
      client_secret: config.oauth.facebook.appSecret,
      redirect_uri: config.oauth.facebook.callbackUrl,
      code,
    }),
  );
  const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };
  if (!tokenData.access_token) throw new AppError(400, 'Facebook token exchange failed');

  const userRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`,
  );
  const u = await userRes.json() as { id?: string; name?: string; email?: string; picture?: { data?: { url?: string } } };
  if (!u.id) throw new AppError(400, 'Could not get Facebook profile');
  if (!u.email) throw new AppError(400, 'Facebook did not provide an email address. Please use a different login method.');

  return {
    id: u.id,
    email: u.email,
    displayName: u.name,
    avatarUrl: u.picture?.data?.url,
  };
}

// ── Shared: create/link user and issue JWT ─────────────────────────────────────

export async function handleSocialLogin(
  provider: 'google' | 'linkedin' | 'facebook',
  profile: SocialProfile,
  role: 'SEEKER' | 'EMPLOYER' = 'SEEKER',
) {
  // 1. Find by socialProvider + socialId
  let user = await prisma.user.findFirst({
    where: { socialProvider: provider, socialId: profile.id },
  });

  // 2. Find by email — link social to existing account
  if (!user) {
    const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          socialProvider: provider,
          socialId: profile.id,
          avatarUrl: byEmail.avatarUrl || profile.avatarUrl,
        },
      });
    }
  }

  // 3. Create brand-new user
  if (!user) {
    const nameParts = (profile.displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    user = await prisma.user.create({
      data: {
        email: profile.email,
        passwordHash: null,
        socialProvider: provider,
        socialId: profile.id,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        role: role as UserRole,
        status: UserStatus.ACTIVE,
        verifiedAt: new Date(),
      },
    });

    if (role === 'SEEKER') {
      await prisma.jobSeekerProfile.create({
        data: { userId: user.id, firstName, lastName },
      });
    }

    if (role === 'EMPLOYER') {
      const baseSlug = slugify(profile.displayName || `company-${user.id.slice(-6)}`, { lower: true, strict: true });
      const slug = `${baseSlug}-${user.id.slice(-4)}`;
      const employer = await prisma.employer.create({
        data: {
          ownerUserId: user.id,
          companyName: profile.displayName || 'My Company',
          slug,
          verificationStatus: 'PENDING',
          isActive: true,
        },
      });
      await prisma.subscription.create({
        data: {
          employerId: employer.id,
          plan: 'FREE',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  if (user.status === UserStatus.BANNED) throw new AppError(403, 'Account banned');
  if (user.status === UserStatus.SUSPENDED) throw new AppError(403, 'Account suspended');

  const payload = { sub: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { accessToken, refreshToken, role: user.role };
}
