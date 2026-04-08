import prisma from '../../lib/prisma';
import { AppError, ForbiddenError, NotFoundError } from '../../middleware/errorHandler';
import { CreateJobInput, UpdateJobInput, JobFiltersInput } from '@uaejobs/shared';
import slugify from 'slugify';
import { JobStatus, Prisma } from '@prisma/client';
import { cacheGetOrSet, cacheDel } from '../../lib/cache';

const JOB_INCLUDE = {
  employer: { select: { id: true, companyName: true, slug: true, logoUrl: true, emirate: true, verificationStatus: true } },
  category: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
  tags: { include: { tag: true } },
  screeningQuestions: { orderBy: { sortOrder: 'asc' as const } },
  _count: { select: { applications: true } },
};

export class JobsService {
  async listPublicJobs(filters: JobFiltersInput) {
    const {
      q, categoryId, emirate, workMode, employmentType, visaStatus,
      salaryMin, salaryMax, experienceMin, level, isFeatured, isEmiratization,
      page, limit, sortBy,
    } = filters;

    const where: Prisma.JobWhereInput = {
      status: 'PUBLISHED',
      employer: { verificationStatus: 'APPROVED' },
    };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (categoryId) {
      // Include children of this category
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: true },
      });
      if (cat) {
        const ids = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: ids };
      }
    }

    if (emirate) where.emirate = emirate;
    if (workMode) where.workMode = workMode;
    if (employmentType) where.employmentType = employmentType;
    if (visaStatus) where.visaStatus = visaStatus;
    if (salaryMin) where.salaryMax = { gte: salaryMin };
    if (salaryMax) where.salaryMin = { lte: salaryMax };
    if (experienceMin !== undefined) where.experienceMin = { lte: experienceMin };
    if (level) where.level = level;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isEmiratization !== undefined) where.isEmiratization = isEmiratization;

    const orderBy: Prisma.JobOrderByWithRelationInput[] =
      sortBy === 'salaryMin'
        ? [{ salaryMin: 'desc' }]
        : [{ isFeatured: 'desc' }, { publishedAt: 'desc' }];

    const cacheKey = `jobs:list:${JSON.stringify({ q, categoryId, emirate, workMode, employmentType, visaStatus, salaryMin, salaryMax, experienceMin, level, isFeatured, isEmiratization, page, limit, sortBy })}`;

    return cacheGetOrSet(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: JOB_INCLUDE,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.job.count({ where }),
      ]);
      return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }, 120); // 2 min cache for search results
  }

  async getJobBySlug(slug: string, userId?: string) {
    // Only cache public (non-authenticated) views
    const fetchJob = async () => prisma.job.findUnique({
      where: { slug },
      include: {
        ...JOB_INCLUDE,
        savedBy: userId ? { where: { userId } } : false,
        applications: userId ? { where: { userId }, select: { id: true, status: true } } : false,
      },
    });

    const job = userId
      ? await fetchJob()
      : await cacheGetOrSet(`job:slug:${slug}`, fetchJob, 180); // 3 min cache for public views

    if (!job) throw new NotFoundError('Job');
    if (job.status !== 'PUBLISHED' && !userId) throw new NotFoundError('Job');

    // Increment view count (fire-and-forget, non-blocking)
    prisma.job.update({ where: { id: job.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    return {
      ...job,
      isSaved: userId ? (job as typeof job & { savedBy: { userId: string }[] }).savedBy?.length > 0 : false,
      myApplication: userId ? (job as typeof job & { applications: { id: string; status: string }[] }).applications?.[0] || null : null,
    };
  }

  async getJobById(jobId: string) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, include: JOB_INCLUDE });
    if (!job) throw new NotFoundError('Job');
    return job;
  }

  async createJob(userId: string, data: CreateJobInput) {
    // Get employer
    const member = await prisma.employerMember.findFirst({
      where: { userId },
      include: { employer: { include: { subscription: true } } },
    });
    if (!member) throw new ForbiddenError('Not associated with any employer');

    const { employer } = member;

    if (!employer.isActive) throw new AppError(403, 'Employer account is not active');
    if (employer.verificationStatus !== 'APPROVED') {
      throw new AppError(403, 'Employer not verified. Please await approval before posting jobs.');
    }

    // Check subscription quota
    const sub = employer.subscription;
    if (sub && sub.jobPostsUsed >= sub.jobPostsLimit) {
      throw new AppError(402, `Job post limit reached (${sub.jobPostsLimit}). Please upgrade your plan.`);
    }

    // Check if jobs require admin approval
    const setting = await prisma.siteSettings.findUnique({ where: { key: 'jobs_require_approval' } });
    const requireApproval = setting?.value === true;

    const baseSlug = slugify(data.title, { lower: true, strict: true });
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
    const shortCode = Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4);

    const { tags, screeningQuestions, ...jobData } = data;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        employerId: employer.id,
        slug: uniqueSlug,
        shortCode,
        status: requireApproval ? 'PENDING_APPROVAL' : 'DRAFT',
        tags: tags?.length
          ? {
              create: await Promise.all(
                tags.map(async (name) => {
                  const tag = await prisma.tag.upsert({
                    where: { name },
                    update: {},
                    create: { name },
                  });
                  return { tagId: tag.id };
                })
              ),
            }
          : undefined,
        screeningQuestions: screeningQuestions?.length
          ? { create: screeningQuestions }
          : undefined,
      },
      include: JOB_INCLUDE,
    });

    return job;
  }

  async updateJob(userId: string, jobId: string, data: UpdateJobInput) {
    const job = await this.assertOwnership(userId, jobId);

    const { tags, screeningQuestions, ...jobData } = data;

    if (tags !== undefined) {
      await prisma.jobTag.deleteMany({ where: { jobId } });
      for (const name of tags) {
        const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
        await prisma.jobTag.create({ data: { jobId, tagId: tag.id } });
      }
    }

    if (screeningQuestions !== undefined) {
      await prisma.screeningQuestion.deleteMany({ where: { jobId } });
      if (screeningQuestions.length) {
        await prisma.screeningQuestion.createMany({
          data: screeningQuestions.map((q) => ({ ...q, jobId })),
        });
      }
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: jobData,
      include: JOB_INCLUDE,
    });

    return updated;
  }

  async deleteJob(userId: string, jobId: string) {
    await this.assertOwnership(userId, jobId);
    await prisma.job.delete({ where: { id: jobId } });
    return { message: 'Job deleted' };
  }

  async publishJob(userId: string, jobId: string) {
    const job = await this.assertOwnership(userId, jobId);

    if (!['DRAFT', 'PAUSED'].includes(job.status)) {
      throw new AppError(400, 'Only draft or paused jobs can be published');
    }

    const setting = await prisma.siteSettings.findUnique({ where: { key: 'jobs_require_approval' } });
    const requireApproval = setting?.value === true;
    const newStatus = requireApproval ? 'PENDING_APPROVAL' : 'PUBLISHED';

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: newStatus as JobStatus,
        publishedAt: newStatus === 'PUBLISHED' ? new Date() : undefined,
        expiresAt: newStatus === 'PUBLISHED' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      },
    });

    // Increment quota
    if (newStatus === 'PUBLISHED') {
      await prisma.subscription.updateMany({
        where: { employerId: job.employerId },
        data: { jobPostsUsed: { increment: 1 } },
      });
    }

    return updated;
  }

  async pauseJob(userId: string, jobId: string) {
    await this.assertOwnership(userId, jobId);
    return prisma.job.update({ where: { id: jobId }, data: { status: 'PAUSED' } });
  }

  async closeJob(userId: string, jobId: string) {
    await this.assertOwnership(userId, jobId);
    return prisma.job.update({ where: { id: jobId }, data: { status: 'CLOSED' } });
  }

  async cloneJob(userId: string, jobId: string) {
    const job = await this.assertOwnership(userId, jobId);

    const baseSlug = `${job.slug}-copy-${Date.now().toString(36)}`;

    const { id, slug, shortCode: _sc, status, publishedAt, expiresAt, viewCount, applyCount, fraudFlags, skills, languages, ...rest } = job as typeof job & {
      id: string; slug: string; shortCode: string | null; status: string; publishedAt: Date | null;
      expiresAt: Date | null; viewCount: number; applyCount: number;
      fraudFlags: Prisma.JsonValue | null; skills: Prisma.JsonValue; languages: Prisma.JsonValue;
    };

    const toInputJson = (v: Prisma.JsonValue | null): Prisma.NullTypes.JsonNull | Prisma.InputJsonValue =>
      v === null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);

    const cloneShortCode = Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4);

    const cloned = await prisma.job.create({
      data: {
        ...(rest as Omit<typeof rest, 'tags' | 'screeningQuestions' | '_count' | 'employer' | 'category'>),
        employerId: (rest as { employerId: string }).employerId,
        categoryId: (rest as { categoryId: string }).categoryId,
        slug: baseSlug,
        shortCode: cloneShortCode,
        title: `Copy of ${job.title}`,
        status: 'DRAFT',
        skills: toInputJson(skills),
        languages: toInputJson(languages),
        fraudFlags: toInputJson(fraudFlags),
      },
    });

    return cloned;
  }

  async getEmployerJobs(userId: string, page = 1, limit = 20, status?: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new NotFoundError('Employer');

    const where = {
      employerId: member.employerId,
      ...(status ? { status: status as JobStatus } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: { ...JOB_INCLUDE, applications: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // Lazily backfill shortCode for legacy jobs that don't have one
    const missing = items.filter((j) => !j.shortCode);
    if (missing.length) {
      await Promise.all(
        missing.map((j) =>
          prisma.job.update({
            where: { id: j.id },
            data: { shortCode: Math.random().toString(36).slice(2, 6) + Date.now().toString(36).slice(-4) },
          })
        )
      );
      // Re-fetch to get the updated shortCodes
      const updated = await prisma.job.findMany({
        where,
        include: { ...JOB_INCLUDE, applications: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return { items: updated, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async reportJob(userId: string, slug: string, reason: string, details?: string) {
    const job = await prisma.job.findUnique({ where: { slug } });
    if (!job) throw new NotFoundError('Job');

    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        targetType: 'JOB',
        targetId: job.id,
        reason,
        details,
      },
    });

    return report;
  }

  async getSlugByShortCode(shortCode: string) {
    const job = await prisma.job.findUnique({ where: { shortCode }, select: { slug: true } });
    if (!job) throw new NotFoundError('Job');
    return job;
  }

  private async assertOwnership(userId: string, jobId: string) {
    const member = await prisma.employerMember.findFirst({ where: { userId } });
    if (!member) throw new ForbiddenError('Not associated with any employer');

    const job = await prisma.job.findFirst({ where: { id: jobId, employerId: member.employerId } });
    if (!job) throw new NotFoundError('Job');

    return job;
  }
}
