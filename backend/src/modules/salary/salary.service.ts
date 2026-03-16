import prisma from '../../lib/prisma';
import { Emirates, Prisma } from '@prisma/client';

export class SalaryService {
  async submitSalary(userId: string | undefined, data: {
    jobTitle: string; industry?: string; emirate?: string;
    experienceMin: number; experienceMax?: number;
    salaryMin: number; salaryMax: number; isAnonymous?: boolean;
  }) {
    return prisma.salaryData.create({
      data: {
        jobTitle: data.jobTitle,
        industry: data.industry,
        emirate: data.emirate as Emirates | undefined,
        experienceMin: data.experienceMin,
        experienceMax: data.experienceMax,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        userId,
        isAnonymous: data.isAnonymous !== false,
        source: userId ? 'user' : 'anonymous',
      },
    });
  }

  async explore(filters: {
    jobTitle?: string; industry?: string; emirate?: string;
    experienceMin?: number; experienceMax?: number;
  }) {
    const { jobTitle, industry, emirate, experienceMin, experienceMax } = filters;

    const where: Prisma.SalaryDataWhereInput = {};
    if (jobTitle) where.jobTitle = { contains: jobTitle };
    if (industry) where.industry = { contains: industry };
    if (emirate) where.emirate = emirate as Emirates;
    if (experienceMin !== undefined) where.experienceMin = { gte: experienceMin };
    if (experienceMax !== undefined) where.experienceMax = { lte: experienceMax };

    const [records, byEmirate, byExperience] = await Promise.all([
      prisma.salaryData.aggregate({
        where,
        _avg: { salaryMin: true, salaryMax: true },
        _min: { salaryMin: true },
        _max: { salaryMax: true },
        _count: { _all: true },
      }),
      prisma.salaryData.groupBy({
        by: ['emirate'],
        where: jobTitle ? { jobTitle: { contains: jobTitle } } : {},
        _avg: { salaryMin: true, salaryMax: true },
        _count: { _all: true },
        orderBy: { _count: { emirate: 'desc' } },
      }),
      prisma.salaryData.groupBy({
        by: ['experienceMin'],
        where: jobTitle ? { jobTitle: { contains: jobTitle } } : {},
        _avg: { salaryMin: true, salaryMax: true },
        _count: { _all: true },
        orderBy: { experienceMin: 'asc' },
      }),
    ]);

    return {
      summary: {
        avgMin: records._avg.salaryMin ? Math.round(records._avg.salaryMin) : null,
        avgMax: records._avg.salaryMax ? Math.round(records._avg.salaryMax) : null,
        min: records._min.salaryMin,
        max: records._max.salaryMax,
        sampleSize: records._count._all,
      },
      byEmirate: byEmirate.map((r) => ({
        emirate: r.emirate,
        avgMin: r._avg.salaryMin ? Math.round(r._avg.salaryMin) : null,
        avgMax: r._avg.salaryMax ? Math.round(r._avg.salaryMax) : null,
        count: r._count._all,
      })),
      byExperience: byExperience.map((r) => ({
        experienceMin: r.experienceMin,
        avgMin: r._avg.salaryMin ? Math.round(r._avg.salaryMin) : null,
        avgMax: r._avg.salaryMax ? Math.round(r._avg.salaryMax) : null,
        count: r._count._all,
      })),
    };
  }

  async topRoles(emirate?: string, limit = 20) {
    const where: Parameters<typeof prisma.salaryData.groupBy>[0]['where'] = {};
    if (emirate) where.emirate = emirate as Emirates;

    const roles = await prisma.salaryData.groupBy({
      by: ['jobTitle'],
      where,
      _avg: { salaryMin: true, salaryMax: true },
      _count: { _all: true },
      orderBy: { _count: { jobTitle: 'desc' } },
      take: limit,
    });

    return roles.map((r) => ({
      jobTitle: r.jobTitle,
      avgMin: r._avg.salaryMin ? Math.round(r._avg.salaryMin) : null,
      avgMax: r._avg.salaryMax ? Math.round(r._avg.salaryMax) : null,
      count: r._count._all,
    }));
  }

  async industries() {
    const data = await prisma.salaryData.groupBy({
      by: ['industry'],
      _avg: { salaryMin: true, salaryMax: true },
      _count: { _all: true },
      orderBy: { _count: { industry: 'desc' } },
      take: 20,
    });
    return data.filter((d) => d.industry).map((d) => ({
      industry: d.industry,
      avgMin: d._avg.salaryMin ? Math.round(d._avg.salaryMin) : null,
      avgMax: d._avg.salaryMax ? Math.round(d._avg.salaryMax) : null,
      count: d._count._all,
    }));
  }
}
