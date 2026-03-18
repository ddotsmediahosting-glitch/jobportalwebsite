import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// FRONTEND_URL may be comma-separated (multiple origins); use only the first as canonical base
const BASE_URL = (process.env.FRONTEND_URL || 'https://ddotsmediajobs.com').split(',')[0].trim();

// ── Robots.txt ─────────────────────────────────────────────────────────────────
router.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(
    `User-agent: *
Allow: /

# Private / dynamic sections — no crawl value
Disallow: /admin/
Disallow: /employer/
Disallow: /api/
Disallow: /dashboard/
Disallow: /seeker/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email
Disallow: /?s=
Disallow: /search?

# Static assets — crawlable (CDN/build artefacts)
Allow: /assets/
Allow: /static/

Sitemap: ${BASE_URL}/sitemap.xml
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

  // ── City pages (emirate filter URLs) ──────────────────────────────────────
  const cityPages = [
    { emirate: 'DUBAI',          slug: 'dubai' },
    { emirate: 'ABU_DHABI',      slug: 'abu-dhabi' },
    { emirate: 'SHARJAH',        slug: 'sharjah' },
    { emirate: 'AJMAN',          slug: 'ajman' },
    { emirate: 'RAS_AL_KHAIMAH', slug: 'ras-al-khaimah' },
    { emirate: 'FUJAIRAH',       slug: 'fujairah' },
    { emirate: 'UMM_AL_QUWAIN',  slug: 'umm-al-quwain' },
  ];

  // ── Fixed category keyword pages ──────────────────────────────────────────
  const fixedCategoryPages = [
    'sales', 'it-technology', 'engineering', 'healthcare', 'hospitality',
    'finance-accounting', 'construction', 'logistics', 'marketing',
    'fresher-entry-level', 'part-time', 'remote', 'visa-sponsored',
  ];

  const staticPages = [
    // Core
    { url: '/',                  priority: '1.0', changefreq: 'daily'   },
    { url: '/jobs',              priority: '0.9', changefreq: 'hourly'  },
    { url: '/companies',         priority: '0.8', changefreq: 'daily'   },
    // AI tools
    { url: '/salary-insights',   priority: '0.7', changefreq: 'weekly'  },
    { url: '/career-advisor',    priority: '0.7', changefreq: 'weekly'  },
    { url: '/interview-prep',    priority: '0.7', changefreq: 'weekly'  },
    { url: '/cv-analyzer',       priority: '0.6', changefreq: 'weekly'  },
    { url: '/cv-builder',        priority: '0.6', changefreq: 'weekly'  },
    // Static info pages
    { url: '/pages/about',           priority: '0.5', changefreq: 'monthly' },
    { url: '/pages/contact',         priority: '0.5', changefreq: 'monthly' },
    { url: '/pages/pricing',         priority: '0.6', changefreq: 'monthly' },
    { url: '/pages/faq',             priority: '0.5', changefreq: 'monthly' },
    { url: '/pages/privacy-policy',  priority: '0.3', changefreq: 'yearly'  },
    { url: '/pages/terms',           priority: '0.3', changefreq: 'yearly'  },
  ];

  const now = new Date().toISOString().split('T')[0];

  const u = (loc: string, lastmod: string, changefreq: string, priority: string) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const urlEntries = [
    // Static pages
    ...staticPages.map((p) => u(`${BASE_URL}${p.url}`, now, p.changefreq, p.priority)),

    // City / emirate pages — high-value SEO targets
    ...cityPages.map((c) =>
      u(`${BASE_URL}/jobs?emirate=${c.emirate}`, now, 'daily', '0.85'),
    ),

    // Fixed keyword category pages
    ...fixedCategoryPages.map((slug) =>
      u(`${BASE_URL}/jobs?q=${slug}`, now, 'daily', '0.75'),
    ),

    // Dynamic DB categories
    ...categories.map((c) =>
      u(`${BASE_URL}/jobs?categoryId=${c.id}`, c.updatedAt.toISOString().split('T')[0], 'daily', '0.75'),
    ),

    // Individual job listings
    ...jobs.map((j) =>
      u(`${BASE_URL}/jobs/${j.slug}`, j.updatedAt.toISOString().split('T')[0], 'weekly', '0.8'),
    ),

    // Company profiles
    ...employers.map((e) =>
      u(`${BASE_URL}/companies/${e.slug}`, e.updatedAt.toISOString().split('T')[0], 'weekly', '0.6'),
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
