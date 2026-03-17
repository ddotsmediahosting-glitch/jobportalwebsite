import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Briefcase, Building2, FileText, AlertTriangle, CheckCircle,
  Clock, TrendingUp, TrendingDown, ArrowRight, BarChart3, Activity,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';

// ── Mini sparkline SVG ──────────────────────────────────────────────────────
function Sparkline({ data, color = '#3aa9b0' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ── Trend badge ─────────────────────────────────────────────────────────────
function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, sub, link, sparkData, sparkColor, trend,
}: {
  label: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string; link?: string; sparkData?: number[];
  sparkColor?: string; trend?: number | null;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className="flex items-end gap-2 mt-0.5">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && <div className="mb-0.5"><Trend pct={trend ?? null} /></div>}
        </div>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return link ? <Link to={link}>{inner}</Link> : <div>{inner}</div>;
}

// ── Quick action button ──────────────────────────────────────────────────────
function QuickAction({
  label, desc, icon, color, onClick,
}: { label: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-xl border ${color} text-left hover:shadow-sm transition-all w-full`}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-75 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

// ── Dashboard skeleton ───────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Stat cards grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-7 w-20 rounded" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="skeleton h-3 rounded w-1/2" />
              <div className="skeleton h-7 rounded w-1/3" />
              <div className="skeleton h-3 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
      {/* Panel skeletons */}
      <div className="grid lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="skeleton h-4 rounded w-1/3" />
              <div className="skeleton h-3 rounded w-12" />
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 px-5 py-3">
                  <div className="skeleton h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 rounded w-2/3" />
                    <div className="skeleton h-2.5 rounded w-1/2" />
                  </div>
                  <div className="skeleton h-6 rounded-full w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: stats, isLoading, refetch: refetchStats, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics-7d'],
    queryFn: () => api.get('/admin/analytics?days=7').then((r) => r.data.data),
  });

  const pendingJobsData = useQuery({
    queryKey: ['admin-pending-jobs'],
    queryFn: () => api.get('/admin/jobs?status=PENDING_APPROVAL&limit=5').then((r) => r.data.data),
  });

  const pendingVerificationsData = useQuery({
    queryKey: ['admin-pending-employers'],
    queryFn: () => api.get('/admin/employers?verificationStatus=PENDING&limit=5').then((r) => r.data.data),
  });

  const pendingReports = useQuery({
    queryKey: ['admin-pending-reports'],
    queryFn: () => api.get('/admin/reports?status=PENDING&limit=5').then((r) => r.data.data),
  });

  // Quick approve job mutation
  const approveJob = useMutation({
    mutationFn: (jobId: string) => api.patch(`/admin/jobs/${jobId}/moderate`, { status: 'PUBLISHED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-jobs'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
  });

  // Quick verify employer mutation
  const verifyEmployer = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/employers/${id}/verify`, { status: 'APPROVED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-pending-employers'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
  });

  // Build sparkline arrays from analytics (last 7 days)
  const userSpark = analytics?.dailyUsers?.map((d: any) => d.count) ?? [];
  const jobSpark = analytics?.dailyJobs?.map((d: any) => d.count) ?? [];
  const appSpark = analytics?.dailyApplications?.map((d: any) => d.count) ?? [];

  if (isLoading) return <DashboardSkeleton />;

  const pendingJobs = stats?.pendingJobs ?? 0;
  const pendingVerifs = stats?.pendingVerifications ?? 0;
  const pendingReps = stats?.pendingReports ?? 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform overview · {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchStats()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-md px-2.5 py-1.5 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/admin/analytics" className="hidden sm:flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium">
            <BarChart3 className="h-4 w-4" /> Full Analytics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Attention banner */}
      {(pendingJobs > 0 || pendingVerifs > 0 || pendingReps > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-4">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div className="flex flex-wrap gap-4 text-sm flex-1">
            {pendingJobs > 0 && (
              <Link to="/admin/jobs?status=PENDING_APPROVAL" className="font-medium text-amber-900 hover:underline">
                {pendingJobs} job{pendingJobs > 1 ? 's' : ''} awaiting approval
              </Link>
            )}
            {pendingVerifs > 0 && (
              <Link to="/admin/employers?verificationStatus=PENDING" className="font-medium text-amber-900 hover:underline">
                {pendingVerifs} employer{pendingVerifs > 1 ? 's' : ''} awaiting verification
              </Link>
            )}
            {pendingReps > 0 && (
              <Link to="/admin/reports?status=PENDING" className="font-medium text-amber-900 hover:underline">
                {pendingReps} open report{pendingReps > 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={(stats?.totalUsers ?? 0).toLocaleString()}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
          link="/admin/users"
          sub={`${stats?.totalSeekers ?? 0} seekers · ${stats?.totalEmployers ?? 0} employers`}
          sparkData={userSpark}
          sparkColor="#3aa9b0"
          trend={analytics?.trends?.users?.pct}
        />
        <StatCard
          label="Published Jobs"
          value={(stats?.publishedJobs ?? 0).toLocaleString()}
          icon={<Briefcase className="h-5 w-5 text-brand-600" />}
          color="bg-brand-50"
          link="/admin/jobs"
          sub={`${stats?.pendingJobs ?? 0} pending approval`}
          sparkData={jobSpark}
          sparkColor="#2e8c93"
          trend={analytics?.trends?.jobs?.pct}
        />
        <StatCard
          label="Total Applications"
          value={(stats?.totalApplications ?? 0).toLocaleString()}
          icon={<FileText className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
          sparkData={appSpark}
          sparkColor="#16a34a"
          trend={analytics?.trends?.applications?.pct}
        />
        <StatCard
          label="Pending Verification"
          value={stats?.pendingVerifications ?? 0}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
          link="/admin/employers?verificationStatus=PENDING"
          sub="employers awaiting review"
        />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4">
        <QuickAction
          label="Review Pending Jobs"
          desc={`${pendingJobs} jobs need moderation`}
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          color="bg-amber-50 border-amber-200 text-amber-900"
          onClick={() => navigate('/admin/jobs?status=PENDING_APPROVAL')}
        />
        <QuickAction
          label="Verify Employers"
          desc={`${pendingVerifs} companies awaiting approval`}
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50 border-purple-200 text-purple-900"
          onClick={() => navigate('/admin/employers?verificationStatus=PENDING')}
        />
        <QuickAction
          label="View Analytics"
          desc="Charts, trends, and platform health"
          icon={<BarChart3 className="h-5 w-5 text-brand-600" />}
          color="bg-brand-50 border-brand-200 text-brand-900"
          onClick={() => navigate('/admin/analytics')}
        />
      </div>

      {/* Platform health summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Active Users',
            value: stats?.totalUsers ? `${Math.round(((stats.totalUsers - (stats.suspendedUsers ?? 0)) / stats.totalUsers) * 100)}%` : '—',
            sub: 'of total users are active',
            color: 'text-green-600 bg-green-50',
          },
          {
            label: 'Job Fill Rate',
            value: stats?.totalJobs && stats?.publishedJobs ? `${Math.round((stats.publishedJobs / stats.totalJobs) * 100)}%` : '—',
            sub: 'jobs are published',
            color: 'text-brand-600 bg-brand-50',
          },
          {
            label: 'Avg. Applications',
            value: stats?.publishedJobs && stats?.totalApplications
              ? (stats.totalApplications / Math.max(stats.publishedJobs, 1)).toFixed(1)
              : '—',
            sub: 'per published job',
            color: 'text-purple-600 bg-purple-50',
          },
          {
            label: 'Platform Status',
            value: 'Online',
            sub: 'All systems operational',
            color: 'text-emerald-600 bg-emerald-50',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full mb-2 ${color}`}>
              <Activity className="h-3 w-3" /> {label}
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending jobs to moderate */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Pending Jobs</h2>
            <Link to="/admin/jobs?status=PENDING_APPROVAL" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingJobsData.data?.items?.length === 0 && (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All jobs reviewed</p>
              </div>
            )}
            {pendingJobsData.data?.items?.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  <p className="text-xs text-gray-400 truncate">{job.employer?.companyName}</p>
                </div>
                <button
                  onClick={() => approveJob.mutate(job.id)}
                  disabled={approveJob.isPending}
                  className="flex-shrink-0 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-md font-medium transition-colors"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending employer verifications */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Employer Verifications</h2>
            <Link to="/admin/employers?verificationStatus=PENDING" className="text-xs text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingVerificationsData.data?.items?.length === 0 && (
              <div className="px-5 py-8 text-center">
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending verifications</p>
              </div>
            )}
            {pendingVerificationsData.data?.items?.slice(0, 5).map((emp: any) => (
              <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                  {emp.companyName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{emp.companyName}</p>
                  <p className="text-xs text-gray-400">{new Date(emp.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => verifyEmployer.mutate(emp.id)}
                  disabled={verifyEmployer.isPending}
                  className="flex-shrink-0 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-md font-medium transition-colors"
                >
                  Verify
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats?.recentUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                  {u.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.email}</p>
                  <p className="text-xs text-gray-400">{u.role} · {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  u.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {u.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open reports */}
      {(pendingReports.data?.items?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-100 bg-orange-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-semibold text-orange-900">Open Reports</h2>
            </div>
            <Link to="/admin/reports" className="text-xs text-orange-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingReports.data.items.map((r: any) => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{r.reason}</p>
                  <p className="text-xs text-gray-400">{r.job?.title ?? 'Unknown'} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <Link to="/admin/reports" className="text-xs text-brand-600 hover:underline flex-shrink-0">
                  Review <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
