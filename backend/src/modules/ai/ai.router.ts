import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest, requireRole } from '../../middleware/auth';
import {
  generateJobDescription,
  screenApplications,
  scoreJobMatch,
  chatWithCareerAdvisor,
  getSalaryInsights,
  generateInterviewPrep,
  detectJobFraud,
  rankJobsForCandidate,
  analyzeTrendingSkills,
  coachProfile,
  generateHiringInsights,
  analyzePortfolio,
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
    skills: (Array.isArray(app.user.seekerProfile?.skills) ? app.user.seekerProfile!.skills as string[] : []),
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
      skills: (Array.isArray(profile.skills) ? profile.skills as string[] : []),
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
        skills: (Array.isArray(profile.skills) ? profile.skills as string[] : []),
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

// ── POST /ai/fraud-check/:jobId  (ADMIN/SUB_ADMIN only) ───────────────────────
router.post('/fraud-check/:jobId', requireRole('ADMIN', 'SUB_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, description: true, employer: { select: { companyName: true } }, salaryMin: true, salaryMax: true },
  });
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  const result = await detectJobFraud(
    job.title,
    job.description,
    job.employer.companyName,
    job.salaryMin,
    job.salaryMax,
  );

  await prisma.job.update({
    where: { id: jobId },
    data: {
      fraudRiskScore: result.riskScore,
      fraudRiskLevel: result.riskLevel,
      fraudFlags: result.flags,
      fraudExplanation: result.explanation,
      fraudCheckedAt: new Date(),
    },
  });

  res.json({ success: true, data: result });
});

// ── GET /ai/fraud-results/:jobId  (ADMIN/SUB_ADMIN only) ──────────────────────
router.get('/fraud-results/:jobId', requireRole('ADMIN', 'SUB_ADMIN'), async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true,
      fraudRiskScore: true,
      fraudRiskLevel: true,
      fraudFlags: true,
      fraudExplanation: true,
      fraudCheckedAt: true,
    },
  });
  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  res.json({ success: true, data: job });
});

// ── GET /ai/recommended-jobs  (SEEKER only) ───────────────────────────────────
router.get('/recommended-jobs', requireRole('SEEKER'), async (req: AuthRequest, res: Response) => {
  const { cacheGetOrSet } = await import('../../lib/cache');

  const profile = await prisma.jobSeekerProfile.findUnique({
    where: { userId: req.user!.sub },
    select: { skills: true, yearsOfExperience: true, headline: true, bio: true, desiredWorkModes: true },
  });

  if (!profile || !(Array.isArray(profile.skills) && profile.skills.length)) {
    res.json({ success: true, data: [], message: 'Complete your profile to get personalized recommendations' });
    return;
  }

  const cacheKey = `recommendations:${req.user!.sub}`;

  const data = await cacheGetOrSet(cacheKey, async () => {
    // Fetch recent published jobs (sample for matching)
    const recentJobs = await prisma.job.findMany({
      where: {
        status: 'PUBLISHED',
        employer: { verificationStatus: 'APPROVED' },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        skills: true,
        employer: { select: { id: true, companyName: true, slug: true, logoUrl: true, emirate: true } },
        category: { select: { id: true, name: true, slug: true } },
        emirate: true,
        workMode: true,
        salaryMin: true,
        salaryMax: true,
        _count: { select: { applications: true } },
      },
    });

    if (recentJobs.length === 0) return [];

    const rankings = await rankJobsForCandidate(
      {
        skills: (Array.isArray(profile.skills) ? profile.skills as string[] : []),
        yearsOfExperience: profile.yearsOfExperience || undefined,
        headline: profile.headline || undefined,
        bio: profile.bio || undefined,
        preferredWorkMode: (Array.isArray(profile.desiredWorkModes) && profile.desiredWorkModes.length ? (profile.desiredWorkModes as string[])[0] : undefined),
      },
      recentJobs.map((j) => ({ id: j.id, title: j.title, description: j.description, skills: (Array.isArray(j.skills) ? j.skills as string[] : []) }))
    );

    // Merge match scores back into full job objects
    return rankings
      .slice(0, 8)
      .map((r) => {
        const job = recentJobs.find((j) => j.id === r.jobId);
        return job ? { ...job, matchScore: r.matchScore, matchLabel: r.matchLabel, topReasons: r.topReasons } : null;
      })
      .filter(Boolean);
  }, 1800); // cache 30 minutes

  res.json({ success: true, data });
});

// ── GET /ai/trending-skills  (any authenticated user) ─────────────────────────
router.get('/trending-skills', async (_req: Request, res: Response) => {
  const { cacheGetOrSet } = await import('../../lib/cache');

  const data = await cacheGetOrSet('ai:trending-skills', async () => {
    // Aggregate skills from recent published jobs
    const recentJobs = await prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 200,
      select: { skills: true, title: true },
    });

    const skillFreq: Record<string, number> = {};
    const titleSet = new Set<string>();

    recentJobs.forEach((job) => {
      titleSet.add(job.title);
      (Array.isArray(job.skills) ? job.skills as string[] : []).forEach((skill) => {
        if (skill && skill.length > 1) {
          skillFreq[skill] = (skillFreq[skill] || 0) + 1;
        }
      });
    });

    if (Object.keys(skillFreq).length === 0) {
      return [];
    }

    return analyzeTrendingSkills(skillFreq, Array.from(titleSet));
  }, 21600); // cache 6 hours

  res.json({ success: true, data });
});

