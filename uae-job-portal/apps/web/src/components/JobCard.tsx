import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Clock, Zap, Star, Bookmark, BookmarkCheck, ArrowUpRight } from 'lucide-react';
import { EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS, JobListItem } from '@uaejobs/shared';

function formatSalary(min?: number | null, max?: number | null, currency = 'AED', negotiable = false) {
  if (negotiable && !min && !max) return 'Negotiable';
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)}–${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return null;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1d ago';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

const WORK_MODE_STYLE: Record<string, string> = {
  REMOTE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HYBRID: 'bg-blue-50 text-blue-700 border-blue-200',
  ONSITE: 'bg-gray-50 text-gray-600 border-gray-200',
};

const EMP_TYPE_STYLE: Record<string, string> = {
  FULL_TIME: 'bg-brand-50 text-brand-700',
  PART_TIME: 'bg-violet-50 text-violet-700',
  CONTRACT: 'bg-orange-50 text-orange-700',
  FREELANCE: 'bg-pink-50 text-pink-700',
  INTERNSHIP: 'bg-yellow-50 text-yellow-700',
};

interface JobCardProps {
  job: JobListItem;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export function JobCard({ job, onSave, isSaved }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryNegotiable);
  const workModeStyle = WORK_MODE_STYLE[job.workMode] ?? 'bg-gray-50 text-gray-600 border-gray-200';
  const empTypeStyle = EMP_TYPE_STYLE[job.employmentType] ?? 'bg-gray-50 text-gray-600';

  return (
    <article className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-card-hover hover:-translate-y-0.5 hover:border-brand-100 transition-all duration-200 relative flex flex-col shadow-card">
      {/* Top badges + save */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {job.isFeatured && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-300/20 text-yellow-700 border border-gold-300/40">
              <Star size={9} className="fill-yellow-500 text-yellow-500" /> FEATURED
            </span>
          )}
          {job.isUrgent && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
              <Zap size={9} className="fill-red-500" /> URGENT
            </span>
          )}
        </div>

        {onSave && (
          <button
            onClick={() => onSave(job.id)}
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
            className={`p-1.5 rounded-lg transition-all duration-150 flex-shrink-0 ${
              isSaved
                ? 'text-brand-600 bg-brand-50 hover:bg-brand-100'
                : 'text-gray-300 hover:text-brand-500 hover:bg-brand-50'
            }`}
          >
            {isSaved
              ? <BookmarkCheck size={15} />
              : <Bookmark size={15} />
            }
          </button>
        )}
      </div>

      {/* Company logo + title */}
      <div className="flex items-start gap-3 mb-3">
        {job.employer.logoUrl ? (
          <img
            src={job.employer.logoUrl}
            alt={job.employer.companyName}
            className="h-11 w-11 rounded-xl object-contain border border-gray-100 bg-gray-50 flex-shrink-0 shadow-sm"
          />
        ) : (
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-base">
              {job.employer.companyName[0].toUpperCase()}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Link
            to={`/jobs/${job.slug}`}
            className="font-semibold text-gray-900 group-hover:text-brand-600 text-[15px] line-clamp-1 transition-colors leading-tight block"
          >
            {job.title}
          </Link>
          <Link
            to={`/companies/${job.employer.slug}`}
            className="text-xs text-gray-500 hover:text-brand-500 transition-colors mt-0.5 block"
          >
            {job.employer.companyName}
          </Link>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin size={11} className="text-gray-400" />
          {EMIRATES_LABELS[job.emirate] || job.emirate}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${workModeStyle}`}>
          {WORK_MODE_LABELS[job.workMode]}
        </span>
        {salary && (
          <span className="flex items-center gap-1 text-emerald-700 font-medium">
            <DollarSign size={11} className="text-emerald-500" />
            {salary}
          </span>
        )}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full">
              {s}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-[10px] text-gray-400 px-1 py-0.5">+{job.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50 mt-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${empTypeStyle}`}>
            {EMPLOYMENT_TYPE_LABELS[job.employmentType]}
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={10} /> {timeAgo(job.publishedAt)}
          </span>
        </div>
        <Link
          to={`/jobs/${job.slug}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 group-hover:bg-brand-50 px-2.5 py-1.5 rounded-lg transition-all duration-150"
        >
          Apply <ArrowUpRight size={12} />
        </Link>
      </div>
    </article>
  );
}
