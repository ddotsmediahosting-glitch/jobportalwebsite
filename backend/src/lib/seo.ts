/**
 * Auto-generates metaTitle and metaDescription for a job post.
 * Called whenever a job is created, updated, or published.
 *
 * Format:
 *   title:  "[Job Title] Jobs in [City], UAE | [Company] – ddotsmediajobs"
 *   desc:   "Apply for [Job Title] at [Company] in [City], UAE. [employment type], [salary?]. Find more [category] jobs on ddotsmediajobs.com"
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

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  TEMPORARY: 'Temporary',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
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
}): { metaTitle: string; metaDescription: string } {
  const city = EMIRATES_LABELS[job.emirate] || job.emirate;
  const empType = EMPLOYMENT_TYPE_LABELS[job.employmentType] || job.employmentType;
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const catName = job.category.parent
    ? `${job.category.parent.name} – ${job.category.name}`
    : job.category.name;

  // Title: max ~60 chars for Google
  const metaTitle = `${job.title} Jobs in ${city}, UAE | ${job.employer.companyName} – ddotsmediajobs`;

  // Description: max ~155 chars for Google
  const parts = [
    `Apply for ${job.title} at ${job.employer.companyName} in ${city}, UAE.`,
    `${empType} position${salary ? ` · ${salary}` : ''}.`,
    `Find more ${catName} jobs on ddotsmediajobs.com`,
  ];
  const metaDescription = parts.join(' ');

  return { metaTitle, metaDescription };
}
