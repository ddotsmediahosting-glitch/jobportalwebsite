import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  Bookmark,
  Eye,
  User,
  TrendingUp,
  ArrowRight,
  Plus,
  Bell,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function SeekerDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Greeting skeleton */}
      <div className="space-y-2">
        <div className="skeleton h-7 rounded w-64" />
        <div className="skeleton h-4 rounded w-40" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-4 rounded w-24" />
              <div className="skeleton h-10 w-10 rounded-xl" />
            </div>
            <div className="skeleton h-8 rounded w-16" />
          </div>
        ))}
      </div>

      {/* Two-column section skeletons */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent applications skeleton */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="skeleton h-5 rounded w-44" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="skeleton h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-4 rounded w-48" />
                <div className="skeleton h-3 rounded w-32" />
              </div>
              <div className="skeleton h-5 rounded-full w-20" />
            </div>
          ))}
        </div>

        {/* Saved jobs skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="skeleton h-5 rounded w-28" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5 py-2 border-b border-gray-50 last:border-0">
              <div className="skeleton h-4 rounded w-36" />
              <div className="skeleton h-3 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SeekerDashboard() {
  const { user } = useAuth();

  // Dashboard summary (may not exist — failures are handled gracefully)
  const { data: dashboardData } = useQuery({
    queryKey: ['seeker-dashboard'],
    queryFn: () =>
      api.get('/seeker/dashboard').then((r) => r.data.data).catch(() => null),
    retry: false,
  });

  // Seeker profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['seeker-profile'],
    queryFn: () => api.get('/seeker/profile').then((r) => r.data.data),
  });

  // Recent applications
  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['seeker-recent-applications'],
    queryFn: () =>
      api.get('/seeker/applications?limit=5').then((r) => r.data.data),
  });

  // Saved jobs
  const { data: savedJobsData, isLoading: savedLoading } = useQuery({
    queryKey: ['seeker-saved-jobs-preview'],
    queryFn: () =>
      api.get('/seeker/saved-jobs?limit=3').then((r) => r.data.data),
  });

  const isLoading = profileLoading || appsLoading || savedLoading;

  if (isLoading) return <SeekerDashboardSkeleton />;

  const firstName =
    profile?.firstName ||
    user?.firstName ||
    user?.email?.split('@')[0] ||
    'there';

  const applications: {
    id: string;
    status: string;
    createdAt: string;
    job: { id: string; title: string; employer?: { companyName?: string } };
  }[] = applicationsData?.items ?? applicationsData ?? [];

  const savedJobs: {
    id: string;
    job: { id: string; title: string; employer?: { companyName?: string }; emirate?: string };
  }[] = savedJobsData?.items ?? savedJobsData ?? [];

  // Stat values — prefer dashboard endpoint data, fall back to local counts/profile
  const totalApplications =
    dashboardData?.totalApplications ?? applicationsData?.total ?? applications.length;
  const totalSavedJobs =
    dashboardData?.totalSavedJobs ?? savedJobsData?.total ?? savedJobs.length;
  const profileViews = dashboardData?.profileViews ?? profile?.profileViews ?? 0;

  // Profile completeness: count non-empty profile fields
  const profileFields = [
    profile?.firstName,
    profile?.lastName,
    profile?.headline,
    profile?.bio,
    profile?.phone,
    profile?.emirate,
    profile?.skills?.length,
    profile?.avatarUrl,
  ];
  const filledFields = profileFields.filter(Boolean).length;
  const profileCompleteness =
    dashboardData?.profileCompleteness ??
    Math.round((filledFields / profileFields.length) * 100);

  // ---------------------------------------------------------------------------
  // Stat cards config
  // ---------------------------------------------------------------------------
  const stats = [
    {
      label: 'Total Applications',
      value: totalApplications,
      icon: Briefcase,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Saved Jobs',
      value: totalSavedJobs,
      icon: Bookmark,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Profile Views',
      value: profileViews,
      icon: Eye,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Profile Complete',
      value: `${profileCompleteness}%`,
      icon: CheckCircle,
      iconBg: profileCompleteness >= 80 ? 'bg-green-50' : 'bg-amber-50',
      iconColor: profileCompleteness >= 80 ? 'text-green-600' : 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Here's an overview of your job search activity.
        </p>
      </div>

      {/* Profile completeness nudge */}
      {profileCompleteness < 80 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <TrendingUp className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Your profile is {profileCompleteness}% complete
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Complete your profile to stand out to employers.
            </p>
          </div>
          <Link
            to="/seeker/profile"
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 flex-shrink-0"
          >
            Update <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <div className={`${iconBg} p-2.5 rounded-xl`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent applications */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Applications</h2>
            <Link
              to="/seeker/applications"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!applications.length ? (
            <EmptyState
              illustration="applications"
              title="No applications yet"
              description="Start applying to jobs that match your skills."
              action={{ label: 'Browse Jobs', to: '/jobs' }}
            />
          ) : (
            <ul className="divide-y divide-gray-50">
              {applications.map((app) => (
                <li key={app.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {app.job.title}
                    </p>
                    {app.job.employer?.companyName && (
                      <p className="text-xs text-gray-400 truncate">
                        {app.job.employer.companyName}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <ApplicationStatusBadge status={app.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Saved jobs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Saved Jobs</h2>
            <Link
              to="/seeker/saved-jobs"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {!savedJobs.length ? (
            <EmptyState
              illustration="saved"
              title="No saved jobs"
              description="Bookmark jobs you're interested in."
              action={{ label: 'Browse Jobs', to: '/jobs' }}
            />
          ) : (
            <ul className="divide-y divide-gray-50">
              {savedJobs.map((saved) => (
                <li key={saved.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/jobs/${saved.job.id}`}
                    className="group block hover:text-brand-600"
                  >
                    <p className="text-sm font-medium text-gray-900 group-hover:text-brand-600 truncate">
                      {saved.job.title}
                    </p>
                    {(saved.job.employer?.companyName || saved.job.emirate) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[saved.job.employer?.companyName, saved.job.emirate]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            to="/jobs"
            className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Browse Jobs</span>
          </Link>

          <Link
            to="/seeker/profile"
            className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="bg-purple-50 p-3 rounded-xl group-hover:bg-purple-100 transition-colors">
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Update Profile</span>
          </Link>

          <Link
            to="/seeker/saved-jobs"
            className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Bookmark className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Saved Jobs</span>
          </Link>

          <Link
            to="/seeker/alerts"
            className="flex flex-col items-center justify-center gap-2 bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-brand-200 transition-all group"
          >
            <div className="bg-amber-50 p-3 rounded-xl group-hover:bg-amber-100 transition-colors">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">Job Alerts</span>
          </Link>
        </div>
      </div>

      {/* Post a new application CTA */}
      <div className="flex items-center justify-between p-5 bg-gradient-to-r from-brand-50 to-blue-50 border border-brand-100 rounded-2xl">
        <div>
          <p className="font-semibold text-gray-900">Ready to apply?</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Discover thousands of jobs across the UAE.
          </p>
        </div>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="h-4 w-4" /> Find Jobs
        </Link>
      </div>
    </div>
  );
}
