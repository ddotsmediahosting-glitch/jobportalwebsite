import prisma from '../../lib/prisma';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { Prisma, Emirates, WorkMode } from '@prisma/client';

export class CandidatesService {
  // Search public seeker profiles (employer feature)
  async searchCandidates(employerUserId: string, filters: {
    q?: string; emirate?: string; skills?: string; workMode?: string;
    experienceMin?: number; experienceMax?: number;
    page?: number; limit?: number;
  }) {
    const member = await prisma.employerMember.findFirst({ where: { userId: employerUserId } });
    if (!member) throw new ForbiddenError('Employer account required');

    // Check subscription allows candidate search
    const sub = await prisma.subscription.findUnique({ where: { employerId: member.employerId } });
    if (!sub?.candidateSearchEnabled) {
      throw new AppError(402, 'Candidate search requires a Premium subscription');
    }

    const { q, emirate, skills, workMode, experienceMin, experienceMax, page = 1, limit = 20 } = filters;

    const where: Prisma.JobSeekerProfileWhereInput = {
      isProfilePublic: true,
    };

    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { headline: { contains: q } },
        { desiredRole: { contains: q } },
      ];
    }

    if (emirate) where.emirate = emirate as Emirates;
    if (workMode) (where as any).desiredWorkModes = { array_contains: workMode };
    if (skills) {
      const skillList = skills.split(',').map((s) => s.trim());
      (where as any).skills = { array_contains: skillList[0] };
    }
    if (experienceMin !== undefined) where.yearsOfExperience = { gte: experienceMin };
    if (experienceMax !== undefined) {
      where.yearsOfExperience = { ...(where.yearsOfExperience as object || {}), lte: experienceMax };
    }

    const [items, total] = await Promise.all([
      prisma.jobSeekerProfile.findMany({
        where,
        select: {
          id: true, firstName: true, lastName: true, headline: true,
          emirate: true, skills: true, languages: true, avatarUrl: true,
          yearsOfExperience: true, desiredRole: true, desiredWorkModes: true,
          desiredSalaryMin: true, desiredSalaryMax: true, immediateJoiner: true,
          noticePeriod: true,
          user: { select: { id: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.jobSeekerProfile.count({ where }),
    ]);

    // Check which candidates this employer has already saved
    const seekerIds = items.map((i) => i.user.id);
    const saved = await prisma.candidateSave.findMany({
      where: { employerId: member.employerId, seekerId: { in: seekerIds } },
      select: { seekerId: true },
    });
    const savedSet = new Set(saved.map((s) => s.seekerId));

    return {
      items: items.map((p) => ({ ...p, isSaved: savedSet.has(p.user.id) })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async saveCandidate(employerUserId: string, seekerUserId: string, notes?: string, tags?: string[]) {
    const member = await prisma.employerMember.findFirst({ where: { userId: employerUserId } });
    if (!member) throw new ForbiddenError('Employer account required');

    const seeker = await prisma.user.findUnique({ where: { id: seekerUserId } });
    if (!seeker || seeker.role !== 'SEEKER') throw new NotFoundError('Candidate');

    return prisma.candidateSave.upsert({
      where: { employerId_seekerId: { employerId: member.employerId, seekerId: seekerUserId } },
      update: { notes, tags: tags || [] },
      create: { employerId: member.employerId, seekerId: seekerUserId, notes, tags: tags || [] },
    });
  }

  async removeSavedCandidate(employerUserId: string, seekerUserId: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId: employerUserId } });
    if (!member) throw new ForbiddenError('Employer account required');

    await prisma.candidateSave.deleteMany({
      where: { employerId: member.employerId, seekerId: seekerUserId },
    });
    return { message: 'Candidate removed from saved list' };
  }

  async getSavedCandidates(employerUserId: string, page = 1, limit = 20) {
    const member = await prisma.employerMember.findFirst({ where: { userId: employerUserId } });
    if (!member) throw new ForbiddenError('Employer account required');

    const [items, total] = await Promise.all([
      prisma.candidateSave.findMany({
        where: { employerId: member.employerId },
        include: {
          seeker: {
            select: {
              id: true,
              seekerProfile: {
                select: {
                  firstName: true, lastName: true, headline: true, avatarUrl: true,
                  emirate: true, skills: true, yearsOfExperience: true, desiredRole: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.candidateSave.count({ where: { employerId: member.employerId } }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Interview scheduling
  async proposeInterview(employerUserId: string, applicationId: string, data: {
    scheduledAt: string; durationMins?: number; type?: string; meetingLink?: string; location?: string; notes?: string;
  }) {
    const member = await prisma.employerMember.findFirst({ where: { userId: employerUserId } });
    if (!member) throw new ForbiddenError('Employer account required');

    const app = await prisma.application.findFirst({
      where: { id: applicationId, job: { employerId: member.employerId } },
    });
    if (!app) throw new NotFoundError('Application');

    const slot = await prisma.interviewSlot.create({
      data: {
        applicationId,
        scheduledAt: new Date(data.scheduledAt),
        durationMins: data.durationMins || 60,
        type: data.type || 'VIDEO',
        meetingLink: data.meetingLink,
        location: data.location,
        notes: data.notes,
        status: 'PROPOSED',
        proposedBy: 'EMPLOYER',
      },
    });

    // Notify seeker
    await prisma.notification.create({
      data: {
        userId: app.userId,
        type: 'INTERVIEW_PROPOSED',
        title: 'Interview Invitation',
        body: `You have been invited for an interview. Check your applications for details.`,
        payloadJson: { applicationId, slotId: slot.id },
      },
    });

    return slot;
  }

  async respondToInterview(seekerUserId: string, slotId: string, action: 'CONFIRMED' | 'CANCELLED') {
    const slot = await prisma.interviewSlot.findUnique({
      where: { id: slotId },
      include: { application: true },
    });
    if (!slot) throw new NotFoundError('Interview slot');
    if (slot.application.userId !== seekerUserId) throw new ForbiddenError('Not your interview');

    return prisma.interviewSlot.update({
      where: { id: slotId },
      data: {
        status: action,
        confirmedAt: action === 'CONFIRMED' ? new Date() : undefined,
      },
    });
  }

  async getInterviewSlots(userId: string, role: 'SEEKER' | 'EMPLOYER') {
    if (role === 'SEEKER') {
      return prisma.interviewSlot.findMany({
        where: { application: { userId } },
        include: {
          application: {
            include: {
              job: { select: { title: true, employer: { select: { companyName: true, logoUrl: true } } } },
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
      });
    }

    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Employer account required');

    return prisma.interviewSlot.findMany({
      where: { application: { job: { employerId: member.employerId } } },
      include: {
        application: {
          include: {
            user: { select: { email: true, seekerProfile: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }
}
