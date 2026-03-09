import prisma from '../../lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class MarketingService {
  // ── Track a social share click ──────────────────────────────────────────────
  async trackShare(data: {
    jobId?: string;
    platform: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.socialShareClick.create({ data });
  }

  // ── Share stats for a single job (employer view) ────────────────────────────
  async getJobShareStats(jobId: string) {
    const [byPlatform, recent, total] = await Promise.all([
      prisma.socialShareClick.groupBy({
        by: ['platform'],
        where: { jobId },
        _count: { _all: true },
        orderBy: { _count: { platform: 'desc' } },
      }),
      prisma.socialShareClick.findMany({
        where: { jobId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { platform: true, utmCampaign: true, createdAt: true },
      }),
      prisma.socialShareClick.count({ where: { jobId } }),
    ]);

    // Daily clicks for last 14 days
    const since = new Date();
    since.setDate(since.getDate() - 13);
    const dailyRaw = await prisma.socialShareClick.findMany({
      where: { jobId, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }
    dailyRaw.forEach((r) => {
      const key = r.createdAt.toISOString().split('T')[0];
      if (key in dailyMap) dailyMap[key]++;
    });

    return {
      total,
      byPlatform: byPlatform.map((p) => ({ platform: p.platform, count: p._count._all })),
      daily: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
      recent,
    };
  }

  // ── Global share stats for all jobs of an employer ─────────────────────────
  async getEmployerShareStats(employerId: string) {
    const jobs = await prisma.job.findMany({
      where: { employerId },
      select: { id: true, title: true, slug: true },
    });
    const jobIds = jobs.map((j) => j.id);

    const [byPlatform, byJob, total] = await Promise.all([
      prisma.socialShareClick.groupBy({
        by: ['platform'],
        where: { jobId: { in: jobIds } },
        _count: { _all: true },
        orderBy: { _count: { platform: 'desc' } },
      }),
      prisma.socialShareClick.groupBy({
        by: ['jobId'],
        where: { jobId: { in: jobIds } },
        _count: { _all: true },
        orderBy: { _count: { jobId: 'desc' } },
        take: 10,
      }),
      prisma.socialShareClick.count({ where: { jobId: { in: jobIds } } }),
    ]);

    const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

    return {
      total,
      byPlatform: byPlatform.map((p) => ({ platform: p.platform, count: p._count._all })),
      topJobs: byJob.map((b) => ({
        job: jobMap[b.jobId!] ?? { id: b.jobId, title: 'Unknown', slug: '' },
        count: b._count._all,
      })),
    };
  }

  // ── AI social post generator ────────────────────────────────────────────────
  async generateSocialPost(data: {
    jobTitle: string;
    companyName: string;
    emirate: string;
    employmentType: string;
    salaryMin?: number;
    salaryMax?: number;
    skills?: string[];
    platform: 'linkedin' | 'twitter' | 'facebook' | 'whatsapp';
    jobUrl: string;
  }) {
    const { jobTitle, companyName, emirate, employmentType, salaryMin, salaryMax, skills, platform, jobUrl } = data;

    const salaryText =
      salaryMin && salaryMax
        ? `Salary: AED ${salaryMin.toLocaleString()}–${salaryMax.toLocaleString()}/month`
        : 'Competitive salary';

    const platformGuide: Record<string, string> = {
      linkedin:
        'Write a professional LinkedIn post (150–250 words). Use 2–3 relevant hashtags at the end. Include a call-to-action. Tone: professional and engaging.',
      twitter:
        'Write a concise Twitter/X post under 280 characters including the link. Use 2–3 relevant hashtags. Tone: punchy, direct.',
      facebook:
        'Write an engaging Facebook post (100–180 words). Friendly tone, include emoji where suitable. End with a call-to-action.',
      whatsapp:
        'Write a short WhatsApp message (60–100 words). Very conversational, include the key info and the link. No hashtags.',
    };

    const prompt = `You are a recruitment marketing expert for UAE jobs. Generate a social media post for the following job opening.

Job: ${jobTitle}
Company: ${companyName}
Location: ${emirate}, UAE
Type: ${employmentType}
${salaryText}
${skills?.length ? `Key skills: ${skills.slice(0, 5).join(', ')}` : ''}
Job URL: ${jobUrl}

Platform instructions: ${platformGuide[platform]}

Return ONLY the post text, nothing else. Do not include any preamble or explanation.`;

    const response = await ai.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return { post: text, platform };
  }

  // ── Build UTM link ──────────────────────────────────────────────────────────
  buildUtmLink(params: {
    jobUrl: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent?: string;
  }) {
    const url = new URL(params.jobUrl);
    url.searchParams.set('utm_source', params.utmSource);
    url.searchParams.set('utm_medium', params.utmMedium);
    url.searchParams.set('utm_campaign', params.utmCampaign);
    if (params.utmContent) url.searchParams.set('utm_content', params.utmContent);
    return url.toString();
  }

  // ── Admin: global share analytics ─────────────────────────────────────────
  async getAdminMarketingStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [byPlatform, topJobs, total, dailyRaw] = await Promise.all([
      prisma.socialShareClick.groupBy({
        by: ['platform'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { platform: 'desc' } },
      }),
      prisma.socialShareClick.groupBy({
        by: ['jobId'],
        where: { createdAt: { gte: since }, jobId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { jobId: 'desc' } },
        take: 10,
      }),
      prisma.socialShareClick.count({ where: { createdAt: { gte: since } } }),
      prisma.socialShareClick.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, platform: true },
      }),
    ]);

    // Resolve job titles for top shared
    const jobIds = topJobs.map((j) => j.jobId).filter(Boolean) as string[];
    const jobs = await prisma.job.findMany({
      where: { id: { in: jobIds } },
      select: { id: true, title: true, slug: true, employer: { select: { companyName: true } } },
    });
    const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

    // Daily trend
    const dailyMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      dailyMap[d.toISOString().split('T')[0]] = 0;
    }
    dailyRaw.forEach((r) => {
      const key = r.createdAt.toISOString().split('T')[0];
      if (key in dailyMap) dailyMap[key]++;
    });

    // UTM campaign breakdown
    const byCampaign = await prisma.socialShareClick.groupBy({
      by: ['utmCampaign'],
      where: { createdAt: { gte: since }, utmCampaign: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { utmCampaign: 'desc' } },
      take: 10,
    });

    return {
      total,
      byPlatform: byPlatform.map((p) => ({ platform: p.platform, count: p._count._all })),
      topJobs: topJobs.map((j) => ({
        job: jobMap[j.jobId!] ?? { id: j.jobId, title: 'Unknown', slug: '' },
        count: j._count._all,
      })),
      daily: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
      byCampaign: byCampaign.map((c) => ({ campaign: c.utmCampaign || 'direct', count: c._count._all })),
    };
  }
}
