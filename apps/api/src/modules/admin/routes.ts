import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { asyncHandler } from "../../middleware/async-handler.js";
import { getPagination } from "../../utils/pagination.js";
import { logAudit } from "../../utils/audit.js";

const router = Router();

router.use(authRequired, requireRoles("ADMIN", "SUB_ADMIN"));

router.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [users, employers, jobs, applications, openReports] = await Promise.all([
      prisma.user.count(),
      prisma.employer.count(),
      prisma.job.count(),
      prisma.application.count(),
      prisma.report.count({ where: { status: "OPEN" } })
    ]);

    res.json({ users, employers, jobs, applications, openReports, jobsHealth: "ok" });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { skip, limit, page } = getPagination(req.query as Record<string, unknown>);
    const items = await prisma.user.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } });
    res.json({ page, limit, items });
  })
);

router.patch(
  "/users/:id/status",
  asyncHandler(async (req, res) => {
    const status = String(req.body.status);
    const updated = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { status: status as never }
    });
    await logAudit({
      actorUserId: req.auth!.userId,
      actorRole: req.auth!.role,
      action: `USER_STATUS_${status}`,
      targetType: "USER",
      targetId: String(String(req.params.id))
    });
    res.json(updated);
  })
);

router.post(
  "/users/:id/impersonate",
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
    if (!target) return res.status(404).json({ message: "User not found" });

    await logAudit({
      actorUserId: req.auth!.userId,
      actorRole: req.auth!.role,
      action: "USER_IMPERSONATION",
      targetType: "USER",
      targetId: target.id
    });

    res.json({ message: "Impersonation audit recorded", targetUser: { id: target.id, email: target.email, role: target.role } });
  })
);

router.get(
  "/employers/pending-verification",
  asyncHandler(async (_req, res) => {
    const items = await prisma.employer.findMany({ where: { verifiedStatus: "PENDING" }, orderBy: { createdAt: "desc" } });
    res.json(items);
  })
);

router.patch(
  "/employers/:id/verification",
  asyncHandler(async (req, res) => {
    const { verifiedStatus, verificationNote } = req.body;
    const updated = await prisma.employer.update({ where: { id: String(req.params.id) }, data: { verifiedStatus, verificationNote } });
    res.json(updated);
  })
);

router.get(
  "/jobs/moderation",
  asyncHandler(async (_req, res) => {
    const items = await prisma.job.findMany({ where: { status: { in: ["PENDING_REVIEW", "PUBLISHED"] } }, orderBy: { createdAt: "desc" } });
    res.json(items);
  })
);

router.patch(
  "/jobs/:id/moderate",
  asyncHandler(async (req, res) => {
    const updated = await prisma.job.update({
      where: { id: String(req.params.id) },
      data: { status: String(req.body.status) as never, moderationFlags: (req.body.flags || []) as string[] }
    });
    res.json(updated);
  })
);

router.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const items = await prisma.report.findMany({ orderBy: { createdAt: "desc" } });
    res.json(items);
  })
);

router.patch(
  "/reports/:id",
  asyncHandler(async (req, res) => {
    const report = await prisma.report.update({
      where: { id: String(req.params.id) },
      data: { status: String(req.body.status) as never, resolution: req.body.resolution }
    });
    res.json(report);
  })
);

router.get(
  "/subscriptions",
  asyncHandler(async (_req, res) => {
    const items = await prisma.subscription.findMany({ include: { employer: true } });
    res.json(items);
  })
);

router.patch(
  "/subscriptions/:id",
  asyncHandler(async (req, res) => {
    const sub = await prisma.subscription.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json(sub);
  })
);

router.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const { skip, limit, page } = getPagination(req.query as Record<string, unknown>);
    const items = await prisma.auditLog.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } });
    res.json({ page, limit, items });
  })
);

router.put(
  "/settings",
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    await logAudit({
      actorUserId: req.auth!.userId,
      actorRole: req.auth!.role,
      action: "SETTINGS_UPDATE",
      targetType: "SITE_SETTINGS",
      metaJson: req.body
    });
    res.json({ message: "Settings saved", data: req.body });
  })
);

export default router;