// ── GET /ai/profile-coach  (SEEKER only) ──────────────────────────────────────
router.get('/profile-coach', requireRole('SEEKER'), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.sub;

  const [profile, resumeCount, educationCount, experienceCount, certCount, user] = await Promise.all([
    prisma.jobSeekerProfile.findUnique({
      where: { userId },
      select: { firstName: true, lastName: true, headline: true, bio: true, skills: true, yearsOfExperience: true, desiredWorkModes: true, avatarUrl: true },
    }),
    prisma.resume.count({ where: { profile: { userId } } }),
    prisma.education.count({ where: { profile: { userId } } }),
    prisma.workExperience.count({ where: { profile: { userId } } }),
    prisma.certification.count({ where: { profile: { userId } } }),
    prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } }),
  ]);

  if (!profile) {
    res.json({
      success: true,
      data: {
        completionScore: 0,
        grade: 'D',
        strengths: [],
        improvements: [{ section: 'Profile Setup', priority: 'critical', suggestion: 'Create your seeker profile to get started', impact: 'Employers cannot find you without a profile' }],
        missingCritical: ['Complete profile setup'],
        nextSteps: ['Go to Profile and fill in your basic information'],
        profileSummary: 'Profile not yet created. Start by filling in your basic details.',
      },
    });
    return;
  }

  const result = await coachProfile({
    firstName: profile.firstName || undefined,
    lastName: profile.lastName || undefined,
    headline: profile.headline || undefined,
    bio: profile.bio || undefined,
    skills: (Array.isArray(profile.skills) ? profile.skills as string[] : []),
    yearsOfExperience: profile.yearsOfExperience || undefined,
    preferredWorkMode: (Array.isArray(profile.desiredWorkModes) && profile.desiredWorkModes.length ? (profile.desiredWorkModes as string[])[0] : undefined),
    hasAvatar: !!(profile.avatarUrl || user?.avatarUrl),
    resumeCount,
    educationCount,
    experienceCount,
    certificationCount: certCount,
  });

  res.json({ success: true, data: result });
});

// ── GET /ai/hiring-insights  (EMPLOYER only) ──────────────────────────────────
router.get('/hiring-insights', requireRole('EMPLOYER'), async (req: AuthRequest, res: Response) => {
  const { cacheGetOrSet } = await import('../../lib/cache');

  const employer = await prisma.employer.findFirst({
    where: { ownerUserId: req.user!.sub },
    select: { id: true, companyName: true, emirate: true },
  });

  if (!employer) {
    res.status(404).json({ success: false, error: 'Employer profile not found' });
    return;
  }

  const cacheKey = `hiring-insights:${employer.id}`;

  const data = await cacheGetOrSet(cacheKey, async () => {
    const [jobs, applications] = await Promise.all([
      prisma.job.findMany({
        where: { employer: { id: employer.id } },
        select: { id: true, title: true, status: true, salaryMin: true, salaryMax: true, publishedAt: true, _count: { select: { applications: true } } },
        orderBy: { publishedAt: 'desc' },
        take: 50,
      }),
      prisma.application.findMany({
        where: { job: { employer: { id: employer.id } } },
        select: { status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'PUBLISHED').length;
    const totalApplications = applications.length;
    const avgApplicationsPerJob = totalJobs > 0 ? totalApplications / totalJobs : 0;
    const hiredCount = applications.filter((a) => a.status === 'HIRED').length;
    const hireRate = totalApplications > 0 ? hiredCount / totalApplications : 0;
    const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;
    const rejectionRate = totalApplications > 0 ? rejectedCount / totalApplications : 0;

    const salariesWithData = jobs.filter((j) => j.salaryMin || j.salaryMax);
    const avgSalaryOffered = salariesWithData.length > 0
      ? salariesWithData.reduce((sum, j) => sum + ((j.salaryMin || 0) + (j.salaryMax || 0)) / 2, 0) / salariesWithData.length
      : 0;

    const topJobTitles = [...new Set(jobs.map((j) => j.title))];

    // Calculate avg days to fill (published → first hire)
    const avgTimeToFill = 21; // Default estimate

    return generateHiringInsights({
      totalJobs,
      activeJobs,
      totalApplications,
      avgApplicationsPerJob,
      hireRate,
      topJobTitles,
      avgSalaryOffered,
      avgTimeToFill,
      rejectionRate,
      companyName: employer.companyName,
      emirate: employer.emirate || 'Dubai',
    });
  }, 3600); // cache 1 hour

  res.json({ success: true, data });
});

// ── POST /ai/portfolio-review  (public — no auth required) ───────────────────
router.post('/portfolio-review', async (req: Request, res: Response) => {
  const { portfolioUrl, description, role, targetIndustry } = req.body;
  if (!description || !role) {
    res.status(400).json({ success: false, error: 'description and role are required' });
    return;
  }
  if (description.trim().length < 30) {
    res.status(400).json({ success: false, error: 'Please provide more detail about your portfolio (min 30 characters)' });
    return;
  }
  const result = await analyzePortfolio({ portfolioUrl, description, role, targetIndustry });
  res.json({ success: true, data: result });
});

export default router;
