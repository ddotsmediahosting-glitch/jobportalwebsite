import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';
import {
  generateJobDescription,
  screenApplications,
  scoreJobMatch,
  chatWithCareerAdvisor,
  getSalaryInsights,
  generateInterviewPrep,
} from '../../lib/ai';
import { config } from '../../config';
import prisma from '../../lib/prisma';

const router = Router();

// ── GET /ai/status  (public — no auth needed) ─────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  const key = config.ai.anthropicApiKey;
  const configured = !!(key && key.length >= 20 && !key.startsWith('sk-ant-your') && !key.includes('your-key'));
  res.json({ success: true, data: { configured } });
});

router.use(authenticate);

// ── POST /ai/job-description  (any authenticated user) ───────────────────────
router.post('/job-description', async (req: AuthRequest, res: Response) => {
  const { role, industry, keyRequirements, companyName, emirate, workMode, experienceYears } = req.body;
  if (!role || !keyRequirements) {
    res.status(400).json({ success: false, error: 'role and keyRequirements are required' });
    return;
  }
  const result = await generateJobDescription(
    role,
    industry || 'General',
    keyRequirements,
    companyName || 'Our Company',
    emirate || 'Dubai',
    workMode || 'On-site',
    experienceYears || '3+ years'
  );
  res.json({ success: true, data: result });
});

// ── POST /ai/screen-applications/:jobId  (EMPLOYER only) ─────────────────────
router.post('/screen-applications/:jobId', requireRole('EMPLOYER'), async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  // Verify employer owns this job
  const job = await prisma.job.findFirst({
    where: { id: jobId, employer: { ownerUserId: req.user!.sub } },
    select: { id: true, title: true, description: true },
  });
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  // Get all applications with seeker profile
  const applications = await prisma.application.findMany({
    where: { jobId },
    take: 50,
    include: {
      user: {
        include: { seekerProfile: true },
      },
    },
  });

  if (applications.length === 0) {
    res.json({ success: true, data: [] });
    return;
  }

  const candidates = applications.map(app => ({
    applicationId: app.id,
    candidateName: app.user.seekerProfile
      ? `${app.user.seekerProfile.firstName} ${app.user.seekerProfile.lastName}`
      : app.user.email,
    coverLetter: app.coverLetter || undefined,
    skills: (app.user.seekerProfile?.skills as string[]) || [],
    headline: app.user.seekerProfile?.headline || undefined,
    yearsOfExperience: app.user.seekerProfile?.yearsOfExperience || undefined,
  }));

  const results = await screenApplications(job.title, job.description, candidates);

  // Persist results to DB (upsert so re-screening overwrites previous)
  await Promise.all(
    results.map((r) =>
      prisma.aIScreeningResult.upsert({
        where: { applicationId: r.applicationId },
        create: {
          applicationId: r.applicationId,
          jobId,
          fitScore: r.fitScore,
          fitLabel: r.fitLabel,
          priority: r.priority,
          matchingStrengths: r.matchingStrengths,
          gaps: r.gaps,
          recommendation: r.recommendation,
        },
        update: {
          fitScore: r.fitScore,
          fitLabel: r.fitLabel,
          priority: r.priority,
          matchingStrengths: r.matchingStrengths,
          gaps: r.gaps,
          recommendation: r.recommendation,
        },
      })
    )
  );

  res.json({ success: true, data: results });
});

// ── GET /ai/screening-results/:jobId  (EMPLOYER only) ─────────────────────────
router.get('/screening-results/:jobId', requireRole('EMPLOYER'), async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  // Verify employer owns this job
  const job = await prisma.job.findFirst({
    where: { id: jobId, employer: { ownerUserId: req.user!.sub } },
    select: { id: true },
  });
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  const results = await prisma.aIScreeningResult.findMany({
    where: { jobId },
    orderBy: { fitScore: 'desc' },
  });

  res.json({ success: true, data: results });
});

// ── GET /ai/match-score/:jobId  (SEEKER only) ─────────────────────────────────
router.get('/match-score/:jobId', requireRole('SEEKER'), async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId }, select: { title: true, description: true } }),
    prisma.jobSeekerProfile.findUnique({ where: { userId: req.user!.sub } }),
  ]);

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }
  if (!profile) {
    res.status(400).json({ success: false, error: 'Complete your profile to get a match score' });
    return;
  }

  const result = await scoreJobMatch(
    {
      skills: (profile.skills as string[]) || [],
      yearsOfExperience: profile.yearsOfExperience || undefined,
      headline: profile.headline || undefined,
      bio: profile.bio || undefined,
    },
    job.description,
    job.title
  );

  res.json({ success: true, data: result });
});

// ── POST /ai/career-chat  (any authenticated user) ────────────────────────────
router.post('/career-chat', async (req: AuthRequest, res: Response) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: 'messages array is required' });
    return;
  }

  // Optionally enrich with seeker profile if available
  let userContext;
  if (req.user?.role === 'SEEKER') {
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId: req.user.sub },
      select: { skills: true, yearsOfExperience: true, headline: true },
    });
    if (profile) {
      userContext = {
        skills: (profile.skills as string[]) || [],
        yearsOfExperience: profile.yearsOfExperience || undefined,
        headline: profile.headline || undefined,
      };
    }
  }

  const reply = await chatWithCareerAdvisor(messages, userContext);
  res.json({ success: true, data: { reply } });
});

// ── POST /ai/salary-insights  (any authenticated user) ────────────────────────
router.post('/salary-insights', async (req: AuthRequest, res: Response) => {
  const { role, industry, emirate, yearsOfExperience } = req.body;
  if (!role) {
    res.status(400).json({ success: false, error: 'role is required' });
    return;
  }
  const result = await getSalaryInsights(
    role,
    industry || 'General',
    emirate || 'Dubai',
    yearsOfExperience || 3
  );
  res.json({ success: true, data: result });
});

// ── POST /ai/interview-prep  (any authenticated user) ─────────────────────────
router.post('/interview-prep', async (req: AuthRequest, res: Response) => {
  const { role, industry, yearsOfExperience, specificFocus } = req.body;
  if (!role) {
    res.status(400).json({ success: false, error: 'role is required' });
    return;
  }
  const result = await generateInterviewPrep(
    role,
    industry || 'General',
    yearsOfExperience || 3,
    specificFocus
  );
  res.json({ success: true, data: result });
});

export default router;
