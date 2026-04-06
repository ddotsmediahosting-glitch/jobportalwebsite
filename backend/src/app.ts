import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
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
import socialRouter from './modules/auth/social.router';
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
import marketRouter from './modules/market/market.router';
import { swaggerSpec } from './swagger';

const app = express();
app.set('trust proxy', 1);

// ── Security ───────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = Array.isArray(config.cors.origin)
      ? config.cors.origin
      : [config.cors.origin];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Parsing ────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
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
  const healthy = db === 'ok';

  // Always return 200 so Docker health check passes as long as the server
  // is running. DB/cache degraded state is reported in the body but does
  // not kill the container — Prisma will reconnect automatically.
  res.status(200).json({
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
      emiratizationJobs,
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
      prisma.job.findMany({
        where: { status: 'PUBLISHED', isEmiratization: true, employer: { verificationStatus: 'APPROVED' } },
        orderBy: { publishedAt: 'desc' },
        take: 6,
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
      emiratizationJobs,
      salaryInsights,
    };
  }, 600); // 10 min cache

  res.json({ success: true, data });
});

// ── Public contact form ────────────────────────────────────────────────────────
app.post('/api/v1/contact', async (req, res) => {
  const { name, email, phone, service, subject, message } = req.body as Record<string, string>;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    res.status(400).json({ success: false, error: 'name, email and message are required' });
    return;
  }

  const { sendEmail, checkSmtpAvailable } = await import('./lib/email');
  const smtpOk = await checkSmtpAvailable();

  const serviceLabel = service || subject || 'General Enquiry';
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'support@ddotsmediajobs.com';

  if (smtpOk) {
    // Notify admin
    await sendEmail({
      to: adminEmail,
      subject: `[Career Services] ${serviceLabel} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#1e40af">New Career Services Enquiry</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;color:#374151;width:120px">Service</td><td style="padding:8px;color:#1d4ed8;font-weight:600">${serviceLabel}</td></tr>
            <tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold;color:#374151">Name</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#374151">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
            ${phone ? `<tr style="background:#f9fafb"><td style="padding:8px;font-weight:bold;color:#374151">Phone</td><td style="padding:8px">${phone}</td></tr>` : ''}
            <tr ${phone ? '' : 'style="background:#f9fafb"'}><td style="padding:8px;font-weight:bold;color:#374151;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${message}</td></tr>
          </table>
          <p style="margin-top:16px;color:#6b7280;font-size:13px">Reply directly to this email to respond to ${name}.</p>
        </div>`,
    });

    // Confirmation to user
    await sendEmail({
      to: email,
      subject: `We received your enquiry — DdotsmediaJobs`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h2 style="color:#1e40af">Thanks, ${name}!</h2>
          <p>We've received your <strong>${serviceLabel}</strong> enquiry and will get back to you within <strong>24 hours</strong> (Sunday–Thursday).</p>
          <p>Your message:</p>
          <blockquote style="border-left:3px solid #3b82f6;margin:0;padding:12px 16px;background:#eff6ff;border-radius:4px;color:#1e3a5f">${message}</blockquote>
          <p style="margin-top:20px">Need urgent help? WhatsApp us at <a href="https://wa.me/971509379212">+971 50 937 9212</a></p>
          <p style="color:#6b7280;font-size:13px;margin-top:20px">— The DdotsmediaJobs Team</p>
        </div>`,
    });
  }

  res.json({ success: true, message: 'Thank you! We\'ll get back to you within 24 hours.' });
});

// ── Routes ─────────────────────────────────────────────────────────────────────
const v1 = '/api/v1';

app.use(`${v1}/auth`, authRouter);
app.use(`${v1}/auth/social`, socialRouter);
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
app.use(`${v1}/market`, marketRouter);

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
