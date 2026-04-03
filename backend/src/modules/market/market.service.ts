import prisma from '../../lib/prisma';
import { cacheGetOrSet } from '../../lib/cache';
import {
  generateMarketNarrative,
  generateRoleIntelligence,
  MarketNarrativeResult,
  RoleIntelligenceResult,
} from '../../lib/ai';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

function weekAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
}

function monthAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

// ─── Pulse ─────────────────────────────────────────────────────────────────────

export interface MarketPulse {
  totalActiveJobs: number;
  newJobsThisWeek: number;
  totalSeekers: number;
  totalApplicationsThisWeek: number;
  avgSalaryAED: number;
  urgentJobsCount: number;
  emiratizationJobsCount: number;
  topHiringIndustries: Array<{ industry: string; count: number }>;
  topHiringEmirates: Array<{ emirate: string; count: number }>;
  topSkillsInDemand: Array<{ skill: string; count: number }>;
  topJobTitles: Array<{ title: string; count: number }>;
  salaryByEmirate: Array<{ emirate: string; avgMin: number; avgMax: number; count: number }>;
  applicationCompetition: number; // avg applicants per job
  narrative: MarketNarrativeResult | null;
  generatedAt: string;
}

export async function getMarketPulse(): Promise<MarketPulse> {
  return cacheGetOrSet('market:pulse', async () => {
    const since = weekAgo();

    const [
      totalActiveJobs,
      newJobsThisWeek,
      totalSeekers,
      totalApplicationsThisWeek,
      urgentJobsCount,
      emiratizationJobsCount,
      salaryAgg,
      jobsByEmirate,
      recentJobs,
    ] = await Promise.all([
      prisma.job.count({ where: { status: 'PUBLISHED' } }),
      prisma.job.count({ where: { status: 'PUBLISHED', publishedAt: { gte: since } } }),
      prisma.user.count({ where: { role: 'SEEKER' } }),
      prisma.application.count({ where: { createdAt: { gte: since } } }),
      prisma.job.count({ where: { status: 'PUBLISHED', isUrgent: true } }),
      prisma.job.count({ where: { status: 'PUBLISHED', isEmiratization: true } }),
      prisma.job.aggregate({
        where: { status: 'PUBLISHED', salaryMin: { gt: 0 } },
        _avg: { salaryMin: true, salaryMax: true },
      }),
      prisma.job.groupBy({
        by: ['emirate'],
        where: { status: 'PUBLISHED' },
        _count: { _all: true },
        orderBy: { _count: { emirate: 'desc' } },
        take: 7,
      }),
      // Fetch recent jobs to extract skills + industries + titles
      prisma.job.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          title: true,
          skills: true,
          emirate: true,
          salaryMin: true,
          salaryMax: true,
          employer: { select: { industry: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 500,
      }),
    ]);

    // Aggregate skills from JSON field
    const skillFreq: Record<string, number> = {};
    const industryFreq: Record<string, number> = {};
    const titleFreq: Record<string, number> = {};
    const emirateSalary: Record<string, { sumMin: number; sumMax: number; count: number }> = {};

    for (const job of recentJobs) {
      // Skills
      const skills = extractStringArray(job.skills);
      for (const s of skills) {
        const key = s.trim().toLowerCase();
        if (key) skillFreq[key] = (skillFreq[key] ?? 0) + 1;
      }
      // Industry
      const ind = job.employer?.industry;
      if (ind) industryFreq[ind] = (industryFreq[ind] ?? 0) + 1;
      // Title (normalise to first 3 words)
      const titleKey = job.title.split(' ').slice(0, 3).join(' ');
      titleFreq[titleKey] = (titleFreq[titleKey] ?? 0) + 1;
      // Salary by emirate
      if (job.emirate && job.salaryMin && job.salaryMin > 0) {
        const e = emirateSalary[job.emirate] ?? { sumMin: 0, sumMax: 0, count: 0 };
        e.sumMin += job.salaryMin;
        e.sumMax += job.salaryMax ?? job.salaryMin;
        e.count++;
        emirateSalary[job.emirate] = e;
      }
    }

    const topSkillsInDemand = Object.entries(skillFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([skill, count]) => ({ skill, count }));

    const topHiringIndustries = Object.entries(industryFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([industry, count]) => ({ industry, count }));

    const topJobTitles = Object.entries(titleFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([title, count]) => ({ title, count }));

    const topHiringEmirates = jobsByEmirate.map((e) => ({
      emirate: e.emirate,
      count: e._count._all,
    }));

    const salaryByEmirate = Object.entries(emirateSalary)
      .map(([emirate, v]) => ({
        emirate,
        avgMin: Math.round(v.sumMin / v.count),
        avgMax: Math.round(v.sumMax / v.count),
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    const avgSalaryAED = salaryAgg._avg.salaryMin ?? 0;
    const applicationCompetition = totalActiveJobs > 0
      ? Math.round(totalApplicationsThisWeek / totalActiveJobs)
      : 0;

    // Generate AI narrative (catch errors gracefully)
    let narrative: MarketNarrativeResult | null = null;
    try {
      narrative = await generateMarketNarrative({
        totalActiveJobs,
        newJobsThisWeek,
        totalSeekers,
        totalApplicationsThisWeek,
        topHiringIndustries,
        topHiringEmirates,
        topSkillsInDemand,
        avgSalaryAED,
        urgentJobsCount,
        emiratizationJobsCount,
      });
    } catch {
      // AI unavailable — return data without narrative
    }

    return {
      totalActiveJobs,
      newJobsThisWeek,
      totalSeekers,
      totalApplicationsThisWeek,
      avgSalaryAED: Math.round(avgSalaryAED),
      urgentJobsCount,
      emiratizationJobsCount,
      topHiringIndustries,
      topHiringEmirates,
      topSkillsInDemand,
      topJobTitles,
      salaryByEmirate,
      applicationCompetition,
      narrative,
      generatedAt: new Date().toISOString(),
    } satisfies MarketPulse;
  }, 3600); // 1 hour cache
}

// ─── Role Intelligence ─────────────────────────────────────────────────────────

export interface RoleReport {
  role: string;
  jobCount: number;
  applicationCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  topSkills: string[];
  topEmirates: string[];
  topIndustries: string[];
  recentJobs: number;
  intelligence: RoleIntelligenceResult | null;
  sampleJobs: Array<{
    id: string;
    title: string;
    companyName: string;
    emirate: string;
    salaryMin: number | null;
    salaryMax: number | null;
    slug: string;
  }>;
  generatedAt: string;
}

export async function getRoleIntelligence(roleTitle: string): Promise<RoleReport> {
  const cacheKey = `market:role:${roleTitle.toLowerCase().replace(/\s+/g, '-').slice(0, 60)}`;
  return cacheGetOrSet(cacheKey, async () => {
    const since30 = monthAgo();
    const titleSearch = roleTitle.trim();

    const [jobs, applicationAgg, recentCount] = await Promise.all([
      prisma.job.findMany({
        where: {
          status: 'PUBLISHED',
          title: { contains: titleSearch },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          emirate: true,
          salaryMin: true,
          salaryMax: true,
          skills: true,
          employer: { select: { companyName: true, industry: true } },
          _count: { select: { applications: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      }),
      prisma.application.count({
        where: {
          job: {
            status: 'PUBLISHED',
            title: { contains: titleSearch },
          },
        },
      }),
      prisma.job.count({
        where: {
          status: 'PUBLISHED',
          title: { contains: titleSearch },
          publishedAt: { gte: since30 },
        },
      }),
    ]);

    const jobCount = jobs.length;
    const skillFreq: Record<string, number> = {};
    const emirateFreq: Record<string, number> = {};
    const industryFreq: Record<string, number> = {};
    let salMinSum = 0, salMaxSum = 0, salCount = 0;

    for (const j of jobs) {
      const skills = extractStringArray(j.skills);
      for (const s of skills) {
        const k = s.trim().toLowerCase();
        if (k) skillFreq[k] = (skillFreq[k] ?? 0) + 1;
      }
      if (j.emirate) emirateFreq[j.emirate] = (emirateFreq[j.emirate] ?? 0) + 1;
      const ind = j.employer?.industry;
      if (ind) industryFreq[ind] = (industryFreq[ind] ?? 0) + 1;
      if (j.salaryMin && j.salaryMin > 0) {
        salMinSum += j.salaryMin;
        salMaxSum += j.salaryMax ?? j.salaryMin;
        salCount++;
      }
    }

    const topSkills = Object.entries(skillFreq).sort(([, a], [, b]) => b - a).slice(0, 8).map(([s]) => s);
    const topEmirates = Object.entries(emirateFreq).sort(([, a], [, b]) => b - a).slice(0, 5).map(([e]) => e);
    const topIndustries = Object.entries(industryFreq).sort(([, a], [, b]) => b - a).slice(0, 5).map(([i]) => i);
    const avgSalaryMin = salCount > 0 ? Math.round(salMinSum / salCount) : 0;
    const avgSalaryMax = salCount > 0 ? Math.round(salMaxSum / salCount) : 0;

    let intelligence: RoleIntelligenceResult | null = null;
    try {
      intelligence = await generateRoleIntelligence({
        title: titleSearch,
        jobCount,
        applicationCount: applicationAgg,
        avgSalaryMin,
        avgSalaryMax,
        topSkills,
        topEmirates,
        topIndustries,
        recentJobs: recentCount,
      });
    } catch {
      // AI unavailable
    }

    const sampleJobs = jobs.slice(0, 5).map((j) => ({
      id: j.id,
      title: j.title,
      companyName: j.employer?.companyName ?? '',
      emirate: j.emirate,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      slug: j.slug,
    }));

    return {
      role: titleSearch,
      jobCount,
      applicationCount: applicationAgg,
      avgSalaryMin,
      avgSalaryMax,
      topSkills,
      topEmirates,
      topIndustries,
      recentJobs: recentCount,
      intelligence,
      sampleJobs,
      generatedAt: new Date().toISOString(),
    } satisfies RoleReport;
  }, 1800); // 30 min cache
}

// ─── Top Roles for browsing ────────────────────────────────────────────────────

export interface TopRoleEntry {
  title: string;
  count: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  topEmirate: string;
}

export async function getTopRoles(): Promise<TopRoleEntry[]> {
  return cacheGetOrSet('market:top-roles', async () => {
    const jobs = await prisma.job.findMany({
      where: { status: 'PUBLISHED' },
      select: { title: true, emirate: true, salaryMin: true, salaryMax: true },
      orderBy: { publishedAt: 'desc' },
      take: 1000,
    });

    const roleMap: Record<string, {
      count: number; salMinSum: number; salMaxSum: number; salCount: number;
      emirateFreq: Record<string, number>;
    }> = {};

    for (const j of jobs) {
      const key = j.title.toLowerCase().trim().slice(0, 60);
      const entry = roleMap[key] ?? { count: 0, salMinSum: 0, salMaxSum: 0, salCount: 0, emirateFreq: {} };
      entry.count++;
      if (j.salaryMin && j.salaryMin > 0) {
        entry.salMinSum += j.salaryMin;
        entry.salMaxSum += j.salaryMax ?? j.salaryMin;
        entry.salCount++;
      }
      if (j.emirate) entry.emirateFreq[j.emirate] = (entry.emirateFreq[j.emirate] ?? 0) + 1;
      roleMap[key] = entry;
    }

    return Object.entries(roleMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 30)
      .map(([title, v]) => ({
        title: title.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        count: v.count,
        avgSalaryMin: v.salCount > 0 ? Math.round(v.salMinSum / v.salCount) : 0,
        avgSalaryMax: v.salCount > 0 ? Math.round(v.salMaxSum / v.salCount) : 0,
        topEmirate: Object.entries(v.emirateFreq).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '',
      }));
  }, 3600);
}
