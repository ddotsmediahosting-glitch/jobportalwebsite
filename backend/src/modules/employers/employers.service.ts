import prisma from '../../lib/prisma';
import { storage } from '../../lib/storage';
import { NotFoundError, ForbiddenError, AppError } from '../../middleware/errorHandler';
import { EmployerProfileInput } from '@uaejobs/shared';
import { emailQueue } from '../../lib/queue';
import bcrypt from 'bcryptjs';
import { cacheGetOrSet, cacheDel } from '../../lib/cache';

export class EmployersService {
  async getMyEmployer(userId: string) {
    const member = await prisma.employerMember.findFirst({
      where: { userId },
      include: {
        employer: {
          include: {
            subscription: true,
            members: { include: { user: { select: { id: true, email: true, role: true } } } },
            _count: { select: { jobs: true } },
          },
        },
      },
    });

    if (!member) throw new NotFoundError('Employer');
    return { employer: member.employer, role: member.role };
  }

  async getEmployerBySlug(slug: string) {
    const employer = await cacheGetOrSet(`employer:slug:${slug}`, () => prisma.employer.findUnique({
      where: { slug },
      include: {
        jobs: {
          where: { status: 'PUBLISHED' },
          include: { category: true },
          orderBy: { publishedAt: 'desc' },
          take: 10,
        },
        _count: { select: { jobs: true } },
      },
    }), 300); // 5 min

    if (!employer) throw new NotFoundError('Employer');
    return employer;
  }

  async updateProfile(userId: string, data: EmployerProfileInput) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    const result = await prisma.employer.update({
      where: { id: member.employerId },
      data,
    });
    await cacheDel(`employer:slug:${result.slug}`);
    return result;
  }

  async uploadLogo(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    const url = await storage.save(fileBuffer, fileName, mimeType, 'logos');
    await prisma.employer.update({ where: { id: member.employerId }, data: { logoUrl: url } });
    return { logoUrl: url };
  }

  async uploadCover(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    const url = await storage.save(fileBuffer, fileName, mimeType, 'covers');
    await prisma.employer.update({ where: { id: member.employerId }, data: { coverUrl: url } });
    return { coverUrl: url };
  }

  async uploadTradeLicense(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    const url = await storage.save(fileBuffer, fileName, mimeType, 'licenses');
    await prisma.employer.update({ where: { id: member.employerId }, data: { tradeLicenseUrl: url } });
    return { tradeLicenseUrl: url };
  }

  // ── Team management ──────────────────────────────────────────────────────────

  async getTeam(userId: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    return prisma.employerMember.findMany({
      where: { employerId: member.employerId },
      include: { user: { select: { id: true, email: true, status: true, lastLoginAt: true } } },
      orderBy: { invitedAt: 'asc' },
    });
  }

  async inviteTeamMember(userId: string, inviteEmail: string, role = 'RECRUITER') {
    const member = await prisma.employerMember.findFirst({
      where: { userId, role: { in: ['OWNER', 'ADMIN'] } },
      include: { employer: true },
    });
    if (!member) throw new ForbiddenError('Only owner/admin can invite members');

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email: inviteEmail } });
    if (existingUser) {
      const alreadyMember = await prisma.employerMember.findFirst({
        where: { employerId: member.employerId, userId: existingUser.id },
      });
      if (alreadyMember) throw new AppError(409, 'User is already a team member');
    }

    // Create a temporary account or send invite link
    const tempPassword = Math.random().toString(36).slice(2) + 'Aa1!';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const invitedUser = existingUser || await prisma.user.create({
      data: {
        email: inviteEmail,
        passwordHash,
        role: 'EMPLOYER',
        status: 'PENDING_VERIFICATION',
      },
    });

    await prisma.employerMember.create({
      data: { employerId: member.employerId, userId: invitedUser.id, role },
    });

    await emailQueue.add('team-invite', {
      to: inviteEmail,
      subject: `You've been invited to join ${member.employer.companyName} on UAE Jobs Portal`,
      html: `<p>You've been invited to join <strong>${member.employer.companyName}</strong>. Your temporary password: <code>${tempPassword}</code></p>`,
    });

    return { message: 'Invitation sent', userId: invitedUser.id };
  }

  async removeTeamMember(userId: string, memberId: string) {
    const myMembership = await prisma.employerMember.findFirst({
      where: { userId, role: { in: ['OWNER', 'ADMIN'] } },
    });
    if (!myMembership) throw new ForbiddenError('Insufficient permissions');

    const target = await prisma.employerMember.findFirst({
      where: { id: memberId, employerId: myMembership.employerId },
    });
    if (!target) throw new NotFoundError('Team member');
    if (target.role === 'OWNER') throw new ForbiddenError('Cannot remove owner');

    await prisma.employerMember.delete({ where: { id: memberId } });
    return { message: 'Member removed' };
  }

  // ── Analytics ────────────────────────────────────────────────────────────────

  async getAnalytics(userId: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const since7d  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000);

    const [totalJobs, publishedJobs, totalApplications, viewCount, newApps7d, newApps30d] = await Promise.all([
      prisma.job.count({ where: { employerId: member.employerId } }),
      prisma.job.count({ where: { employerId: member.employerId, status: 'PUBLISHED' } }),
      prisma.application.count({ where: { job: { employerId: member.employerId } } }),
      prisma.job
        .aggregate({ where: { employerId: member.employerId }, _sum: { viewCount: true } })
        .then((r) => r._sum.viewCount || 0),
      prisma.application.count({ where: { job: { employerId: member.employerId }, createdAt: { gte: since7d } } }),
      prisma.application.count({ where: { job: { employerId: member.employerId }, createdAt: { gte: since30d } } }),
    ]);

    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      where: { job: { employerId: member.employerId } },
      _count: true,
    });

    // Per-job stats
    const topJobs = await prisma.job.findMany({
      where: { employerId: member.employerId, status: 'PUBLISHED' },
      select: {
        id: true, title: true, slug: true, viewCount: true, applyCount: true,
        publishedAt: true, expiresAt: true,
        _count: { select: { applications: true } },
      },
      orderBy: { viewCount: 'desc' },
      take: 10,
    });

    // Daily applications (last 30 days)
    const dailyRaw = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', a."createdAt") AS day, COUNT(*) AS count
      FROM "Application" a
      JOIN "Job" j ON j.id = a."jobId"
      WHERE j."employerId" = ${member.employerId}
        AND a."createdAt" >= ${since30d}
      GROUP BY day ORDER BY day ASC
    `;

    // Conversion funnel
    const funnelStatuses = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'];
    const funnelCounts = applicationsByStatus.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalJobs,
      publishedJobs,
      totalApplications,
      totalViews: viewCount,
      newApps7d,
      newApps30d,
      applicationsByStatus,
      topJobs,
      dailyApplications: dailyRaw.map((r) => ({ day: r.day, count: Number(r.count) })),
      conversionFunnel: funnelStatuses.map((s) => ({ status: s, count: funnelCounts[s] || 0 })),
    };
  }
}
