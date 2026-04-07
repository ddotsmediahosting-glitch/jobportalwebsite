import { Request, Response } from 'express';
import { JobsService } from './jobs.service';
import { AuthRequest } from '../../middleware/auth';

const service = new JobsService();

export class JobsController {
  async listPublicJobs(req: Request, res: Response) {
    const data = await service.listPublicJobs(req.query as unknown as Parameters<typeof service.listPublicJobs>[0]);
    res.json({ success: true, data });
  }

  async getJobBySlug(req: AuthRequest, res: Response) {
    const data = await service.getJobBySlug(req.params.slug, req.user?.sub);
    res.json({ success: true, data });
  }

  async createJob(req: AuthRequest, res: Response) {
    const data = await service.createJob(req.user!.sub, req.body);
    res.status(201).json({ success: true, data });
  }

  async updateJob(req: AuthRequest, res: Response) {
    const data = await service.updateJob(req.user!.sub, req.params.id, req.body);
    res.json({ success: true, data });
  }

  async deleteJob(req: AuthRequest, res: Response) {
    const data = await service.deleteJob(req.user!.sub, req.params.id);
    res.json({ success: true, ...data });
  }

  async publishJob(req: AuthRequest, res: Response) {
    const data = await service.publishJob(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }

  async pauseJob(req: AuthRequest, res: Response) {
    const data = await service.pauseJob(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }

  async closeJob(req: AuthRequest, res: Response) {
    const data = await service.closeJob(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }

  async cloneJob(req: AuthRequest, res: Response) {
    const data = await service.cloneJob(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }

  async getEmployerJobs(req: AuthRequest, res: Response) {
    const { page, limit, status } = req.query as { page?: string; limit?: string; status?: string };
    const data = await service.getEmployerJobs(req.user!.sub, Number(page) || 1, Number(limit) || 20, status);
    res.json({ success: true, data });
  }

  async getJobByShortCode(req: Request, res: Response) {
    const data = await service.getSlugByShortCode(req.params.shortCode);
    res.json({ success: true, data });
  }

  async reportJob(req: AuthRequest, res: Response) {
    const { reason, details } = req.body;
    const data = await service.reportJob(req.user!.sub, req.params.slug, reason, details);
    res.status(201).json({ success: true, data });
  }
}
