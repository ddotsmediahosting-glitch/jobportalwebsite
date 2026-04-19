import { Response } from 'express';
import { UsersService } from './users.service';
import { AuthRequest } from '../../middleware/auth';

const service = new UsersService();

export class UsersController {
  async getProfile(req: AuthRequest, res: Response) {
    const data = await service.getProfile(req.user!.sub);
    res.json({ success: true, data });
  }

  async updateProfile(req: AuthRequest, res: Response) {
    const data = await service.upsertProfile(req.user!.sub, req.body);
    res.json({ success: true, data });
  }

  async uploadAvatar(req: AuthRequest, res: Response) {
    const file = req.file!;
    const data = await service.uploadAvatar(req.user!.sub, file.buffer, file.originalname, file.mimetype);
    res.json({ success: true, data });
  }

  async uploadResume(req: AuthRequest, res: Response) {
    const file = req.file!;
    const data = await service.uploadResume(req.user!.sub, file.buffer, file.originalname, file.mimetype, file.size);
    res.status(201).json({ success: true, data });
  }

  async deleteResume(req: AuthRequest, res: Response) {
    const data = await service.deleteResume(req.user!.sub, req.params.resumeId);
    res.json({ success: true, ...data });
  }

  async setPrimaryResume(req: AuthRequest, res: Response) {
    const data = await service.setPrimaryResume(req.user!.sub, req.params.resumeId);
    res.json({ success: true, ...data });
  }

  async getSavedJobs(req: AuthRequest, res: Response) {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const data = await service.getSavedJobs(req.user!.sub, Number(page) || 1, Number(limit) || 20);
    res.json({ success: true, data });
  }

  async saveJob(req: AuthRequest, res: Response) {
    const data = await service.saveJob(req.user!.sub, req.params.jobId);
    res.json({ success: true, ...data });
  }

  async unsaveJob(req: AuthRequest, res: Response) {
    const data = await service.unsaveJob(req.user!.sub, req.params.jobId);
    res.json({ success: true, ...data });
  }

  async getMyApplications(req: AuthRequest, res: Response) {
    const { page, limit } = req.query as { page?: string; limit?: string };
    const data = await service.getMyApplications(req.user!.sub, Number(page) || 1, Number(limit) || 20);
    res.json({ success: true, data });
  }

  async deleteAccount(req: AuthRequest, res: Response) {
    await service.deleteAccount(req.user!.sub);
    res.json({ success: true, message: 'Account deleted' });
  }

  async getJobAlerts(req: AuthRequest, res: Response) {
    const data = await service.getJobAlerts(req.user!.sub);
    res.json({ success: true, data });
  }

  async createJobAlert(req: AuthRequest, res: Response) {
    const data = await service.createJobAlert(req.user!.sub, req.body);
    res.status(201).json({ success: true, data });
  }

  async deleteJobAlert(req: AuthRequest, res: Response) {
    const data = await service.deleteJobAlert(req.user!.sub, req.params.alertId);
    res.json({ success: true, ...data });
  }

  async getDashboard(req: AuthRequest, res: Response) {
    const data = await service.getDashboard(req.user!.sub);
    res.json({ success: true, data });
  }
}
