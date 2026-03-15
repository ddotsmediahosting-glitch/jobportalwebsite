import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../../config';
import {
  getGoogleAuthUrl, exchangeGoogleCode,
  getLinkedInAuthUrl, exchangeLinkedInCode,
  getFacebookAuthUrl, exchangeFacebookCode,
  handleSocialLogin,
} from './social.service';

const router = Router();

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://ddotsmediajobs.com').split(',')[0].trim();

function generateState(role: string): string {
  const nonce = crypto.randomBytes(16).toString('hex');
  return Buffer.from(JSON.stringify({ nonce, role })).toString('base64url');
}

function parseState(state: string): { nonce: string; role: string } | null {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

function redirectWithTokens(res: Response, accessToken: string, refreshToken: string, role: string) {
  const dest = new URL('/social-callback', FRONTEND_URL);
  dest.hash = `access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}&role=${role}`;
  res.redirect(dest.toString());
}

function redirectWithError(res: Response, message: string) {
  const dest = new URL('/login', FRONTEND_URL);
  dest.searchParams.set('error', message);
  res.redirect(dest.toString());
}

// ── Google ────────────────────────────────────────────────────────────────────

router.get('/google', (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'SEEKER';
  const state = generateState(role);
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600_000, sameSite: 'lax' });
  getGoogleAuthUrl(state).then((url) => res.redirect(url));
});

router.get('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return redirectWithError(res, 'Missing OAuth parameters');

    const cookieState = req.cookies?.oauth_state;
    if (!cookieState || cookieState !== state) return redirectWithError(res, 'Invalid OAuth state (CSRF check failed)');

    const parsed = parseState(state);
    if (!parsed) return redirectWithError(res, 'Invalid OAuth state');

    const profile = await exchangeGoogleCode(code);
    const role = (parsed.role === 'EMPLOYER' ? 'EMPLOYER' : 'SEEKER') as 'SEEKER' | 'EMPLOYER';
    const { accessToken, refreshToken, role: userRole } = await handleSocialLogin('google', profile, role);

    res.clearCookie('oauth_state');
    redirectWithTokens(res, accessToken, refreshToken, userRole);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Google login failed';
    redirectWithError(res, message);
  }
});

// ── LinkedIn ──────────────────────────────────────────────────────────────────

router.get('/linkedin', (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'SEEKER';
  const state = generateState(role);
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600_000, sameSite: 'lax' });
  getLinkedInAuthUrl(state).then((url) => res.redirect(url));
});

router.get('/linkedin/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return redirectWithError(res, 'Missing OAuth parameters');

    const cookieState = req.cookies?.oauth_state;
    if (!cookieState || cookieState !== state) return redirectWithError(res, 'Invalid OAuth state (CSRF check failed)');

    const parsed = parseState(state);
    if (!parsed) return redirectWithError(res, 'Invalid OAuth state');

    const profile = await exchangeLinkedInCode(code);
    const role = (parsed.role === 'EMPLOYER' ? 'EMPLOYER' : 'SEEKER') as 'SEEKER' | 'EMPLOYER';
    const { accessToken, refreshToken, role: userRole } = await handleSocialLogin('linkedin', profile, role);

    res.clearCookie('oauth_state');
    redirectWithTokens(res, accessToken, refreshToken, userRole);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LinkedIn login failed';
    redirectWithError(res, message);
  }
});

// ── Facebook ──────────────────────────────────────────────────────────────────

router.get('/facebook', (req: Request, res: Response) => {
  const role = (req.query.role as string) || 'SEEKER';
  const state = generateState(role);
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 600_000, sameSite: 'lax' });
  getFacebookAuthUrl(state).then((url) => res.redirect(url));
});

router.get('/facebook/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    if (!code || !state) return redirectWithError(res, 'Missing OAuth parameters');

    const cookieState = req.cookies?.oauth_state;
    if (!cookieState || cookieState !== state) return redirectWithError(res, 'Invalid OAuth state (CSRF check failed)');

    const parsed = parseState(state);
    if (!parsed) return redirectWithError(res, 'Invalid OAuth state');

    const profile = await exchangeFacebookCode(code);
    const role = (parsed.role === 'EMPLOYER' ? 'EMPLOYER' : 'SEEKER') as 'SEEKER' | 'EMPLOYER';
    const { accessToken, refreshToken, role: userRole } = await handleSocialLogin('facebook', profile, role);

    res.clearCookie('oauth_state');
    redirectWithTokens(res, accessToken, refreshToken, userRole);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Facebook login failed';
    redirectWithError(res, message);
  }
});

export default router;
