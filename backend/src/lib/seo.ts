/**
 * Auto-generates metaTitle, metaDescription, and metaKeywords for a job post.
 * Called whenever a job is created, updated, or published.
 *
 * Format (matches frontend JobDetail page):
 *   title:    "[Job Title] Jobs in [City] | ddotsmediajobs"
 *   desc:     "Apply for [Job Title] jobs in [City]. [Company] is hiring now. [Salary?] Apply today."
 *   keywords: "[Job Title], jobs in [City], [Category] jobs UAE, [Company] jobs, [City] jobs"
 */

const EMIRATES_LABELS: Record<string, string> = {
  ABU_DHABI: 'Abu Dhabi',
  DUBAI: 'Dubai',
  SHARJAH: 'Sharjah',
  AJMAN: 'Ajman',
  UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah',
};

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `AED ${Math.round(n / 1000)}k` : `AED ${n}`;
  if (min && max) return `${fmt(min)}–${fmt(max)}/mo`;
  if (min) return `${fmt(min)}+/mo`;
  if (max) return `Up to ${fmt(max)}/mo`;
  return null;
}

export function generateJobSEO(job: {
  title: string;
  emirate: string;
  employmentType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  employer: { companyName: string };
  category: { name: string; parent?: { name: string } | null };
}): { metaTitle: string; metaDescription: string; metaKeywords: string } {
  const city = EMIRATES_LABELS[job.emirate] || job.emirate;
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const catName = job.category.name;

  // "[Job Title] Jobs in [City] | ddotsmediajobs"
  const metaTitle = `${job.title} Jobs in ${city} | ddotsmediajobs`;

  // "Apply for [Job Title] jobs in [City]. [Company] is hiring now. [Salary.] Apply today."
  const metaDescription = [
    `Apply for ${job.title} jobs in ${city}.`,
    `${job.employer.companyName} is hiring now.`,
    salary ? `Salary: ${salary}.` : '',
    'Apply today.',
  ].filter(Boolean).join(' ');

  // "[Job Title], jobs in [City], [Category] jobs UAE, [Company] jobs, [City] jobs"
  const metaKeywords = [
    job.title,
    `jobs in ${city}`,
    `${catName} jobs UAE`,
    `${job.employer.companyName} jobs`,
    `${city} jobs`,
  ].join(', ');

  return { metaTitle, metaDescription, metaKeywords };
}
