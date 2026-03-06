import prisma from '../../lib/prisma';
import { NotFoundError, AppError } from '../../middleware/errorHandler';
import { UserStatus, VerificationStatus, JobStatus, ReportStatus, Prisma } from '@prisma/client';
import { auditLog } from '../../middleware/rbac';
import bcrypt from 'bcryptjs';

export class AdminService {
  // ── Dashboard stats ───────────────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      totalSeekers,
      totalEmployers,
      totalJobs,
      publishedJobs,
      pendingJobs,
      totalApplications,
      pendingVerifications,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'SEEKER' } }),
      prisma.user.count({ where: { role: 'EMPLOYER' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.job.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.application.count(),
      prisma.employer.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });

    const recentJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { employer: { select: { companyName: true } } },
    });

    return {
      totalUsers, totalSeekers, totalEmployers, totalJobs,
      publishedJobs, pendingJobs, totalApplications,
      pendingVerifications, pendingReports,
      recentUsers, recentJobs,
    };
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async listUsers(page = 1, limit = 20, role?: string, status?: string, q?: string) {
    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role as 'SEEKER' | 'EMPLOYER' | 'ADMIN' | 'SUB_ADMIN';
    if (status) where.status = status as UserStatus;
    if (q) where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, phone: true, role: true, status: true,
          verifiedAt: true, lastLoginAt: true, createdAt: true,
          seekerProfile: { select: { firstName: true, lastName: true } },
          ownedEmployer: { select: { companyName: true, verificationStatus: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        seekerProfile: { include: { resumes: true } },
        ownedEmployer: { include: { subscription: true, members: true } },
        applications: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) throw new NotFoundError('User');
    return user;
  }

  async updateUserStatus(actorId: string, userId: string, status: UserStatus, reason?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    await prisma.user.update({ where: { id: userId }, data: { status } });
    await auditLog(actorId, 'ADMIN', `USER_STATUS_CHANGED_${status}`, 'User', userId, { reason, previousStatus: user.status });

    return { message: `User ${status.toLowerCase()}` };
  }

  async resetUserPassword(actorId: string, userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await auditLog(actorId, 'ADMIN', 'USER_PASSWORD_RESET', 'User', userId);

    return { message: 'Password reset' };
  }

  async deleteUser(actorId: string, userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');
    if (user.role === 'ADMIN') throw new AppError(403, 'Cannot delete admin users');

    await prisma.user.delete({ where: { id: userId } });
    await auditLog(actorId, 'ADMIN', 'USER_DELETED', 'User', userId, { email: user.email });

    return { message: 'User deleted' };
  }

  // ── Employers ─────────────────────────────────────────────────────────────────

  async listEmployers(page = 1, limit = 20, verificationStatus?: string, q?: string) {
    const where: Prisma.EmployerWhereInput = {};

    if (verificationStatus) where.verificationStatus = verificationStatus as VerificationStatus;
    if (q) where.companyName = { contains: q, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.employer.findMany({
        where,
        include: {
          owner: { select: { id: true, email: true, status: true } },
          subscription: true,
          _count: { select: { jobs: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employer.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async verifyEmployer(actorId: string, employerId: string, status: 'APPROVED' | 'REJECTED', notes?: string) {
    const employer = await prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) throw new NotFoundError('Employer');

    await prisma.employer.update({
      where: { id: employerId },
      data: {
        verificationStatus: status as VerificationStatus,
        verifiedBy: actorId,
        verifiedAt: status === 'APPROVED' ? new Date() : undefined,
        verificationNotes: notes,
      },
    });

    // Notify employer owner
    await prisma.notification.create({
      data: {
        userId: employer.ownerUserId,
        type: `EMPLOYER_${status}`,
        title: `Company ${status === 'APPROVED' ? 'Verified' : 'Verification Rejected'}`,
        body: status === 'APPROVED'
          ? 'Your company has been verified. You can now post jobs!'
          : `Your verification was rejected. Reason: ${notes || 'Not specified'}`,
      },
    });

    await auditLog(actorId, 'ADMIN', `EMPLOYER_${status}`, 'Employer', employerId, { notes });

    return { message: `Employer ${status.toLowerCase()}` };
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────────

  async listAdminJobs(page = 1, limit = 20, status?: string, q?: string) {
    const where: Prisma.JobWhereInput = {};

    if (status) where.status = status as JobStatus;
    if (q) where.title = { contains: q, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: { select: { id: true, companyName: true } },
          category: { select: { name: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async moderateJob(actorId: string, jobId: string, status: JobStatus, notes?: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        moderationNotes: notes,
        ...(status === 'PUBLISHED' ? { publishedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } : {}),
      },
    });

    // Notify employer
    await prisma.notification.create({
      data: {
        userId: (await prisma.employer.findUnique({ where: { id: job.employerId } }))!.ownerUserId,
        type: `JOB_${status}`,
        title: `Job ${status === 'PUBLISHED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Updated'}`,
        body: `Your job "${job.title}" has been ${status.toLowerCase()}.${notes ? ` Note: ${notes}` : ''}`,
      },
    });

    await auditLog(actorId, 'ADMIN', `JOB_${status}`, 'Job', jobId, { notes });

    return { message: `Job ${status.toLowerCase()}` };
  }

  // ── Reports ───────────────────────────────────────────────────────────────────

  async listReports(page = 1, limit = 20, status?: string) {
    const where = status ? { status: status as ReportStatus } : {};

    const [items, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true } },
          job: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resolveReport(actorId: string, reportId: string, status: 'RESOLVED' | 'DISMISSED', note?: string) {
    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundError('Report');

    await prisma.report.update({
      where: { id: reportId },
      data: { status: status as ReportStatus, resolvedBy: actorId, resolvedAt: new Date(), resolutionNote: note },
    });

    await auditLog(actorId, 'ADMIN', `REPORT_${status}`, 'Report', reportId, { note });

    return { message: `Report ${status.toLowerCase()}` };
  }

  // ── Audit logs ────────────────────────────────────────────────────────────────

  async listAuditLogs(page = 1, limit = 50, actorId?: string, action?: string) {
    const where: Prisma.AuditLogWhereInput = {};
    if (actorId) where.actorUserId = actorId;
    if (action) where.action = { contains: action };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Site settings ──────────────────────────────────────────────────────────────

  async getSettings() {
    const settings = await prisma.siteSettings.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  async updateSetting(key: string, value: unknown) {
    return prisma.siteSettings.upsert({
      where: { key },
      update: { value: value as Parameters<typeof prisma.siteSettings.upsert>[0]['update']['value'] },
      create: { key, value: value as Parameters<typeof prisma.siteSettings.upsert>[0]['create']['value'] },
    });
  }

  // ── Content pages ──────────────────────────────────────────────────────────────

  async listContentPages() {
    return prisma.contentPage.findMany({ orderBy: { slug: 'asc' } });
  }

  async upsertContentPage(slug: string, title: string, content: string, isPublished = true) {
    return prisma.contentPage.upsert({
      where: { slug },
      update: { title, content, isPublished },
      create: { slug, title, content, isPublished },
    });
  }

  async getContentPage(slug: string) {
    const page = await prisma.contentPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundError('Page');
    return page;
  }

  // ── Subscriptions overview ─────────────────────────────────────────────────────

  async listSubscriptions(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.subscription.findMany({
        include: { employer: { select: { companyName: true, slug: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscription.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async overrideSubscription(employerId: string, data: Partial<{
    plan: string; jobPostsLimit: number; featuredPostsLimit: number; candidateSearchEnabled: boolean;
  }>) {
    return prisma.subscription.update({
      where: { employerId },
      data: data as Parameters<typeof prisma.subscription.update>[0]['data'],
    });
  }
}
