import { Response } from 'express';
import { AdminService } from './admin.service';
import { AuthRequest } from '../../middleware/auth';
import { UserStatus, JobStatus } from '@prisma/client';

const service = new AdminService();

export class AdminController {
  async getStats(_req: AuthRequest, res: Response) {
    res.json({ success: true, data: await service.getStats() });
  }

  // Users
  async listUsers(req: AuthRequest, res: Response) {
    const { page, limit, role, status, q } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listUsers(+page || 1, +limit || 20, role, status, q) });
  }

  async getUserDetail(req: AuthRequest, res: Response) {
    res.json({ success: true, data: await service.getUserDetail(req.params.id) });
  }

  async updateUserStatus(req: AuthRequest, res: Response) {
    const { status, reason } = req.body;
    const data = await service.updateUserStatus(req.user!.sub, req.params.id, status as UserStatus, reason);
    res.json({ success: true, ...data });
  }

  async resetUserPassword(req: AuthRequest, res: Response) {
    const { newPassword } = req.body;
    const data = await service.resetUserPassword(req.user!.sub, req.params.id, newPassword);
    res.json({ success: true, ...data });
  }

  async deleteUser(req: AuthRequest, res: Response) {
    const data = await service.deleteUser(req.user!.sub, req.params.id);
    res.json({ success: true, ...data });
  }

  // Employers
  async listEmployers(req: AuthRequest, res: Response) {
    const { page, limit, verificationStatus, q } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listEmployers(+page || 1, +limit || 20, verificationStatus, q) });
  }

  async verifyEmployer(req: AuthRequest, res: Response) {
    const { status, notes } = req.body;
    const data = await service.verifyEmployer(req.user!.sub, req.params.id, status, notes);
    res.json({ success: true, ...data });
  }

  // Jobs
  async listJobs(req: AuthRequest, res: Response) {
    const { page, limit, status, q } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listAdminJobs(+page || 1, +limit || 20, status, q) });
  }

  async moderateJob(req: AuthRequest, res: Response) {
    const { status, notes } = req.body;
    const data = await service.moderateJob(req.user!.sub, req.params.id, status as JobStatus, notes);
    res.json({ success: true, ...data });
  }

  // Reports
  async listReports(req: AuthRequest, res: Response) {
    const { page, limit, status } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listReports(+page || 1, +limit || 20, status) });
  }

  async resolveReport(req: AuthRequest, res: Response) {
    const { status, note } = req.body;
    const data = await service.resolveReport(req.user!.sub, req.params.id, status, note);
    res.json({ success: true, ...data });
  }

  // Audit logs
  async listAuditLogs(req: AuthRequest, res: Response) {
    const { page, limit, actorId, action } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listAuditLogs(+page || 1, +limit || 50, actorId, action) });
  }

  // Settings
  async getSettings(_req: AuthRequest, res: Response) {
    res.json({ success: true, data: await service.getSettings() });
  }

  async updateSetting(req: AuthRequest, res: Response) {
    const { key } = req.params;
    const { value } = req.body;
    const data = await service.updateSetting(key, value);
    res.json({ success: true, data });
  }

  // Content pages
  async listContentPages(_req: AuthRequest, res: Response) {
    res.json({ success: true, data: await service.listContentPages() });
  }

  async getContentPage(req: AuthRequest, res: Response) {
    res.json({ success: true, data: await service.getContentPage(req.params.slug) });
  }

  async upsertContentPage(req: AuthRequest, res: Response) {
    const { slug, title, content, isPublished } = req.body;
    const data = await service.upsertContentPage(slug, title, content, isPublished);
    res.json({ success: true, data });
  }

  // Subscriptions
  async listSubscriptions(req: AuthRequest, res: Response) {
    const { page, limit } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listSubscriptions(+page || 1, +limit || 20) });
  }

  async overrideSubscription(req: AuthRequest, res: Response) {
    const data = await service.overrideSubscription(req.params.employerId, req.body);
    res.json({ success: true, data });
  }
}
