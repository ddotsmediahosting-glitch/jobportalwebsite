import prisma from '../../lib/prisma';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

export class ReviewsService {
  async getEmployerReviews(employerSlug: string, page = 1, limit = 10) {
    const employer = await prisma.employer.findUnique({ where: { slug: employerSlug } });
    if (!employer) throw new NotFoundError('Employer');

    const where: Prisma.CompanyReviewWhereInput = {
      employerId: employer.id,
      status: 'APPROVED',
    };

    const [items, total, stats] = await Promise.all([
      prisma.companyReview.findMany({
        where,
        include: {
          reviewer: {
            select: { id: true, email: true, seekerProfile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyReview.count({ where }),
      prisma.companyReview.aggregate({
        where,
        _avg: {
          rating: true,
          workLifeBalance: true,
          salaryBenefits: true,
          management: true,
          careerGrowth: true,
        },
        _count: { _all: true },
      }),
    ]);

    const ratingDistribution = await prisma.companyReview.groupBy({
      by: ['rating'],
      where,
      _count: { _all: true },
    });

    const masked = items.map((r) => ({
      ...r,
      reviewer: r.isAnonymous
        ? { id: r.reviewerId, name: 'Anonymous Employee', avatarUrl: null }
        : {
            id: r.reviewerId,
            name: r.reviewer.seekerProfile
              ? `${r.reviewer.seekerProfile.firstName} ${r.reviewer.seekerProfile.lastName}`
              : r.reviewer.email.split('@')[0],
            avatarUrl: r.reviewer.seekerProfile?.avatarUrl ?? null,
          },
    }));

    return {
      items: masked,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        avgRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : null,
        avgWorkLifeBalance: stats._avg.workLifeBalance,
        avgSalaryBenefits: stats._avg.salaryBenefits,
        avgManagement: stats._avg.management,
        avgCareerGrowth: stats._avg.careerGrowth,
        totalReviews: stats._count._all,
        ratingDistribution: Object.fromEntries(
          [1, 2, 3, 4, 5].map((r) => [r, ratingDistribution.find((d) => d.rating === r)?._count._all ?? 0])
        ),
      },
    };
  }

  async submitReview(
    userId: string,
    employerSlug: string,
    data: {
      title: string; pros: string; cons: string; rating: number;
      workLifeBalance: number; salaryBenefits: number; management: number; careerGrowth: number;
      jobTitle?: string; employmentStatus?: string; isAnonymous?: boolean;
    }
  ) {
    const employer = await prisma.employer.findUnique({ where: { slug: employerSlug } });
    if (!employer) throw new NotFoundError('Employer');

    // Validate rating values
    const ratingFields = ['rating', 'workLifeBalance', 'salaryBenefits', 'management', 'careerGrowth'] as const;
    for (const field of ratingFields) {
      const val = data[field];
      if (val < 1 || val > 5) throw new AppError(400, `${field} must be between 1 and 5`);
    }

    const existing = await prisma.companyReview.findUnique({
      where: { employerId_reviewerId: { employerId: employer.id, reviewerId: userId } },
    });
    if (existing) throw new AppError(409, 'You have already reviewed this company');

    const review = await prisma.companyReview.create({
      data: {
        employerId: employer.id,
        reviewerId: userId,
        title: data.title,
        pros: data.pros,
        cons: data.cons,
        rating: data.rating,
        workLifeBalance: data.workLifeBalance,
        salaryBenefits: data.salaryBenefits,
        management: data.management,
        careerGrowth: data.careerGrowth,
        jobTitle: data.jobTitle,
        employmentStatus: data.employmentStatus || 'CURRENT',
        isAnonymous: data.isAnonymous !== false,
        status: 'APPROVED', // auto-approve; set to PENDING for moderation
      },
    });

    return review;
  }

  async markHelpful(reviewId: string) {
    const review = await prisma.companyReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('Review');
    return prisma.companyReview.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    });
  }

  async adminListReviews(page = 1, limit = 20, status?: string) {
    const where: Prisma.CompanyReviewWhereInput = status ? { status } : {};
    const [items, total] = await Promise.all([
      prisma.companyReview.findMany({
        where,
        include: {
          employer: { select: { companyName: true, slug: true } },
          reviewer: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyReview.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminModerateReview(reviewId: string, status: 'APPROVED' | 'REJECTED') {
    const review = await prisma.companyReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundError('Review');
    return prisma.companyReview.update({ where: { id: reviewId }, data: { status } });
  }
}
