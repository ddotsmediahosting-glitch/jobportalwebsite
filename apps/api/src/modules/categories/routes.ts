import { Router } from "express";
import { createCategorySchema } from "@uaejobs/shared";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { requireRoles } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }]
    });
    res.json(categories);
  })
);

router.post(
  "/",
  authRequired,
  requireRoles("ADMIN", "SUB_ADMIN"),
  validate(createCategorySchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  })
);

router.put(
  "/:id",
  authRequired,
  requireRoles("ADMIN", "SUB_ADMIN"),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.update({ where: { id: String(req.params.id) }, data: req.body });
    res.json(category);
  })
);

router.delete(
  "/:id",
  authRequired,
  requireRoles("ADMIN"),
  asyncHandler(async (req, res) => {
    const hasChildren = await prisma.category.count({ where: { parentId: String(req.params.id) } });
    if (hasChildren > 0) {
      return res.status(400).json({ message: "Cannot delete category with children" });
    }
    await prisma.category.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  })
);

router.post(
  "/reorder",
  authRequired,
  requireRoles("ADMIN", "SUB_ADMIN"),
  asyncHandler(async (req, res) => {
    const items: Array<{ id: string; sortOrder: number }> = req.body.items || [];
    await prisma.$transaction(items.map((item) => prisma.category.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })));
    res.json({ message: "Categories reordered" });
  })
);

export default router;

