import { Router } from "express";
import { applyJobSchema } from "@uaejobs/shared";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = Router();

router.post(
  "/jobs/:jobId/apply",
  authRequired,
  requireRoles("JOB_SEEKER"),
  validate(applyJobSchema),
  asyncHandler(async (req, res) => {
    const job = await prisma.job.findUnique({ where: { id: String(req.params.jobId) } });
    if (!job || job.status !== "PUBLISHED") {
      return res.status(404).json({ message: "Job unavailable" });
    }

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        userId: req.auth!.userId,
        status: "SUBMITTED",
        cvId: req.body.cvId,
        coverLetter: req.body.coverLetter,
        answersJson: req.body.answers
      }
    });

    await prisma.job.update({ where: { id: job.id }, data: { appliesCount: { increment: 1 } } });
    res.status(201).json(application);
  })
);

router.get(
  "/me",
  authRequired,
  requireRoles("JOB_SEEKER"),
  asyncHandler(async (req, res) => {
    const items = await prisma.application.findMany({
      where: { userId: req.auth!.userId },
      include: { job: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(items);
  })
);

router.get(
  "/employer/job/:jobId",
  authRequired,
  requireRoles("EMPLOYER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const items = await prisma.application.findMany({
      where: { jobId: String(req.params.jobId) },
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(items);
  })
);

router.patch(
  "/:id/status",
  authRequired,
  requireRoles("EMPLOYER", "ADMIN"),
  asyncHandler(async (req, res) => {
    const status = req.body.status;
    const app = await prisma.application.update({
      where: { id: String(req.params.id) },
      data: {
        status,
        notes: req.body.notes,
        rating: req.body.rating,
        tags: req.body.tags || []
      }
    });
    res.json(app);
  })
);

export default router;

