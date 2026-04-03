import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, ArrowRight, MapPin, Briefcase, TrendingUp } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

interface RecommendedJob {
  id: string;
  title: string;
  matchScore: number;
  matchLabel: string;
  topReasons: string[];
  employer: { companyName: string; logoUrl?: string; emirate?: string; slug: string };
  category: { name: string };
  emirate: string;
  workMode: string;
  salaryMin?: number;
  salaryMax?: number;
  slug?: string;
}

function MatchBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
    score >= 65 ? 'bg-blue-100 text-blue-700 border-blue-200' :
    'bg-amber-100 text-amber-700 border-amber-200';

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      <TrendingUp size={10} />
      {score}% {label}
    </span>
  );
}

export function RecommendedJobs() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['recommended-jobs', user?.id],
    queryFn: () => api.get('/ai/recommended-jobs').then((r) => r.data.data),
    enabled: !!user && user.role === 'SEEKER',
    staleTime: 30 * 60_000,
  });

  if (!user || user.role !== 'SEEKER') return null;

  if (isLoading) {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={20} className="text-purple-500 animate-pulse" />
          <h2 className="text-xl font-bold text-gray-900">Recommended For You</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">AI-powered</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="h-12 w-12 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={18} className="text-purple-500" />
            <h2 className="text-xl font-bold text-gray-900">Recommended For You</h2>
            <span className="text-xs text-white bg-purple-500 px-2 py-0.5 rounded-full font-medium">AI</span>
          </div>
          <p className="text-sm text-gray-500">Personalized matches based on your profile and skills</p>
        </div>
        <Link
          to="/jobs"
          className="hidden sm:flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
        >
          Browse all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.slice(0, 6).map((job: RecommendedJob) => (
          <Link
            key={job.id}
            to={`/jobs/${job.id}`}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-purple-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                {job.employer.logoUrl ? (
                  <img loading="lazy" decoding="async" src={job.employer.logoUrl} alt={job.employer.companyName} className="h-full w-full object-cover" />
                ) : (
                  <Briefcase size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700 transition-colors line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{job.employer.companyName}</p>
              </div>
            </div>

            <MatchBadge score={job.matchScore} label={job.matchLabel} />

            {job.topReasons?.[0] && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-1">&#10003; {job.topReasons[0]}</p>
            )}

            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
              {job.emirate && (
                <span className="flex items-center gap-1">
                  <MapPin size={10} /> {job.emirate.replace('_', ' ')}
                </span>
              )}
              <span className="capitalize">{job.workMode?.toLowerCase()}</span>
              {job.salaryMin && (
                <span className="text-gray-600 font-medium">AED {job.salaryMin.toLocaleString()}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
