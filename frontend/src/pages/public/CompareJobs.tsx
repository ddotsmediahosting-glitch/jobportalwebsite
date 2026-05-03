import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Briefcase, MapPin, Banknote, Clock, Building2, X, ArrowLeft, GitCompare } from 'lucide-react';
import { api } from '../../lib/api';
import { EMIRATES_LABELS, EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from '@uaejobs/shared';
import { useJobCompare } from '../../hooks/useJobCompare';

interface Job {
  id: string;
  slug: string;
  title: string;
  emirate: string;
  workMode: string;
  employmentType: string;
  level?: string | null;
  experienceMin?: number | null;
  experienceMax?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string;
  salaryNegotiable?: boolean;
  publishedAt?: string | null;
  expiresAt?: string | null;
  skills?: unknown;
  description?: string;
  requirements?: string;
  benefits?: string;
  employer?: { companyName: string; logoUrl?: string | null; emirate?: string };
}

function formatSalary(min?: number | null, max?: number | null, currency = 'AED', negotiable?: boolean) {
  if (negotiable && !min && !max) return 'Negotiable';
  if (!min && !max) return '—';
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString());
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max!)}`;
  return '—';
}

function formatExperience(min?: number | null, max?: number | null) {
  if (min == null && max == null) return '—';
  if (min != null && max != null) return `${min}–${max} years`;
  if (min != null) return `${min}+ years`;
  return `Up to ${max} years`;
}

export function CompareJobs() {
  const [params] = useSearchParams();
  const { items: stored, remove } = useJobCompare();

  // Prefer slugs from URL for shareable links; fall back to localStorage.
  const urlSlugs = (params.get('slugs') || '').split(',').filter(Boolean).slice(0, 3);
  const slugs: string[] = urlSlugs.length > 0
    ? urlSlugs
    : stored.map((s) => s.slug).slice(0, 3);

  const queries = useQueries({
    queries: slugs.map((slug) => ({
      queryKey: ['compare-job', slug],
      queryFn: () => api.get(`/jobs/${slug}`).then((r) => r.data.data as Job),
      retry: false,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const jobs = queries.map((q) => q.data).filter(Boolean) as Job[];

  if (slugs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <GitCompare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">No jobs to compare</h1>
        <p className="text-gray-500 mb-6">Add 2 or 3 jobs to your compare list from the job listings, then return here.</p>
        <Link to="/jobs" className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Jobs
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slugs.map((slug) => (
            <div key={slug} className="skeleton h-96 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Helper: render a row of values across all columns with consistent label
  const Row = ({ label, values, multiline }: { label: string; values: (string | React.ReactNode)[]; multiline?: boolean }) => (
    <div className={`grid grid-cols-${jobs.length} gap-4 py-3 border-b border-gray-100`}>
      {values.map((v, i) => (
        <div key={i}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{label}</div>
          <div className={`text-sm text-gray-800 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{v}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/jobs" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitCompare className="h-6 w-6 text-brand-500" /> Compare Jobs
          </h1>
        </div>
      </div>

      {/* Header row — title + employer + remove button per column */}
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(jobs.length, 3)} gap-4 mb-2`}>
        {jobs.map((job) => (
          <div key={job.id} className="bg-white border border-gray-100 rounded-2xl p-5 relative">
            <button
              onClick={() => remove(job.id)}
              aria-label="Remove from comparison"
              className="absolute top-3 right-3 text-gray-300 hover:text-red-500 p-1"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-3 mb-3">
              {job.employer?.logoUrl ? (
                <img src={job.employer.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                  {(job.employer?.companyName?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <Link to={`/job/${job.slug}`} className="font-semibold text-gray-900 hover:text-brand-600 text-sm block">
                  {job.title}
                </Link>
                <div className="text-xs text-gray-500 mt-0.5">{job.employer?.companyName ?? '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <Row
          label="Salary"
          values={jobs.map((j) => (
            <span className="font-semibold flex items-center gap-1">
              <Banknote className="h-4 w-4 text-brand-500" />
              {formatSalary(j.salaryMin, j.salaryMax, j.salaryCurrency, j.salaryNegotiable)}
            </span>
          ))}
        />
        <Row
          label="Location"
          values={jobs.map((j) => (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-400" />
              {EMIRATES_LABELS[j.emirate as keyof typeof EMIRATES_LABELS] || j.emirate}
            </span>
          ))}
        />
        <Row
          label="Work Mode"
          values={jobs.map((j) => WORK_MODE_LABELS[j.workMode as keyof typeof WORK_MODE_LABELS] || j.workMode)}
        />
        <Row
          label="Employment Type"
          values={jobs.map((j) => EMPLOYMENT_TYPE_LABELS[j.employmentType as keyof typeof EMPLOYMENT_TYPE_LABELS] || j.employmentType)}
        />
        <Row label="Experience" values={jobs.map((j) => formatExperience(j.experienceMin, j.experienceMax))} />
        <Row label="Level" values={jobs.map((j) => j.level || '—')} />
        <Row
          label="Skills"
          values={jobs.map((j) => {
            const skills = Array.isArray(j.skills) ? (j.skills as string[]) : [];
            if (!skills.length) return '—';
            return (
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 8).map((s) => (
                  <span key={s} className="text-[11px] bg-gray-50 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            );
          })}
        />
        <Row
          label="Posted"
          values={jobs.map((j) => (
            <span className="flex items-center gap-1 text-gray-600">
              <Clock className="h-4 w-4 text-gray-400" />
              {j.publishedAt ? new Date(j.publishedAt).toLocaleDateString() : '—'}
            </span>
          ))}
        />
      </div>

      <div className="flex justify-center mt-6">
        <Link to="/jobs" className="text-sm text-brand-600 hover:underline">
          ← Back to job listings
        </Link>
      </div>
    </div>
  );
}
