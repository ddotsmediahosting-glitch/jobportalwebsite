import { Router } from "express";
import slugify from "slugify";
import { createJobSchema } from "@uaejobs/shared";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { authRequired } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { getPagination } from "../../utils/pagination.js";

const router = Router();

/**
 * @openapi
 * /api/v1/jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: List/search jobs
 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query as Record<string, unknown>);
    const keyword = String(req.query.q || "").trim();

    const where: Record<string, unknown> = { status: "PUBLISHED" };
    if (req.query.emirate) where.emirate = req.query.emirate;
    if (req.query.workMode) where.workMode = req.query.workMode;
    if (req.query.employmentType) where.employmentType = req.query.employmentType;
    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.salaryMin) where.salaryMin = { gte: Number(req.query.salaryMin) };
    if (req.query.salaryMax) where.salaryMax = { lte: Number(req.query.salaryMax) };
    if (req.query.experienceMin) where.experienceMin = { gte: Number(req.query.experienceMin) };

    let jobs;
    if (keyword) {
      jobs = await prisma.$queryRawUnsafe(
        `SELECT * FROM \"Job\" WHERE \"status\" = 'PUBLISHED' AND to_tsvector('english', coalesce(\"title\", '') || ' ' || coalesce(\"description\", '')) @@ plainto_tsquery('english', $1) ORDER BY \"createdAt\" DESC LIMIT $2 OFFSET $3`,
        keyword,
        limit,
        skip
      );
    } else {
      jobs = await prisma.job.findMany({
        where,
        include: { category: true, employer: true },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      });
    }

    res.json({ page, limit, items: jobs });
  })
);

router.get(
  "/:slug",
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({
      where: { slug: String(req.params.slug) },
      include: { category: true, employer: true, screeningQuestions: true }
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await prisma.job.update({ where: { id: job.id }, data: { viewsCount: { increment: 1 } } });
    res.json(job);
  })
);

router.post(
  "/",
  authRequired,
  requireRoles("EMPLOYER"),
  validate(createJobSchema),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) {
      return res.status(400).json({ message: "Employer profile missing" });
    }

    if (env.requireEmployerVerification && employer.verifiedStatus !== "APPROVED") {
      return res.status(403).json({ message: "Employer verification required" });
    }

    const childrenCount = await prisma.category.count({ where: { parentId: req.body.categoryId, isActive: true } });
    if (childrenCount > 0) {
      return res.status(400).json({ message: "Job must be assigned to a leaf subcategory" });
    }

    const slugBase = slugify(req.body.title, { lower: true, strict: true });
    const slug = `${slugBase}-${Date.now().toString().slice(-6)}`;

    const job = await prisma.job.create({
      data: {
        employerId: employer.id,
        title: req.body.title,
        slug,
        description: req.body.description,
        requirements: req.body.description,
        benefits: req.body.benefits,
        categoryId: req.body.categoryId,
        emirate: req.body.emirate,
        locationText: req.body.locationText,
        salaryMin: req.body.salaryMin,
        salaryMax: req.body.salaryMax,
        currency: req.body.currency,
        negotiable: req.body.negotiable,
        experienceMin: req.body.experienceMin,
        experienceMax: req.body.experienceMax,
        workMode: req.body.workMode,
        employmentType: req.body.employmentType,
        visa: req.body.visa,
        immediateJoiner: req.body.immediateJoiner,
        languageRequirements: req.body.languageRequirements,
        skills: req.body.skills,
        status: "DRAFT",
        screeningQuestions: {
          create: req.body.screeningQuestions.map((q: { question: string; type: string; options?: string[] }) => ({
            question: q.question,
            type: q.type,
            options: q.options || []
          }))
        }
      },
      include: { screeningQuestions: true }
    });

    res.status(201).json(job);
  })
);

router.patch(
  "/:id/publish",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(400).json({ message: "Employer missing" });

    const job = await prisma.job.findUnique({ where: { id: String(req.params.id) } });
    if (!job || job.employerId !== employer.id) {
      return res.status(404).json({ message: "Job not found" });
    }

    const updated = await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "PUBLISHED",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json(updated);
  })
);

router.patch(
  "/:id",
  authRequired,
  requireRoles("EMPLOYER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const job = await prisma.job.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json(job);
  })
);

router.post(
  "/:id/clone",
  authRequired,
  requireRoles("EMPLOYER"),
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: String(req.params.id) }, include: { screeningQuestions: true } });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const cloned = await prisma.job.create({
      data: {
        slug: `${job.slug}-copy-${Date.now().toString().slice(-4)}`,
        title: `${job.title} (Copy)`,
        employerId: job.employerId,
        description: job.description,
        requirements: job.requirements,
        benefits: job.benefits,
        categoryId: job.categoryId,
        emirate: job.emirate,
        locationText: job.locationText,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        currency: job.currency,
        negotiable: job.negotiable,
        experienceMin: job.experienceMin,
        experienceMax: job.experienceMax,
        experienceBand: job.experienceBand,
        workMode: job.workMode,
        employmentType: job.employmentType,
        visa: job.visa,
        immediateJoiner: job.immediateJoiner,
        languageRequirements: job.languageRequirements,
        skills: job.skills,
        moderationFlags: job.moderationFlags,
        status: "DRAFT",
        screeningQuestions: {
          create: job.screeningQuestions.map((q: { question: string; type: string; options: string[] }) => ({
            question: q.question,
            type: q.type,
            options: q.options
          }))
        }
      }
    });

    res.status(201).json(cloned);
  })
);

router.post(
  "/:id/report",
  authRequired,
  asyncHandler(async (req, res) => {
    const report = await prisma.report.create({
      data: {
        type: "JOB_REPORT",
        reporterId: req.auth!.userId,
        targetType: "JOB",
        targetId: String(req.params.id),
        reason: req.body.reason || "No reason"
      }
    });
    res.status(201).json(report);
  })
);

export default router;

