import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';

const router = Router();

// FRONTEND_URL may be comma-separated (multiple origins); use only the first as canonical base.
// Always force https:// — sitemap and robots must never emit http:// URLs.
const BASE_URL = (process.env.FRONTEND_URL || 'https://ddotsmediajobs.com')
  .split(',')[0]
  .trim()
  .replace(/^http:\/\//, 'https://')
  .replace(/\/$/, ''); // strip trailing slash

// ── Robots.txt ─────────────────────────────────────────────────────────────────
router.get('/robots.txt', (_req: Request, res: Response) => {
  res.type('text/plain');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(
    `User-agent: *
Allow: /

# ── Private / authenticated sections ────────────────────────────────────────
Disallow: /admin/
Disallow: /employer/
Disallow: /api/
Disallow: /dashboard/
Disallow: /seeker/
Disallow: /seeker-dashboard
Disallow: /profile
Disallow: /my-applications
Disallow: /application-tracker
Disallow: /saved-jobs
Disallow: /job-alerts
Disallow: /notifications
Disallow: /post-job
Disallow: /my-posts
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /verify-email

# ── Query-parameter URL patterns with no SEO value ──────────────────────────
# Wildcard * matches any path prefix so these rules apply site-wide
Disallow: /*?s=
Disallow: /*?search=
Disallow: /*?sort=
Disallow: /*?order=
Disallow: /*?page=
Disallow: /*?ref=
Disallow: /*?utm_
Disallow: /*?isFeatured=
Disallow: /*?isUrgent=
Disallow: /*?isEmiratization=

# ── Static assets — always crawlable ────────────────────────────────────────
Allow: /assets/
Allow: /static/

Sitemap: ${BASE_URL}/sitemap.xml
`,
  );
});

// ── Sitemap XML ────────────────────────────────────────────────────────────────
router.get('/sitemap.xml', async (_req: Request, res: Response) => {
  const [jobs, employers, categories, blogPosts] = await Promise.all([
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
      select: { id: true, slug: true, name: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    }),
  ]);

  // ── City pages — /jobs/{category}-jobs-{city} SEO URL format ──────────────
  const cityPages = [
    { emirate: 'DUBAI',          slug: 'dubai' },
    { emirate: 'ABU_DHABI',      slug: 'abu-dhabi' },
    { emirate: 'SHARJAH',        slug: 'sharjah' },
    { emirate: 'AJMAN',          slug: 'ajman' },
    { emirate: 'RAS_AL_KHAIMAH', slug: 'ras-al-khaimah' },
    { emirate: 'FUJAIRAH',       slug: 'fujairah' },
    { emirate: 'UMM_AL_QUWAIN',  slug: 'umm-al-quwain' },
  ];


  const staticPages = [
    // Core
    { url: '/',                  priority: '1.0', changefreq: 'daily'   },
    { url: '/jobs',              priority: '0.9', changefreq: 'hourly'  },
    { url: '/blog',              priority: '0.8', changefreq: 'daily'   },
    { url: '/companies',         priority: '0.8', changefreq: 'daily'   },
    // AI tools
    { url: '/salary-insights',   priority: '0.7', changefreq: 'weekly'  },
    { url: '/career-advisor',    priority: '0.7', changefreq: 'weekly'  },
    { url: '/interview-prep',    priority: '0.7', changefreq: 'weekly'  },
    { url: '/cv-analyzer',       priority: '0.6', changefreq: 'weekly'  },
    { url: '/cv-builder',        priority: '0.6', changefreq: 'weekly'  },
    // Static info pages
    { url: '/about',                 priority: '0.5', changefreq: 'monthly' },
    { url: '/contact',               priority: '0.5', changefreq: 'monthly' },
    { url: '/career-services',       priority: '0.6', changefreq: 'monthly' },
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

    // City emirate overview pages — /jobs/jobs-in-{city}
    ...cityPages.map((c) =>
      u(`${BASE_URL}/jobs?emirate=${c.emirate}`, now, 'daily', '0.85'),
    ),

    // Category × city pages — /jobs/{category-slug}-jobs-{city-slug}
    // e.g. /jobs/accounting-jobs-uae, /jobs/it-jobs-dubai
    ...categories.flatMap((cat) => [
      // UAE-wide category page
      u(`${BASE_URL}/jobs/${cat.slug}-jobs-uae`, cat.updatedAt.toISOString().split('T')[0], 'daily', '0.8'),
      // Per-city category pages for top 3 emirates
      ...['dubai', 'abu-dhabi', 'sharjah'].map((city) =>
        u(`${BASE_URL}/jobs/${cat.slug}-jobs-${city}`, cat.updatedAt.toISOString().split('T')[0], 'weekly', '0.75'),
      ),
    ]),

    // Individual job listings — canonical URL is /job/:slug (singular)
    ...jobs.map((j) =>
      u(`${BASE_URL}/job/${j.slug}`, j.updatedAt.toISOString().split('T')[0], 'weekly', '0.8'),
    ),

    // Blog posts
    ...blogPosts.map((p) =>
      u(`${BASE_URL}/blog/${p.slug}`, p.updatedAt.toISOString().split('T')[0], 'weekly', '0.7'),
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

// ── Public site settings (social links, announcement banner — NO auth required) ─
// IMPORTANT: This endpoint is called from PublicLayout on every page load.
// It must remain unauthenticated. Do NOT move it behind auth middleware.
router.get('/site-settings', async (_req: Request, res: Response) => {
  const settings = await prisma.siteSettings.findMany({
    where: {
      key: {
        in: [
          // Social links
          'social_linkedin', 'social_twitter', 'social_facebook',
          'social_instagram', 'social_youtube', 'social_whatsapp',
          // Announcement banner (used by PublicLayout)
          'announcement_active', 'announcement_text', 'announcement_type',
          'announcement_link', 'announcement_link_label',
          // Site identity
          'site_name', 'site_tagline',
        ],
      },
    },
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j = job as any;
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
      name: j.employer?.companyName,
      sameAs: j.employer?.website,
      logo: j.employer?.logoUrl,
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
    occupationalCategory: j.category?.name,
  };

  res.json({ success: true, data: schema });
});

export default router;
