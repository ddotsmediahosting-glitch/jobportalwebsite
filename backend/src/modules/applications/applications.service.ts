import prisma from '../../lib/prisma';
import { AppError, ConflictError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler';
import { ApplyJobInput } from '@uaejobs/shared';
import { emailQueue, aiQueue } from '../../lib/queue';
import { applicationStatusTemplate } from '../../lib/email';
import { ApplicationStatus } from '@prisma/client';

export class ApplicationsService {
  async apply(userId: string, jobId: string, data: ApplyJobInput) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true },
    });

    if (!job) throw new NotFoundError('Job');
    if (job.status !== 'PUBLISHED') throw new AppError(400, 'This job is not accepting applications');

    const existing = await prisma.application.findUnique({
      where: { jobId_userId: { jobId, userId } },
    });
    if (existing) throw new ConflictError('You have already applied to this job');

    // Validate resume ownership
    let resumeId = data.resumeId;
    if (resumeId) {
      const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (!profile) throw new NotFoundError('Profile');

      const resume = await prisma.resume.findFirst({ where: { id: resumeId, profileId: profile.id } });
      if (!resume) throw new AppError(400, 'Invalid resume selected');
    } else {
      // Use primary resume
      const profile = await prisma.jobSeekerProfile.findUnique({ where: { userId } });
      if (profile) {
        const primary = await prisma.resume.findFirst({ where: { profileId: profile.id, isPrimary: true } });
        resumeId = primary?.id;
      }
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        userId,
        resumeId,
        coverLetter: data.coverLetter,
        answersJson: data.answers as object,
        status: 'SUBMITTED',
      },
      include: { job: { include: { employer: true } } },
    });

    // Increment apply count
    await prisma.job.update({ where: { id: jobId }, data: { applyCount: { increment: 1 } } });

    // Notify seeker
    await prisma.notification.create({
      data: {
        userId,
        type: 'APPLICATION_SUBMITTED',
        title: 'Application submitted',
        body: `Your application for ${job.title} has been submitted successfully.`,
        payloadJson: { jobId, applicationId: application.id },
      },
    });

    // Auto-screen with AI in the background. Result is stored in
    // AIScreeningResult so the employer's pipeline view can sort by fit score.
    await aiQueue.add('screen-application', {
      task: 'screen-application',
      applicationId: application.id,
    }).catch(() => null);

    return application;
  }

  async getApplicationsByJob(userId: string, jobId: string, page = 1, limit = 20, status?: ApplicationStatus) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not an employer member');

    const job = await prisma.job.findFirst({ where: { id: jobId, employerId: member.employerId } });
    if (!job) throw new NotFoundError('Job');

    const where = {
      jobId,
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          user: {
            include: {
              seekerProfile: {
                include: {
                  resumes: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          resume: true,
          screeningResult: { select: { fitScore: true, fitLabel: true, priority: true } },
        },
        orderBy: [
          { screeningResult: { fitScore: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEmployerApplications(userId: string, page = 1, limit = 20, status?: ApplicationStatus) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not an employer member');

    const where = {
      job: { employerId: member.employerId },
      ...(status ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          job: { select: { id: true, title: true, slug: true, emirate: true } },
          user: {
            include: {
              seekerProfile: {
                select: {
                  firstName: true, lastName: true, headline: true, emirate: true,
                  skills: true, avatarUrl: true,
                  resumes: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
          resume: true,
          screeningResult: { select: { fitScore: true, fitLabel: true, priority: true } },
        },
        // Default surface highest-fit candidates first; ties broken by recency.
        orderBy: [
          { screeningResult: { fitScore: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getApplicationById(userId: string, applicationId: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not an employer member');

    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { employerId: member.employerId } },
      include: {
        job: true,
        user: {
          include: {
            seekerProfile: {
              include: {
                resumes: true,
                education: true,
                experience: true,
                certifications: true,
              },
            },
          },
        },
        resume: true,
      },
    });

    if (!application) throw new NotFoundError('Application');

    // Mark as viewed if still submitted
    if (application.status === 'SUBMITTED') {
      await prisma.application.update({ where: { id: applicationId }, data: { status: 'VIEWED' } });
      application.status = 'VIEWED';
    }

    return application;
  }

  async updateApplicationStatus(userId: string, applicationId: string, status: ApplicationStatus, notes?: string, rating?: number, interviewDate?: Date) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not an employer member');

    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { employerId: member.employerId } },
      include: { job: { include: { employer: true } }, user: true },
    });

    if (!application) throw new NotFoundError('Application');

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        ...(notes !== undefined ? { notes } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(interviewDate ? { interviewDate } : {}),
      },
    });

    // Notify seeker of status change
    await prisma.notification.create({
      data: {
        userId: application.userId,
        type: 'APPLICATION_STATUS_UPDATED',
        title: 'Application status updated',
        body: `Your application for ${application.job.title} is now: ${status}`,
        payloadJson: { applicationId, jobId: application.jobId, status },
      },
    });

    // Send email notification
    if (application.user.email) {
      await emailQueue.add('application-status', {
        to: application.user.email,
        subject: `Application Update: ${application.job.title}`,
        html: applicationStatusTemplate(
          application.user.email,
          application.job.title,
          application.job.employer?.companyName || '',
          status
        ),
      });
    }

    return updated;
  }

  async updateApplicationNotes(userId: string, applicationId: string, notes: string, tags?: string[], rating?: number) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not an employer member');

    const application = await prisma.application.findFirst({
      where: { id: applicationId, job: { employerId: member.employerId } },
    });

    if (!application) throw new NotFoundError('Application');

    return prisma.application.update({
      where: { id: applicationId },
      data: {
        notes,
        ...(tags !== undefined ? { tags } : {}),
        ...(rating !== undefined ? { rating } : {}),
      },
    });
  }

  async getKanbanBoard(userId: string, jobId: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not an employer member');

    const job = await prisma.job.findFirst({ where: { id: jobId, employerId: member.employerId } });
    if (!job) throw new NotFoundError('Job');

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        user: {
          include: {
            seekerProfile: {
              select: { firstName: true, lastName: true, headline: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const columns: Record<ApplicationStatus, typeof applications> = {
      SUBMITTED: [],
      VIEWED: [],
      SHORTLISTED: [],
      INTERVIEW: [],
      OFFER: [],
      HIRED: [],
      REJECTED: [],
      WITHDRAWN: [],
    };

    for (const app of applications) {
      columns[app.status].push(app);
    }

    return { job, columns };
  }
}
