import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { defaultLimiter } from './middleware/rateLimiter';

import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import { publicEmployerRouter, employerRouter } from './modules/employers/employers.router';
import { jobsRouter, employerJobsRouter } from './modules/jobs/jobs.router';
import { applicationSeekerRouter, applicationEmployerRouter } from './modules/applications/applications.router';
import categoriesRouter from './modules/categories/categories.router';
import adminRouter from './modules/admin/admin.router';
import billingRouter from './modules/billing/billing.router';
import notificationsRouter from './modules/notifications/notifications.router';
import cvRouter from './modules/cv/cv.router';
import aiRouter from './modules/ai/ai.router';
import seoRouter from './modules/seo/seo.router';
import marketingRouter from './modules/marketing/marketing.router';
import whatsappRouter from './modules/whatsapp/whatsapp.router';
import reviewsRouter from './modules/reviews/reviews.router';
import salaryRouter from './modules/salary/salary.router';
import candidatesRouter from './modules/candidates/candidates.router';
import userJobsRouter from './modules/user-jobs/user-jobs.router';
import { contentPublicRouter, contentAdminRouter } from './modules/content/content.router';
import { whatsappLinksPublicRouter, whatsappLinksAdminRouter } from './modules/whatsapp-links/whatsapp-links.router';
import { communityPublicRouter, communityAdminRouter } from './modules/community/community.router';
import { swaggerSpec } from './swagger';

const app = express();
app.set('trust proxy', 1);

// ── Security ───────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsing ────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ── Logging ────────────────────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
app.use('/api', defaultLimiter);

// ── Static files (uploads) ────────────────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(config.storage.uploadDir)));

// ── SEO (robots + sitemap at root level) ──────────────────────────────────────
app.use('/', seoRouter);

// ── API Docs ───────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'UAE Jobs Portal API',
}));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const prisma = (await import('./lib/prisma')).default;
  const redis = (await import('./lib/redis')).default;

  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    redis.ping(),
  ]);

  const db = checks[0].status === 'fulfilled' ? 'ok' : 'error';
  const cache = checks[1].status === 'fulfilled' ? 'ok' : 'error';
  const healthy = db === 'ok' && cache === 'ok';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: { db, cache },
  });
});

// ── Public content page ────────────────────────────────────────────────────────
app.get('/api/v1/pages/:slug', async (req, res) => {
  const prisma = (await import('./lib/prisma')).default;
  const page = await prisma.contentPage.findUnique({ where: { slug: req.params.slug, isPublished: true } });
  if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
  res.json({ success: true, data: page });
});

// ── Home page data ─────────────────────────────────────────────────────────────
app.get('/api/v1/home', async (_req, res) => {
  const { cacheGetOrSet } = await import('./lib/cache');
  const prisma = (await import('./lib/prisma')).default;

  const data = await cacheGetOrSet('home:data', async () => {
    const [
      totalJobs,
      totalEmployers,
      totalSeekers,
      featuredJobs,
      featuredCategories,
      recentJobs,
    ] = await Promise.all([
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.employer.count({ where: { verificationStatus: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'SEEKER' } }),
      prisma.job.findMany({
        where: { status: 'PUBLISHED', isFeatured: true, employer: { verificationStatus: 'APPROVED' } },
        orderBy: [{ featuredUntil: 'desc' }, { publishedAt: 'desc' }],
        take: 6,
        include: {
          employer: { select: { id: true, companyName: true, slug: true, logoUrl: true, emirate: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.category.findMany({
        where: { isFeatured: true, isActive: true, parentId: null },
        orderBy: { sortOrder: 'asc' },
        take: 8,
        include: {
          _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } },
          children: {
            where: { isActive: true },
            take: 5,
            orderBy: { sortOrder: 'asc' },
            include: { _count: { select: { jobs: { where: { status: 'PUBLISHED' } } } } },
          },
        },
      }),
      prisma.job.findMany({
        where: { status: 'PUBLISHED', employer: { verificationStatus: 'APPROVED' } },
        orderBy: { publishedAt: 'desc' },
        take: 10,
        include: {
          employer: { select: { id: true, companyName: true, slug: true, logoUrl: true, emirate: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { applications: true } },
        },
      }),
    ]);

    // Salary insights by emirate
    const salaryInsights = await prisma.job.groupBy({
      by: ['emirate'],
      where: { status: 'PUBLISHED', salaryMin: { gt: 0 } },
      _avg: { salaryMin: true, salaryMax: true },
      _count: { _all: true },
      orderBy: { _count: { emirate: 'desc' } },
    });

    return {
      stats: { totalJobs, totalEmployers, totalSeekers },
      featuredJobs,
      featuredCategories,
      recentJobs,
      salaryInsights,
    };
  }, 90);

  res.json({ success: true, data });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
const v1 = '/api/v1';

app.use(`${v1}/auth`, authRouter);
app.use(`${v1}/seeker`, usersRouter);
app.use(`${v1}`, publicEmployerRouter);
app.use(`${v1}/employer`, employerRouter);
app.use(`${v1}/jobs`, jobsRouter);
app.use(`${v1}/employer`, employerJobsRouter);
app.use(`${v1}`, applicationSeekerRouter);
app.use(`${v1}/employer`, applicationEmployerRouter);
app.use(`${v1}/categories`, categoriesRouter);
app.use(`${v1}/admin`, adminRouter);
app.use(`${v1}/billing`, billingRouter);
app.use(`${v1}/notifications`, notificationsRouter);
app.use(`${v1}/cv`, cvRouter);
app.use(`${v1}/ai`, aiRouter);
app.use(`${v1}/seo`, seoRouter);
app.use(`${v1}/marketing`, marketingRouter);
app.use(`${v1}/whatsapp`, whatsappRouter);
app.use(`${v1}`, reviewsRouter);
app.use(`${v1}/salary`, salaryRouter);
app.use(`${v1}/candidates`, candidatesRouter);
app.use(`${v1}/user-jobs`, userJobsRouter);
app.use(`${v1}`, contentPublicRouter);
app.use(`${v1}/admin`, contentAdminRouter);
app.use(`${v1}`, whatsappLinksPublicRouter);
app.use(`${v1}/admin`, whatsappLinksAdminRouter);
app.use(`${v1}`, communityPublicRouter);
app.use(`${v1}/admin`, communityAdminRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
