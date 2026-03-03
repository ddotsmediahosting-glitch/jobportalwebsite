import { Router } from "express";
import multer from "multer";
import { prisma } from "../../config/prisma.js";
import { authRequired } from "../../middleware/auth.js";
import { storageProvider } from "../../utils/storage.js";
import { asyncHandler } from "../../middleware/async-handler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

router.post(
  "/cv",
  authRequired,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File required" });
    const fileUrl = await storageProvider.save(req.file, "resumes");
    const resume = await prisma.resume.create({ data: { userId: req.auth!.userId, fileUrl } });
    res.status(201).json(resume);
  })
);

router.post(
  "/trade-license",
  authRequired,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File required" });
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(404).json({ message: "Employer not found" });

    const tradeLicenseUrl = await storageProvider.save(req.file, "trade-licenses");
    const updated = await prisma.employer.update({
      where: { id: employer.id },
      data: { tradeLicenseUrl, verifiedStatus: "PENDING" }
    });

    res.json(updated);
  })
);

router.post(
  "/company-logo",
  authRequired,
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "File required" });
    const employer = await prisma.employer.findFirst({ where: { ownerUserId: req.auth!.userId } });
    if (!employer) return res.status(404).json({ message: "Employer not found" });

    const logoUrl = await storageProvider.save(req.file, "company-logos");
    const updated = await prisma.employer.update({ where: { id: employer.id }, data: { logoUrl } });
    res.json(updated);
  })
);

export default router;

