import prisma from '../../lib/prisma';
import { storage } from '../../lib/storage';
import { AppError, NotFoundError } from '../../middleware/errorHandler';
import { SeekerProfileInput } from '@uaejobs/shared';
import { aiQueue } from '../../lib/queue';

export class UsersService {
  async getProfile(userId: string) {
    const profile = await prisma.jobSeekerProfile.findUnique({
      where: { userId },
      include: {
        resumes: { orderBy: { createdAt: 'desc' } },
        education: { orderBy: { startDate: 'desc' } },
        experience: { orderBy: { startDate: 'desc' } },
        certifications: { orderBy: { issueDate: 'desc' } },
      },
    });

    if (!profile) throw new NotFoundError('Profile');
    return profile;
  }

  async upsertProfile(userId: string, data: SeekerProfileInput) {
    const profile = await prisma.jobSeekerProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return profile;
  }

  async uploadAvatar(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string) {
    const url = await storage.save(fileBuffer, fileName, mimeType, 'avatars');
    await prisma.jobSeekerProfile.update({ where: { userId }, data: { avatarUrl: url } });
    return { avatarUrl: url };
  }

  async uploadResume(userId: string, fileBuffer: Buffer, fileName: string, mimeType: string, fileSize: number) {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile');

    const url = await storage.save(fileBuffer, fileName, mimeType, 'resumes');

    const hasPrimary = await prisma.resume.count({ where: { profileId: profile.id, isPrimary: true } });

    const resume = await prisma.resume.create({
      data: {
        profileId: profile.id,
        fileName,
        fileUrl: url,
        fileSize,
        mimeType,
        isPrimary: hasPrimary === 0,
      },
    });

    // Auto-extract profile data from the CV in the background. Worker only
    // fills fields the user hasn't already set, so manual edits are preserved.
    await aiQueue.add('extract-resume', { task: 'extract-resume', resumeId: resume.id }).catch(() => null);

    return resume;
  }

  async deleteResume(userId: string, resumeId: string) {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile');

    const resume = await prisma.resume.findFirst({ where: { id: resumeId, profileId: profile.id } });
    if (!resume) throw new NotFoundError('Resume');

    await storage.delete(resume.fileUrl);
    await prisma.resume.delete({ where: { id: resumeId } });

    // Promote another resume as primary if needed
    if (resume.isPrimary) {
      const next = await prisma.resume.findFirst({ where: { profileId: profile.id }, orderBy: { createdAt: 'desc' } });
      if (next) await prisma.resume.update({ where: { id: next.id }, data: { isPrimary: true } });
    }

    return { message: 'Resume deleted' };
  }

  async setPrimaryResume(userId: string, resumeId: string) {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile');

    const resume = await prisma.resume.findFirst({ where: { id: resumeId, profileId: profile.id } });
    if (!resume) throw new NotFoundError('Resume');

    await prisma.resume.updateMany({ where: { profileId: profile.id }, data: { isPrimary: false } });
    await prisma.resume.update({ where: { id: resumeId }, data: { isPrimary: true } });

    return { message: 'Primary resume updated' };
  }

  async getSavedJobs(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.savedJob.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              employer: { select: { id: true, companyName: true, slug: true, logoUrl: true, emirate: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.savedJob.count({ where: { userId } }),
    ]);

    return { items: items.map((s) => s.job), total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async saveJob(userId: string, jobId: string) {
    await prisma.savedJob.upsert({
      where: { userId_jobId: { userId, jobId } },
      update: {},
      create: { userId, jobId },
    });
    return { message: 'Job saved' };
  }

  async unsaveJob(userId: string, jobId: string) {
    await prisma.savedJob.deleteMany({ where: { userId, jobId } });
    return { message: 'Job removed from saved' };
  }

  async withdrawApplication(userId: string, applicationId: string) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId },
      include: { job: { select: { title: true, employer: { select: { ownerUserId: true } } } } },
    });
    if (!application) throw new NotFoundError('Application');

    // Can only withdraw if employer hasn't moved you past early stages
    const allowed = ['SUBMITTED', 'VIEWED', 'SHORTLISTED'];
    if (!allowed.includes(application.status)) {
      throw new AppError(
        400,
        `Cannot withdraw an application at status ${application.status}. Contact the employer directly.`,
      );
    }
    if (application.status === 'WITHDRAWN') {
      throw new AppError(400, 'Application is already withdrawn');
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' },
    });

    // Notify employer (best-effort — don't fail withdrawal if notification creation fails)
    if (application.job.employer?.ownerUserId) {
      await prisma.notification.create({
        data: {
          userId: application.job.employer.ownerUserId,
          type: 'APPLICATION_WITHDRAWN',
          title: 'Candidate withdrew application',
          body: `A candidate has withdrawn their application for "${application.job.title}".`,
          payloadJson: { applicationId, jobId: application.jobId },
        },
      }).catch(() => null);
    }

    return updated;
  }

  async getMyApplications(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              employer: { select: { id: true, companyName: true, slug: true, logoUrl: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where: { userId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteAccount(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'Account deleted' };
  }

  // ── Job alerts ───────────────────────────────────────────────────────────────

  async getJobAlerts(userId: string) {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile');

    return prisma.jobAlert.findMany({ where: { profileId: profile.id }, orderBy: { createdAt: 'desc' } });
  }

  async createJobAlert(userId: string, data: {
    name: string;
    keywords?: string;
    categoryId?: string;
    emirate?: string;
    workMode?: string;
    salaryMin?: number;
    frequency?: string;
  }) {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile');

    return prisma.jobAlert.create({ data: { profileId: profile.id, ...data } as Parameters<typeof prisma.jobAlert.create>[0]['data'] });
  }

  async deleteJobAlert(userId: string, alertId: string) {
    const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundError('Profile');

    await prisma.jobAlert.deleteMany({ where: { id: alertId, profileId: profile.id } });
    return { message: 'Alert deleted' };
  }

  async getDashboard(userId: string) {
    const [profile, totalApplications, totalSavedJobs] = await Promise.all([
      prisma.jobSeekerProfile.findUnique({
        where: { userId },
        select: {
          firstName: true, lastName: true, headline: true, bio: true,
          emirate: true, skills: true, avatarUrl: true,
        },
      }),
      prisma.application.count({ where: { userId } }),
      prisma.savedJob.count({ where: { userId } }),
    ]);

    let profileCompleteness = 0;
    if (profile) {
      const fields = [
        profile.firstName, profile.lastName, profile.headline, profile.bio,
        profile.emirate,
        Array.isArray(profile.skills) && (profile.skills as unknown[]).length > 0,
        profile.avatarUrl,
      ];
      profileCompleteness = Math.round((fields.filter(Boolean).length / fields.length) * 100);
    }

    return { totalApplications, totalSavedJobs, profileViews: 0, profileCompleteness };
  }
}
