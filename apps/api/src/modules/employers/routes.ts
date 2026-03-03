import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { billingProvider } from "../../utils/billing-provider.js";

const router = Router();

router.get(
  "/me",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({
      where: { ownerUserId: req.auth!.userId },
      include: { members: { include: { user: true } }, subscription: true }
    });
    res.json(employer);
  })
);

router.put(
  "/me",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(404).json({ message: "Employer missing" });

    const updated = await prisma.employer.update({ where: { id: employer.id }, data: req.body });
    res.json(updated);
  })
);

router.post(
  "/members/invite",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(404).json({ message: "Employer missing" });

    const { email, role } = req.body;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash: "INVITED_USER_SET_PASSWORD",
        role: "EMPLOYER"
      },
      update: {}
    });

    const member = await prisma.employerMember.upsert({
      where: { employerId_userId: { employerId: employer.id, userId: user.id } },
      create: { employerId: employer.id, userId: user.id, role: role || "RECRUITER" },
      update: { role: role || "RECRUITER" }
    });

    res.status(201).json(member);
  })
);

router.get(
  "/analytics",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(404).json({ message: "Employer missing" });

    const jobs = await prisma.job.findMany({ where: { employerId: employer.id } });
    const totals = jobs.reduce(
      (acc: { views: number; applies: number }, j: { viewsCount: number; appliesCount: number }) => {
        acc.views += j.viewsCount;
        acc.applies += j.appliesCount;
        return acc;
      },
      { views: 0, applies: 0 }
    );

    res.json({ ...totals, conversion: totals.views ? totals.applies / totals.views : 0 });
  })
);

router.post(
  "/subscription",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(404).json({ message: "Employer missing" });

    const plan = req.body.plan || "FREE";
    const providerResult = await billingProvider.createOrUpdateSubscription({ employerId: employer.id, plan });

    const quotaMap = {
      FREE: { jobPosts: 3, featured: 0, candidateSearch: false },
      STANDARD: { jobPosts: 20, featured: 3, candidateSearch: true },
      PREMIUM: { jobPosts: 100, featured: 20, candidateSearch: true }
    } as const;

    const subscription = await prisma.subscription.upsert({
      where: { employerId: employer.id },
      create: {
        employerId: employer.id,
        plan,
        provider: "mock",
        providerSubId: providerResult.providerSubId,
        status: providerResult.status,
        currentPeriodEnd: providerResult.currentPeriodEnd,
        quotaJobPosts: quotaMap[plan as keyof typeof quotaMap]?.jobPosts || 3,
        quotaFeatured: quotaMap[plan as keyof typeof quotaMap]?.featured || 0,
        candidateSearch: quotaMap[plan as keyof typeof quotaMap]?.candidateSearch || false
      },
      update: {
        plan,
        providerSubId: providerResult.providerSubId,
        status: providerResult.status,
        currentPeriodEnd: providerResult.currentPeriodEnd
      }
    });

    res.json(subscription);
  })
);

export default router;

