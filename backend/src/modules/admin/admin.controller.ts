import { Response } from 'express';
import { AdminService } from './admin.service';
import { AuthRequest } from '../../middleware/auth';
import { UserStatus, JobStatus } from '@prisma/client';
import { sendEmail, checkSmtpAvailable } from '../../lib/email';

const service = new AdminService();

export class AdminController {
  async getStats(_req: AuthRequest, res: Response) {
    res.json({ success: true, data: await service.getStats() });
  }

  // Users
  async createSubAdmin(req: AuthRequest, res: Response) {
    const { email, password } = req.body;
    const data = await service.createSubAdmin(req.user!.sub, email, password);
    res.status(201).json({ success: true, data });
  }

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
    const { page, limit, status, q, categoryId, emirate, sortBy } = req.query as Record<string, string>;
    res.json({ success: true, data: await service.listAdminJobs(+page || 1, +limit || 20, status, q, categoryId, emirate, sortBy) });
  }

  async moderateJob(req: AuthRequest, res: Response) {
    const { status, notes } = req.body;
    const data = await service.moderateJob(req.user!.sub, req.params.id, status as JobStatus, notes);
    res.json({ success: true, ...data });
  }

  async createJob(req: AuthRequest, res: Response) {
    const data = await service.createJobAsAdmin(req.user!.sub, req.body);
    res.status(201).json({ success: true, data });
  }

  async updateJob(req: AuthRequest, res: Response) {
    const data = await service.updateJob(req.user!.sub, req.params.id, req.body);
    res.json({ success: true, data });
  }

  async updateUserProfile(req: AuthRequest, res: Response) {
    const data = await service.updateUserProfile(req.user!.sub, req.params.id, req.body);
    res.json({ success: true, ...data });
  }

  async createEmployer(req: AuthRequest, res: Response) {
    const data = await service.createEmployer(req.user!.sub, req.body);
    res.status(201).json({ success: true, data });
  }

  async updateEmployer(req: AuthRequest, res: Response) {
    const data = await service.updateEmployer(req.user!.sub, req.params.id, req.body);
    res.json({ success: true, data });
  }

  async toggleJobFeatured(req: AuthRequest, res: Response) {
    const data = await service.toggleJobFeatured(req.user!.sub, req.params.id);
    res.json({ success: true, data });
  }

  async deleteJob(req: AuthRequest, res: Response) {
    const data = await service.deleteJobAdmin(req.user!.sub, req.params.id);
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

  async deleteContentPage(req: AuthRequest, res: Response) {
    const data = await service.deleteContentPage(req.params.slug);
    res.json({ success: true, ...data });
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

  // Analytics
  async getAnalytics(req: AuthRequest, res: Response) {
    const days = parseInt((req.query.days as string) || '30', 10);
    res.json({ success: true, data: await service.getAnalytics(days) });
  }

  // Bulk actions
  async bulkModerateJobs(req: AuthRequest, res: Response) {
    const { jobIds, action, notes } = req.body;
    const data = await service.bulkModerateJobs(req.user!.sub, jobIds, action, notes);
    res.json({ success: true, ...data });
  }

  async bulkUpdateUserStatus(req: AuthRequest, res: Response) {
    const { userIds, status, reason } = req.body;
    const data = await service.bulkUpdateUserStatus(req.user!.sub, userIds, status, reason);
    res.json({ success: true, ...data });
  }

  async exportUsers(req: AuthRequest, res: Response) {
    const { role, status } = req.query as Record<string, string>;
    const csv = await service.exportUsers(role, status);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(csv);
  }

  async testEmail(req: AuthRequest, res: Response) {
    const to = (req.body.to as string) || req.user!.email;
    const smtpOk = await checkSmtpAvailable();
    if (!smtpOk) {
      res.status(503).json({
        success: false,
        error: 'SMTP is not configured or unreachable. Set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file.',
      });
      return;
    }
    try {
      await sendEmail({
        to,
        subject: 'Test Email — Ddotsmedia Jobs',
        html: '<p>This is a test email from your Ddotsmedia Jobs admin panel. If you received this, SMTP is working correctly.</p>',
      });
      res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (err) {
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  }
}
