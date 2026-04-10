import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { MarketingService } from './marketing.service';
import prisma from '../../lib/prisma';

const svc = new MarketingService();

const BASE_URL = process.env.FRONTEND_URL || 'https://jobs.ddotsmedia.com';

export class MarketingController {
  // POST /marketing/track
  async trackShare(req: AuthRequest, res: Response) {
    const { jobId, platform, utmSource, utmMedium, utmCampaign } = req.body;
    if (!platform) return res.status(400).json({ success: false, error: 'platform required' });

    // Fire-and-forget — tracking is non-critical; never return 500 for analytics failures
    svc.trackShare({
      jobId: jobId || undefined,
      platform,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    }).catch((err) => console.error('[marketing/track] failed to record share click:', err));

    res.json({ success: true });
  }

  // GET /marketing/job/:id/stats
  async getJobStats(req: AuthRequest, res: Response) {
    const stats = await svc.getJobShareStats(req.params.id);
    res.json({ success: true, data: stats });
  }

  // GET /marketing/employer/stats
  async getEmployerStats(req: AuthRequest, res: Response) {
    const employer = await prisma.employer.findUnique({
      where: { ownerUserId: req.user!.sub },
      select: { id: true },
    });
    if (!employer) return res.status(404).json({ success: false, error: 'Employer not found' });
    const stats = await svc.getEmployerShareStats(employer.id);
    res.json({ success: true, data: stats });
  }

  // POST /marketing/generate-post
  async generatePost(req: AuthRequest, res: Response) {
    const { jobId, platform } = req.body;
    if (!jobId || !platform) return res.status(400).json({ success: false, error: 'jobId and platform required' });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: { select: { companyName: true, ownerUserId: true } }, category: true },
    });
    if (!job) return res.status(404).json({ success: false, error: 'Job not found' });

    // Only employer owner can generate posts for their job
    if (job.employer.ownerUserId !== req.user!.sub && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    const jobUrl = `${BASE_URL}/jobs/${job.slug}`;
    const result = await svc.generateSocialPost({
      jobTitle: job.title,
      companyName: job.employer.companyName,
      emirate: job.emirate,
      employmentType: job.employmentType,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      skills: Array.isArray(job.skills) ? (job.skills as string[]) : undefined,
      platform,
      jobUrl,
    });

    res.json({ success: true, data: result });
  }

  // POST /marketing/utm-link
  async buildUtmLink(req: AuthRequest, res: Response) {
    const { slug, utmSource, utmMedium, utmCampaign, utmContent } = req.body;
    if (!slug || !utmSource || !utmMedium || !utmCampaign) {
      return res.status(400).json({ success: false, error: 'slug, utmSource, utmMedium, utmCampaign required' });
    }
    const jobUrl = `${BASE_URL}/jobs/${slug}`;
    const link = svc.buildUtmLink({ jobUrl, utmSource, utmMedium, utmCampaign, utmContent });
    res.json({ success: true, data: { link } });
  }

  // GET /admin/marketing?days=30
  async getAdminStats(req: AuthRequest, res: Response) {
    const days = Math.min(parseInt(req.query.days as string) || 30, 90);
    const stats = await svc.getAdminMarketingStats(days);
    res.json({ success: true, data: stats });
  }
}
