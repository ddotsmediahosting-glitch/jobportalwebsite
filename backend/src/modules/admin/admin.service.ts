import prisma from '../../lib/prisma';
import { NotFoundError, AppError } from '../../middleware/errorHandler';
import { UserStatus, VerificationStatus, JobStatus, ReportStatus, Prisma, Emirates, WorkMode, EmploymentType } from '@prisma/client';
import { auditLog } from '../../middleware/rbac';
import bcrypt from 'bcryptjs';
import { cacheDel } from '../../lib/cache';

const HOME_CACHE_KEY = 'home:data';

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
      pendingDiscussions,
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
      prisma.discussion.count({ where: { status: 'PENDING' } }),
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
      pendingVerifications, pendingReports, pendingDiscussions,
      recentUsers, recentJobs,
    };
  }

  // ── Users ─────────────────────────────────────────────────────────────────────

  async listUsers(page = 1, limit = 20, role?: string, status?: string, q?: string) {
    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role as 'SEEKER' | 'EMPLOYER' | 'ADMIN' | 'SUB_ADMIN';
    if (status) where.status = status as UserStatus;
    if (q) where.OR = [
      { email: { contains: q } },
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

  async createSubAdmin(actorId: string, email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'Email already in use');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'SUB_ADMIN', status: 'ACTIVE', verifiedAt: new Date() },
      select: { id: true, email: true, role: true, status: true, createdAt: true },
    });
    await auditLog(actorId, 'ADMIN', 'SUB_ADMIN_CREATED', 'User', user.id, { email });
    return user;
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
    if (q) where.companyName = { contains: q };

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

  async listAdminJobs(page = 1, limit = 20, status?: string, q?: string, categoryId?: string, emirate?: string, sortBy?: string) {
    const where: Prisma.JobWhereInput = {};

    if (status) where.status = status as JobStatus;
    if (q) where.OR = [
      { title: { contains: q } },
      { employer: { companyName: { contains: q } } },
    ];
    if (categoryId) where.categoryId = categoryId;
    if (emirate) where.emirate = emirate as Emirates;

    const orderBy: Prisma.JobOrderByWithRelationInput =
      sortBy === 'oldest'      ? { createdAt: 'asc' }
      : sortBy === 'published' ? { publishedAt: 'desc' }
      : sortBy === 'views'     ? { viewCount: 'desc' }
      : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: { select: { id: true, companyName: true } },
          category: { select: { id: true, name: true } },
          _count: { select: { applications: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async moderateJob(actorId: string, jobId: string, status: JobStatus, notes?: string) {
    const existing = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existing) throw new NotFoundError('Job');

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        moderationNotes: notes,
        ...(status === 'PUBLISHED' ? {
          publishedAt: existing.publishedAt || new Date(),
          expiresAt: existing.expiresAt && existing.expiresAt > new Date() ? existing.expiresAt : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        } : {}),
      },
    });

    // Notify employer
    await prisma.notification.create({
      data: {
        userId: (await prisma.employer.findUnique({ where: { id: existing.employerId } }))!.ownerUserId,
        type: `JOB_${status}`,
        title: `Job ${status === 'PUBLISHED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Updated'}`,
        body: `Your job "${existing.title}" has been ${status.toLowerCase()}.${notes ? ` Note: ${notes}` : ''}`,
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

  async deleteContentPage(slug: string) {
    const page = await prisma.contentPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundError('Page');
    await prisma.contentPage.delete({ where: { slug } });
    return { message: 'Page deleted' };
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

  // ── Analytics ──────────────────────────────────────────────────────────────────

  async getAnalytics(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Daily new users
    const usersRaw = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
      FROM "User"
      WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day ASC
    `;

    // Daily new jobs
    const jobsRaw = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
      FROM "Job"
      WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day ASC
    `;

    // Daily new applications
    const appsRaw = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS count
      FROM "Application"
      WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day ASC
    `;

    // Job status distribution
    const jobStatusRaw = await prisma.$queryRaw<{ status: string; count: bigint }[]>`
      SELECT status, COUNT(*) AS count FROM "Job" GROUP BY status
    `;

    // Applications by emirate (from job location)
    const byEmirateRaw = await prisma.$queryRaw<{ location: string; count: bigint }[]>`
      SELECT j.location, COUNT(a.id) AS count
      FROM "Application" a
      JOIN "Job" j ON j.id = a."jobId"
      WHERE a."createdAt" >= ${since}
      GROUP BY j.location ORDER BY count DESC LIMIT 10
    `;

    // Trend: compare last N days vs previous N days
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);

    const [currUsers, prevUsers, currJobs, prevJobs, currApps, prevApps] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.job.count({ where: { createdAt: { gte: since } } }),
      prisma.job.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
      prisma.application.count({ where: { createdAt: { gte: since } } }),
      prisma.application.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    ]);

    const trend = (curr: number, prev: number) =>
      prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);

    return {
      days,
      dailyUsers: usersRaw.map((r) => ({ day: r.day, count: Number(r.count) })),
      dailyJobs: jobsRaw.map((r) => ({ day: r.day, count: Number(r.count) })),
      dailyApplications: appsRaw.map((r) => ({ day: r.day, count: Number(r.count) })),
      jobStatusDistribution: jobStatusRaw.map((r) => ({ status: r.status, count: Number(r.count) })),
      applicationsByEmirate: byEmirateRaw.map((r) => ({ location: r.location, count: Number(r.count) })),
      trends: {
        users: { current: currUsers, previous: prevUsers, pct: trend(currUsers, prevUsers) },
        jobs: { current: currJobs, previous: prevJobs, pct: trend(currJobs, prevJobs) },
        applications: { current: currApps, previous: prevApps, pct: trend(currApps, prevApps) },
      },
    };
  }

  async createJobAsAdmin(actorId: string, data: {
    employerId: string; categoryId: string; title: string; description: string;
    emirate: string; workMode?: string; employmentType?: string; location?: string;
    salaryMin?: number; salaryMax?: number; skills?: string[]; isFeatured?: boolean;
  }) {
    const employer = await prisma.employer.findUnique({ where: { id: data.employerId } });
    if (!employer) throw new NotFoundError('Employer');
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new NotFoundError('Category');

    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const job = await prisma.job.create({
      data: {
        employerId: data.employerId,
        categoryId: data.categoryId,
        title: data.title,
        slug,
        description: data.description,
        emirate: data.emirate as Emirates,
        location: data.location,
        workMode: (data.workMode || 'ONSITE') as WorkMode,
        employmentType: (data.employmentType || 'FULL_TIME') as EmploymentType,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        skills: Array.isArray(data.skills) ? data.skills : [],
        status: 'PUBLISHED',
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isFeatured: data.isFeatured || false,
      },
    });

    await auditLog(actorId, 'ADMIN', 'JOB_CREATED', 'Job', job.id, { title: data.title, employer: employer.companyName });
    await cacheDel(HOME_CACHE_KEY);
    return job;
  }

  async updateJob(actorId: string, jobId: string, data: {
    title?: string; description?: string; location?: string; emirate?: string;
    salaryMin?: number | null; salaryMax?: number | null; employmentType?: string;
    workMode?: string; isFeatured?: boolean; isEmiratization?: boolean; isUrgent?: boolean;
  }) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');
    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.emirate !== undefined && { emirate: data.emirate as Emirates }),
        ...(data.salaryMin !== undefined && { salaryMin: data.salaryMin }),
        ...(data.salaryMax !== undefined && { salaryMax: data.salaryMax }),
        ...(data.employmentType !== undefined && { employmentType: data.employmentType as EmploymentType }),
        ...(data.workMode !== undefined && { workMode: data.workMode as WorkMode }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.isEmiratization !== undefined && { isEmiratization: data.isEmiratization }),
        ...(data.isUrgent !== undefined && { isUrgent: data.isUrgent }),
      },
    });
    await auditLog(actorId, 'ADMIN', 'JOB_UPDATED', 'Job', jobId, { changes: data });
    await cacheDel(HOME_CACHE_KEY);
    return updated;
  }

  async updateUserProfile(actorId: string, userId: string, data: {
    email?: string; role?: string; phone?: string; firstName?: string; lastName?: string;
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { seekerProfile: true } });
    if (!user) throw new NotFoundError('User');
    if (user.role === 'ADMIN' && actorId !== userId) throw new AppError(403, 'Cannot modify admin users');

    if (data.email || data.role || data.phone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(data.email && { email: data.email }),
          ...(data.role && { role: data.role as 'SEEKER' | 'EMPLOYER' | 'ADMIN' | 'SUB_ADMIN' }),
          ...(data.phone !== undefined && { phone: data.phone }),
        },
      });
    }
    if ((data.firstName || data.lastName) && user.seekerProfile) {
      await prisma.seekerProfile.update({
        where: { userId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
        },
      });
    }
    await auditLog(actorId, 'ADMIN', 'USER_PROFILE_UPDATED', 'User', userId, { changes: data });
    return { message: 'User updated' };
  }

  async updateEmployer(actorId: string, employerId: string, data: {
    companyName?: string; industry?: string; description?: string; website?: string;
    emirate?: string; logoUrl?: string; size?: string;
  }) {
    const employer = await prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) throw new NotFoundError('Employer');
    const updated = await prisma.employer.update({
      where: { id: employerId },
      data: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.industry !== undefined && { industry: data.industry }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.emirate !== undefined && { emirate: data.emirate as Emirates }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.size !== undefined && { size: data.size }),
      },
    });
    await auditLog(actorId, 'ADMIN', 'EMPLOYER_UPDATED', 'Employer', employerId, { changes: data });
    return updated;
  }

  async toggleJobFeatured(actorId: string, jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');
    const isFeatured = !job.isFeatured;
    await prisma.job.update({
      where: { id: jobId },
      data: {
        isFeatured,
        featuredUntil: isFeatured ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });
    await auditLog(actorId, 'ADMIN', isFeatured ? 'JOB_FEATURED' : 'JOB_UNFEATURED', 'Job', jobId);
    await cacheDel(HOME_CACHE_KEY);
    return { isFeatured };
  }

  async deleteJobAdmin(actorId: string, jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');
    await prisma.job.delete({ where: { id: jobId } });
    await auditLog(actorId, 'ADMIN', 'JOB_DELETED', 'Job', jobId, { title: job.title });
    await cacheDel(HOME_CACHE_KEY);
    return { message: 'Job deleted' };
  }

  // ── Bulk actions ───────────────────────────────────────────────────────────────

  async bulkModerateJobs(actorId: string, jobIds: string[], action: 'PUBLISHED' | 'REJECTED', notes?: string) {
    const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } } });
    if (jobs.length === 0) throw new AppError(400, 'No valid jobs found');

    await prisma.job.updateMany({
      where: { id: { in: jobIds } },
      data: {
        status: action as JobStatus,
        moderationNotes: notes,
        ...(action === 'PUBLISHED' ? { publishedAt: new Date(), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } : {}),
      },
    });

    // Notify each employer
    const employerIds = [...new Set(jobs.map((j) => j.employerId))];
    const employers = await prisma.employer.findMany({ where: { id: { in: employerIds } } });
    const ownerMap = Object.fromEntries(employers.map((e) => [e.id, e.ownerUserId]));

    await prisma.notification.createMany({
      data: jobs.map((job) => ({
        userId: ownerMap[job.employerId],
        type: `JOB_${action}`,
        title: `Job ${action === 'PUBLISHED' ? 'Approved' : 'Rejected'}`,
        body: `Your job "${job.title}" has been ${action.toLowerCase()}.${notes ? ` Note: ${notes}` : ''}`,
      })),
      skipDuplicates: true,
    });

    await auditLog(actorId, 'ADMIN', `BULK_JOB_${action}`, 'Job', jobIds.join(','), { count: jobIds.length, notes });

    return { message: `${jobs.length} jobs ${action.toLowerCase()}`, count: jobs.length };
  }

  async bulkUpdateUserStatus(actorId: string, userIds: string[], status: UserStatus, reason?: string) {
    const users = await prisma.user.findMany({ where: { id: { in: userIds }, role: { not: 'ADMIN' } } });
    if (users.length === 0) throw new AppError(400, 'No valid users found');

    const validIds = users.map((u) => u.id);
    await prisma.user.updateMany({ where: { id: { in: validIds } }, data: { status } });
    await auditLog(actorId, 'ADMIN', `BULK_USER_STATUS_${status}`, 'User', validIds.join(','), { count: validIds.length, reason });

    return { message: `${validIds.length} users ${status.toLowerCase()}`, count: validIds.length };
  }

  async exportUsers(role?: string, status?: string) {
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as 'SEEKER' | 'EMPLOYER' | 'ADMIN' | 'SUB_ADMIN';
    if (status) where.status = status as UserStatus;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, email: true, phone: true, role: true, status: true,
        createdAt: true, lastLoginAt: true, verifiedAt: true,
        seekerProfile: { select: { firstName: true, lastName: true } },
        ownedEmployer: { select: { companyName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const rows = [
      ['ID', 'Email', 'Name', 'Company', 'Role', 'Status', 'Verified', 'Last Login', 'Joined'].join(','),
      ...users.map((u) => [
        u.id,
        u.email,
        u.seekerProfile ? `${u.seekerProfile.firstName} ${u.seekerProfile.lastName}` : '',
        u.ownedEmployer?.companyName || '',
        u.role,
        u.status,
        u.verifiedAt ? u.verifiedAt.toISOString() : '',
        u.lastLoginAt ? u.lastLoginAt.toISOString() : '',
        u.createdAt.toISOString(),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return rows;
  }
}
