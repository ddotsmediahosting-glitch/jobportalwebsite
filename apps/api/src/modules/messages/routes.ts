import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { env } from "../../config/env.js";
import { authRequired } from "../../middleware/auth.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = Router();

router.use(authRequired);

router.get(
  "/threads/:threadId",
  asyncHandler(async (req, res) => {
    if (!env.enableMessaging) {
      return res.status(404).json({ message: "Messaging disabled" });
    }
    const items = await prisma.message.findMany({ where: { threadId: String(req.params.threadId) }, orderBy: { createdAt: "asc" } });
    res.json(items);
  })
);

router.post(
  "/threads/:threadId",
  asyncHandler(async (req, res) => {
    if (!env.enableMessaging) {
      return res.status(404).json({ message: "Messaging disabled" });
    }

    const message = await prisma.message.create({
      data: {
        threadId: String(req.params.threadId),
        fromUserId: req.auth!.userId,
        toUserId: req.body.toUserId,
        body: req.body.body
      }
    });

    res.status(201).json(message);
  })
);

export default router;

