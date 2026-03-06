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
import { swaggerSpec } from './swagger';

const app = express();

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

// ── API Docs ───────────────────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'UAE Jobs Portal API',
}));

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── Public content page ────────────────────────────────────────────────────────
app.get('/api/v1/pages/:slug', async (req, res) => {
  const prisma = (await import('./lib/prisma')).default;
  const page = await prisma.contentPage.findUnique({ where: { slug: req.params.slug, isPublished: true } });
  if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
  res.json({ success: true, data: page });
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

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Error handler ──────────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
