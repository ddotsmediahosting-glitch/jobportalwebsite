import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, DollarSign, Clock, Zap, Star } from 'lucide-react';
import { Badge } from './ui/Badge';
import { EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS, JobListItem } from '@uaejobs/shared';

function formatSalary(min?: number | null, max?: number | null, currency = 'AED', negotiable = false) {
  if (negotiable && !min && !max) return 'Negotiable';
  if (!min && !max) return 'Salary not specified';
  const fmt = (n: number) => n.toLocaleString();
  if (min && max) return `${currency} ${fmt(min)} – ${fmt(max)}`;
  if (min) return `${currency} ${fmt(min)}+`;
  if (max) return `Up to ${currency} ${fmt(max)}`;
  return 'Not specified';
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

interface JobCardProps {
  job: JobListItem;
  onSave?: (jobId: string) => void;
  isSaved?: boolean;
}

export function JobCard({ job, onSave, isSaved }: JobCardProps) {
  return (
    <article className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-brand-200 transition-all duration-200 relative">
      {/* Badges */}
      <div className="absolute top-4 right-4 flex gap-1.5">
        {job.isFeatured && (
          <Badge color="yellow">
            <Star className="h-3 w-3 mr-1" />Featured
          </Badge>
        )}
        {job.isUrgent && <Badge color="red"><Zap className="h-3 w-3 mr-1" />Urgent</Badge>}
      </div>

      {/* Company */}
      <div className="flex items-start gap-3 mb-3">
        {job.employer.logoUrl ? (
          <img
            src={job.employer.logoUrl}
            alt={job.employer.companyName}
            className="h-12 w-12 rounded-lg object-contain border border-gray-100 bg-gray-50 flex-shrink-0"
          />
        ) : (
          <div className="h-12 w-12 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <span className="text-brand-600 font-bold text-lg">
              {job.employer.companyName[0]}
            </span>
          </div>
        )}

        <div className="min-w-0">
          <Link
            to={`/jobs/${job.slug}`}
            className="font-semibold text-gray-900 hover:text-brand-600 text-sm line-clamp-1 transition-colors"
          >
            {job.title}
          </Link>
          <Link to={`/employers/${job.employer.slug}`} className="text-xs text-gray-500 hover:text-brand-600 transition-colors">
            {job.employer.companyName}
          </Link>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {EMIRATES_LABELS[job.emirate] || job.emirate}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" />
          {WORK_MODE_LABELS[job.workMode]}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5" />
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency, job.salaryNegotiable)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {timeAgo(job.publishedAt)}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Badge color="gray">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
        {job.level && <Badge color="blue">{job.level}</Badge>}
        {job.skills.slice(0, 3).map((s) => (
          <Badge key={s} color="gray">{s}</Badge>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {job.category.name}
        </span>
        <div className="flex gap-2">
          {onSave && (
            <button
              onClick={() => onSave(job.id)}
              className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                isSaved
                  ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'
              }`}
            >
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
          <Link
            to={`/jobs/${job.slug}`}
            className="text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors"
          >
            View Job
          </Link>
        </div>
      </div>
    </article>
  );
}
