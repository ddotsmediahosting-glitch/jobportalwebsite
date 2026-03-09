import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import slugify from 'slugify';

const router = Router();
router.use(authenticate);

// Helper: get or auto-create a personal employer profile for any user
async function getOrCreatePersonalEmployer(userId: string) {
  // Check if user already has an employer profile
  const existing = await prisma.employer.findUnique({ where: { ownerUserId: userId } });
  if (existing) return existing;

  // Get user info for the profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { seekerProfile: true },
  });
  if (!user) throw new AppError(404, 'User not found');

  const name =
    user.seekerProfile
      ? `${user.seekerProfile.firstName} ${user.seekerProfile.lastName}`
      : user.email.split('@')[0];

  const baseSlug = slugify(name, { lower: true, strict: true });
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

  // Auto-create personal employer — mark as APPROVED so the job can be visible after admin approves it
  const employer = await prisma.employer.create({
    data: {
      ownerUserId: userId,
      companyName: name,
      slug: uniqueSlug,
      verificationStatus: 'APPROVED',
      isActive: true,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
  });

  return employer;
}

// ── POST /user-jobs  — any logged-in user can submit a job post ────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const {
    title, description, categoryId, emirate, workMode, employmentType,
    visaStatus, location, salaryMin, salaryMax, salaryNegotiable,
    experienceMin, experienceMax, level, skills, requirements, benefits,
  } = req.body;

  if (!title || !description || !categoryId || !emirate || !workMode || !employmentType) {
    throw new AppError(400, 'title, description, categoryId, emirate, workMode and employmentType are required');
  }

  const employer = await getOrCreatePersonalEmployer(req.user!.sub);

  const baseSlug = slugify(title, { lower: true, strict: true });
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

  const job = await prisma.job.create({
    data: {
      title,
      description,
      categoryId,
      emirate,
      workMode,
      employmentType,
      visaStatus: visaStatus || 'NOT_REQUIRED',
      location: location || null,
      salaryMin: salaryMin ? Number(salaryMin) : null,
      salaryMax: salaryMax ? Number(salaryMax) : null,
      salaryNegotiable: salaryNegotiable || false,
      experienceMin: experienceMin != null ? Number(experienceMin) : undefined,
      experienceMax: experienceMax != null ? Number(experienceMax) : undefined,
      level: level || null,
      skills: Array.isArray(skills) ? skills : [],
      requirements: requirements || null,
      benefits: benefits || null,
      employerId: employer.id,
      slug: uniqueSlug,
      status: 'PENDING_APPROVAL',
    },
    include: {
      employer: { select: { id: true, companyName: true } },
      category: { select: { id: true, name: true } },
    },
  });

  res.status(201).json({ success: true, data: job });
});

// ── GET /user-jobs/mine  — list user's own submitted jobs ─────────────────────
router.get('/mine', async (req: AuthRequest, res: Response) => {
  const employer = await prisma.employer.findUnique({ where: { ownerUserId: req.user!.sub } });
  if (!employer) {
    res.json({ success: true, data: { items: [], total: 0 } });
    return;
  }

  const jobs = await prisma.job.findMany({
    where: { employerId: employer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { id: true, name: true } },
      _count: { select: { applications: true } },
    },
  });

  res.json({ success: true, data: { items: jobs, total: jobs.length } });
});

// ── DELETE /user-jobs/:id  — delete user's own job post ──────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const employer = await prisma.employer.findUnique({ where: { ownerUserId: req.user!.sub } });
  if (!employer) throw new AppError(403, 'No job posts found');

  const job = await prisma.job.findFirst({
    where: { id: req.params.id, employerId: employer.id },
  });
  if (!job) throw new AppError(404, 'Job not found');
  if (job.status === 'PUBLISHED') throw new AppError(400, 'Cannot delete a published job. Close it first.');

  await prisma.job.delete({ where: { id: job.id } });
  res.json({ success: true, message: 'Job deleted' });
});

export default router;
