import { Router } from 'express';
import { EmployersController } from './employers.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { imageUpload, documentUpload, uploadLimiter } from '../../middleware/upload';
import { employerProfileSchema } from '@uaejobs/shared';

const router = Router();
const ctrl = new EmployersController();

// Public: list verified employers
router.get('/employers', async (req, res) => {
  const { page = '1', limit = '12', industry, search } = req.query as Record<string, string>;
  const prisma = (await import('../../lib/prisma')).default;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where: Record<string, unknown> = { verificationStatus: 'APPROVED', isActive: true };
  if (industry) where.industry = industry;
  if (search) where.companyName = { contains: search };
  const [items, total] = await Promise.all([
    prisma.employer.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { companyName: 'asc' },
      select: {
        id: true, companyName: true, slug: true, industry: true, companySize: true,
        description: true, logoUrl: true, emirate: true, location: true, website: true,
        foundedYear: true, verificationStatus: true,
        _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
      },
    }),
    prisma.employer.count({ where }),
  ]);
  res.json({ success: true, data: { items, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
});

// Public: get employer by slug
router.get('/employers/:slug', ctrl.getEmployerBySlug.bind(ctrl));

// Protected employer routes
const employer = Router();
employer.use(authenticate, requireRole('EMPLOYER', 'ADMIN', 'SUB_ADMIN'));

employer.get('/me', ctrl.getMyEmployer.bind(ctrl));
employer.put('/profile', validate(employerProfileSchema), ctrl.updateProfile.bind(ctrl));
employer.post('/upload/logo', uploadLimiter, imageUpload.single('logo'), ctrl.uploadLogo.bind(ctrl));
employer.post('/upload/cover', uploadLimiter, imageUpload.single('cover'), ctrl.uploadCover.bind(ctrl));
employer.post('/upload/license', uploadLimiter, documentUpload.single('license'), ctrl.uploadTradeLicense.bind(ctrl));
employer.get('/team', ctrl.getTeam.bind(ctrl));
employer.post('/team/invite', ctrl.inviteTeamMember.bind(ctrl));
employer.delete('/team/:memberId', ctrl.removeTeamMember.bind(ctrl));
employer.get('/analytics', ctrl.getAnalytics.bind(ctrl));

export { router as publicEmployerRouter, employer as employerRouter };
