import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Briefcase, Building2, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { ApplicationStatusBadge, JobStatusBadge } from '../../components/ui/Badge';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  link?: string;
  sub?: string;
}

function Stat({ label, value, icon, color, link, sub }: StatCard) {
  const inner = (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4 hover:border-gray-300 transition-colors`}>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : <div>{inner}</div>;
}

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['admin-recent-users'],
    queryFn: () => api.get('/admin/users?limit=5&sort=createdAt').then((r) => r.data.data),
  });

  const { data: recentJobs } = useQuery({
    queryKey: ['admin-recent-jobs'],
    queryFn: () => api.get('/admin/jobs?limit=5&sort=createdAt').then((r) => r.data.data),
  });

  const { data: pendingReports } = useQuery({
    queryKey: ['admin-pending-reports'],
    queryFn: () => api.get('/admin/reports?status=PENDING&limit=5').then((r) => r.data.data),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform overview and recent activity.</p>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Total Users"
          value={stats?.totalUsers?.toLocaleString() ?? '—'}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
          link="/admin/users"
          sub={`+${stats?.newUsersToday ?? 0} today`}
        />
        <Stat
          label="Active Jobs"
          value={stats?.activeJobs?.toLocaleString() ?? '—'}
          icon={<Briefcase className="h-5 w-5 text-brand-600" />}
          color="bg-brand-50"
          link="/admin/jobs"
          sub={`${stats?.pendingJobs ?? 0} pending approval`}
        />
        <Stat
          label="Employers"
          value={stats?.totalEmployers?.toLocaleString() ?? '—'}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
          link="/admin/employers"
          sub={`${stats?.pendingVerification ?? 0} awaiting verification`}
        />
        <Stat
          label="Applications"
          value={stats?.totalApplications?.toLocaleString() ?? '—'}
          icon={<FileText className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
          sub={`${stats?.applicationsToday ?? 0} today`}
        />
      </div>

      {/* Secondary stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat
          label="Total Revenue (AED)"
          value={stats?.totalRevenue ? `${(stats.totalRevenue / 100).toLocaleString()}` : '—'}
          icon={<TrendingUp className="h-5 w-5 text-gold-600" />}
          color="bg-yellow-50"
        />
        <Stat
          label="Open Reports"
          value={stats?.openReports ?? '—'}
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
          link="/admin/reports"
        />
        <Stat
          label="Seeker Profiles"
          value={stats?.totalSeekers?.toLocaleString() ?? '—'}
          icon={<Users className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent users */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentUsers?.items?.slice(0, 5).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                  {u.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">{u.role}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent jobs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentJobs?.items?.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400 truncate">{job.employer?.companyName}</p>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending reports */}
      {pendingReports?.items?.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 bg-orange-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="font-semibold text-orange-900">Pending Reports</h2>
            </div>
            <Link to="/admin/reports" className="text-xs text-orange-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingReports.items.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{r.reason}</p>
                  <p className="text-xs text-gray-400">{r.targetType} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <Link to="/admin/reports" className="text-xs text-brand-600 hover:underline">Review</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
