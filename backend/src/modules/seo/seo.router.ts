import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// FRONTEND_URL may be comma-separated (multiple origins); use only the first as canonical base
const BASE_URL = (process.env.FRONTEND_URL || 'https://ddotsmediajobs.com').split(',')[0].trim();

// ── Robots.txt ─────────────────────────────────────────────────────────────────
router.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.send(
    `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /employer/
Disallow: /api/

Sitemap: ${BASE_URL}/api/v1/seo/sitemap.xml
`,
  );
});

// ── Sitemap XML ────────────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  const [jobs, employers, categories] = await Promise.all([
    prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 5000,
    }),
    prisma.employer.findMany({
      where: { verificationStatus: 'APPROVED', isActive: true },
      select: { slug: true, updatedAt: true },
      take: 2000,
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/jobs', priority: '0.9', changefreq: 'hourly' },
    { url: '/companies', priority: '0.8', changefreq: 'daily' },
    { url: '/salary-insights', priority: '0.7', changefreq: 'weekly' },
    { url: '/career-advisor', priority: '0.7', changefreq: 'weekly' },
    { url: '/interview-prep', priority: '0.7', changefreq: 'weekly' },
    { url: '/cv-analyzer', priority: '0.6', changefreq: 'weekly' },
    { url: '/cv-builder', priority: '0.6', changefreq: 'weekly' },
    { url: '/pages/about', priority: '0.5', changefreq: 'monthly' },
    { url: '/pages/contact', priority: '0.5', changefreq: 'monthly' },
    { url: '/pages/pricing', priority: '0.6', changefreq: 'monthly' },
    { url: '/pages/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { url: '/pages/terms', priority: '0.3', changefreq: 'yearly' },
  ];

  const now = new Date().toISOString().split('T')[0];

  const urlEntries = [
    ...staticPages.map(
      (p) =>
        `  <url>\n    <loc>${BASE_URL}${p.url}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`,
    ),
    ...jobs.map(
      (j) =>
        `  <url>\n    <loc>${BASE_URL}/jobs/${j.slug}</loc>\n    <lastmod>${j.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
    ),
    ...employers.map(
      (e) =>
        `  <url>\n    <loc>${BASE_URL}/companies/${e.slug}</loc>\n    <lastmod>${e.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`,
    ),
    ...categories.map(
      (c) =>
        `  <url>\n    <loc>${BASE_URL}/jobs?category=${c.slug}</loc>\n    <lastmod>${c.updatedAt.toISOString().split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`,
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries.join('\n')}
</urlset>`;

  res.type('application/xml');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(xml);
});

// ── Public site settings (social links, site name, etc.) ───────────────────────
router.get('/site-settings', async (_req: Request, res: Response) => {
  const settings = await prisma.siteSettings.findMany({
    where: { key: { startsWith: 'social_' } },
  });
  const data = Object.fromEntries(settings.map((s) => [s.key, String(s.value ?? '')]));
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data });
});

// ── JSON-LD Structured Data for a specific job ──────────────────────────────────
router.get('/job-schema/:slug', async (req: Request, res: Response) => {
  const job = await prisma.job.findUnique({
    where: { slug: req.params.slug, status: 'PUBLISHED' },
    include: {
      employer: { select: { companyName: true, logoUrl: true, website: true } },
      category: { select: { name: true } },
    },
  });

  if (!job) return res.status(404).json({ success: false, error: 'Not found' });

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt?.toISOString() ?? new Date().toISOString(),
    validThrough: job.expiresAt?.toISOString(),
    employmentType: job.employmentType,
    jobLocationType: job.workMode === 'REMOTE' ? 'TELECOMMUTE' : undefined,
    url: `${BASE_URL}/jobs/${job.slug}`,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.employer.companyName,
      sameAs: job.employer.website,
      logo: job.employer.logoUrl,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || job.emirate,
        addressCountry: 'AE',
      },
    },
    ...(job.salaryMin && job.salaryMax
      ? {
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: job.salaryCurrency,
            value: {
              '@type': 'QuantitativeValue',
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: 'MONTH',
            },
          },
        }
      : {}),
    skills: (Array.isArray(job.skills) ? job.skills as string[] : []).join(', '),
    occupationalCategory: job.category.name,
  };

  res.json({ success: true, data: schema });
});

export default router;
