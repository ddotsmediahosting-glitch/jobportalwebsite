import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = Router();

router.get(
  "/",
  authRequired,
  asyncHandler(async (req, res) => {
    const items = await prisma.notification.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: "desc" } });
    res.json(items);
  })
);

router.patch(
  "/:id/read",
  authRequired,
  asyncHandler(async (req, res) => {
    const item = await prisma.notification.update({ where: { id: String(req.params.id) }, data: { readAt: new Date() } });
    res.json(item);
  })
);

export default router;

