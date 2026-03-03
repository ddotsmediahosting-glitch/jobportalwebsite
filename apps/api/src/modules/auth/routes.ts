import { Router } from "express";
import crypto from "node:crypto";
import { loginSchema, registerSchema } from "@uaejobs/shared";
import { prisma } from "../../config/prisma.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { validate } from "../../middleware/validate.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/jwt.js";
import { authRequired } from "../../middleware/auth.js";
import { logAudit } from "../../utils/audit.js";
import { emailQueue } from "../../queues/index.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, password, role, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await prisma.user.create({
      data: {
        email,
        phone,
        role,
        passwordHash: await hashPassword(password)
      }
    });

    if (role === "JOB_SEEKER") {
      await prisma.jobSeekerProfile.create({ data: { userId: user.id, workModePrefs: [], skills: [], certifications: [], portfolioLinks: [] } });
    }

    if (role === "EMPLOYER") {
      await prisma.employer.create({
        data: {
          ownerUserId: user.id,
          companyName: `Company of ${email}`
        }
      });
    }

    await emailQueue.add("verify-email", { userId: user.id, email });
    res.status(201).json({ message: "Registered successfully. Verify email to continue." });
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, otp } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({ message: "Account is not active" });
    }

    if (user.twoFaEnabled && !otp) {
      return res.status(428).json({ message: "OTP required" });
    }

    const employer = user.role === "EMPLOYER" ? await prisma.employer.findFirst({ where: { ownerUserId: user.id } }) : null;

    const accessToken = signAccessToken({ sub: user.id, role: user.role, employerId: employer?.id });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role, employerId: employer?.id });
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, role: user.role, email: user.email }
    });
  })
);

router.post(
  "/admin/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!["ADMIN", "SUB_ADMIN"].includes(user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });
    res.json({ accessToken, refreshToken, user: { id: user.id, role: user.role, email: user.email } });
  })
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (!refreshToken) {
      return res.status(400).json({ message: "refreshToken is required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role, employerId: payload.employerId });
    res.json({ accessToken });
  })
);

router.post(
  "/logout",
  authRequired,
  asyncHandler(async (req, res) => {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (refreshToken) {
      const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revokedAt: new Date() } });
    }
    res.json({ message: "Logged out" });
  })
);

router.post(
  "/verify-email",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    await prisma.user.update({ where: { email }, data: { verifiedAt: new Date() } });
    res.json({ message: "Email verified" });
  })
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await emailQueue.add("forgot-password", { userId: user.id, email });
    }
    res.json({ message: "If account exists, reset email sent" });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { email, newPassword } = req.body;
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { email }, data: { passwordHash } });
    await logAudit({ actorRole: "SYSTEM", action: "RESET_PASSWORD", targetType: "USER", targetId: email });
    res.json({ message: "Password reset" });
  })
);

export default router;

