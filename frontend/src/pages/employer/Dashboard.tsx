import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Eye, TrendingUp, Plus, CheckCircle, AlertTriangle,
  ArrowUpRight, FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import { JobStatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

const STAT_CONFIG = [
  {
    key: 'totalJobs',
    label: 'Total Jobs',
    icon: Briefcase,
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    barColor: 'bg-blue-500',
    trend: null,
  },
  {
    key: 'publishedJobs',
    label: 'Published',
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    barColor: 'bg-emerald-500',
    trend: null,
  },
  {
    key: 'totalApplications',
    label: 'Applications',
    icon: Users,
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    barColor: 'bg-violet-500',
    trend: null,
  },
  {
    key: 'totalViews',
    label: 'Total Views',
    icon: Eye,
    bg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    barColor: 'bg-orange-500',
    trend: null,
  },
] as const;

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 rounded w-48" />
          <div className="skeleton h-4 rounded w-32" />
        </div>
        <div className="skeleton h-9 rounded-xl w-28" />
      </div>
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="skeleton h-9 w-9 rounded-xl" />
            <div className="skeleton h-8 rounded w-16" />
            <div className="skeleton h-3 rounded w-24" />
          </div>
        ))}
      </div>
      {/* Panels */}
      <div className="grid lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="skeleton h-5 rounded w-32" />
            {[...Array(4)].map((_, j) => (
              <div key={j} className="flex justify-between py-2 border-b border-gray-50">
                <div className="space-y-1.5 flex-1">
                  <div className="skeleton h-3.5 rounded w-2/3" />
                  <div className="skeleton h-3 rounded w-1/3" />
                </div>
                <div className="skeleton h-5 rounded-full w-20" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmployerDashboard() {
  const { data: employer, isLoading: empLoading } = useQuery({
    queryKey: ['my-employer'],
    queryFn: () => api.get('/employer/me').then((r) => r.data.data),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['employer-analytics'],
    queryFn: () => api.get('/employer/analytics').then((r) => r.data.data),
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['employer-jobs', 'recent'],
    queryFn: () => api.get('/employer/jobs?limit=5').then((r) => r.data.data),
  });

  const { data: recentApplications } = useQuery({
    queryKey: ['employer-applications', 'recent'],
    queryFn: () => api.get('/employer/applications?limit=5').then((r) => r.data.data),
  });

  const emp = employer?.employer;

  if (empLoading || analyticsLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{emp?.companyName || 'Dashboard'}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <VerificationBadge status={emp?.verificationStatus || 'PENDING'} />
          </div>
        </div>
        <Link to="/employer/jobs/new">
          <Button icon={<Plus className="h-4 w-4" />}>Post a Job</Button>
        </Link>
      </div>

      {/* Verification banner */}
      {emp?.verificationStatus !== 'APPROVED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Company verification pending</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Upload your trade license and our team will verify your company within 1–2 business days.{' '}
              <Link to="/employer/company" className="underline font-medium">Complete profile →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CONFIG.map(({ key, label, icon: Icon, bg, iconColor }) => {
          const value: number = analytics?.[key] || 0;
          return (
            <div key={key} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
              <div className={`inline-flex p-2.5 rounded-xl mb-4 ${bg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="text-3xl font-extrabold text-gray-900 tabular-nums">
                {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent jobs + applications */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent jobs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">Recent Jobs</h3>
            </div>
            <Link to="/employer/jobs" className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">
              View all →
            </Link>
          </div>
          {!recentJobs?.items?.length ? (
            <EmptyState
              illustration="jobs"
              title="No jobs posted yet"
              description="Post your first job and start receiving applications."
              action={{ label: 'Post a Job', to: '/employer/jobs/new' }}
              className="py-8"
            />
          ) : (
            <div className="space-y-1">
              {recentJobs.items.map((job: {
                id: string; title: string; status: string; slug: string;
                _count?: { applications: number }; publishedAt?: string
              }) => (
                <Link
                  key={job.id}
                  to={`/employer/jobs/${job.id}/edit`}
                  className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 transition-colors truncate">{job.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {job._count?.applications || 0} application{job._count?.applications !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <JobStatusBadge status={job.status} />
                    <ArrowUpRight size={12} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">Recent Applications</h3>
            </div>
            <Link to="/employer/applications" className="text-xs text-brand-600 font-medium hover:text-brand-700 transition-colors">
              View all →
            </Link>
          </div>
          {!recentApplications?.items?.length ? (
            <EmptyState
              illustration="applications"
              title="No applications yet"
              description="Applications will appear here once candidates apply to your jobs."
              className="py-8"
            />
          ) : (
            <div className="space-y-1">
              {recentApplications.items.map((app: {
                id: string; status: string; createdAt: string;
                user: { email: string; seekerProfile?: { firstName: string; lastName: string } };
                job: { title: string };
              }) => {
                const name = app.user.seekerProfile
                  ? `${app.user.seekerProfile.firstName} ${app.user.seekerProfile.lastName}`
                  : app.user.email;
                return (
                  <div key={app.id} className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{app.job.title}</p>
                    </div>
                    <span className="text-xs text-gray-400 ml-3 flex-shrink-0">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { to: '/employer/jobs/new', icon: Plus, label: 'Post a Job', desc: 'Attract top talent', color: 'text-brand-600 bg-brand-50' },
          { to: '/employer/candidates', icon: Users, label: 'Browse Candidates', desc: 'Find the right fit', color: 'text-violet-600 bg-violet-50' },
          { to: '/employer/analytics', icon: TrendingUp, label: 'View Analytics', desc: 'Track performance', color: 'text-emerald-600 bg-emerald-50' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 hover:shadow-md hover:border-brand-100 transition-all duration-200 group"
          >
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
