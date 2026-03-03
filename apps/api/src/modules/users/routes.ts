import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = Router();

router.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { jobSeekerProfile: true }
    });
    res.json(user);
  })
);

router.put(
  "/me/profile",
  authRequired,
  asyncHandler(async (req, res) => {
    if (req.auth?.role !== "JOB_SEEKER") {
      return res.status(403).json({ message: "Only job seekers can update profile" });
    }

    const profile = await prisma.jobSeekerProfile.upsert({
      where: { userId: req.auth.userId },
      create: { userId: req.auth.userId, ...req.body, workModePrefs: req.body.workModePrefs || [], skills: req.body.skills || [], certifications: req.body.certifications || [], portfolioLinks: req.body.portfolioLinks || [] },
      update: req.body
    });

    res.json(profile);
  })
);

router.post(
  "/me/saved-jobs/:jobId",
  authRequired,
  asyncHandler(async (req, res) => {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId: req.auth!.userId } });
    if (!profile) return res.status(404).json({ message: "Profile missing" });

    const prefs = (profile.preferencesJson as Record<string, unknown> | null) || {};
    const savedJobs = new Set((prefs.savedJobs as string[] | undefined) || []);
    savedJobs.add(String(String(req.params.jobId)));

    const updated = await prisma.jobSeekerProfile.update({
      where: { userId: req.auth!.userId },
      data: { preferencesJson: { ...prefs, savedJobs: [...savedJobs] } }
    });

    res.json(updated);
  })
);

router.get(
  "/me/notifications",
  authRequired,
  asyncHandler(async (req, res) => {
    const items = await prisma.notification.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: "desc" } });
    res.json(items);
  })
);

router.get(
  "/me/export",
  authRequired,
  asyncHandler(async (req, res) => {
    const [user, applications, resumes] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.auth!.userId }, include: { jobSeekerProfile: true } }),
      prisma.application.findMany({ where: { userId: req.auth!.userId } }),
      prisma.resume.findMany({ where: { userId: req.auth!.userId } })
    ]);

    res.json({ user, applications, resumes });
  })
);

router.delete(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    await prisma.user.delete({ where: { id: req.auth!.userId } });
    res.status(204).send();
  })
);

export default router;

