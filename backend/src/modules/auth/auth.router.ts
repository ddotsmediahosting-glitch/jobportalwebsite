import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.schema';

const router = Router();
const ctrl = new AuthController();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new user
 */
router.post('/register', authLimiter, validate(registerSchema), ctrl.register.bind(ctrl));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 */
router.post('/login', authLimiter, validate(loginSchema), ctrl.login.bind(ctrl));

router.post('/refresh', validate(refreshTokenSchema), ctrl.refresh.bind(ctrl));
router.post('/logout', ctrl.logout.bind(ctrl));
router.post('/verify-email', validate(verifyEmailSchema), ctrl.verifyEmail.bind(ctrl));
router.post('/resend-verification', authLimiter, validate(resendVerificationSchema), ctrl.resendVerification.bind(ctrl));
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword.bind(ctrl));
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword.bind(ctrl));
router.get('/me', authenticate, ctrl.me.bind(ctrl));
router.post('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword.bind(ctrl));

// Returns which social OAuth providers are configured on this server
router.get('/providers', (_req, res) => {
  res.json({
    google:   !!process.env.GOOGLE_CLIENT_ID,
    linkedin: !!process.env.LINKEDIN_CLIENT_ID,
    facebook: !!process.env.FACEBOOK_APP_ID,
  });
});

export default router;
