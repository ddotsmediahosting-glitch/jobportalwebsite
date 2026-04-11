import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Eye, Users, Briefcase, TrendingUp, Clock, ArrowUpRight, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand-400 to-brand-600',
    emerald: 'from-emerald-400 to-teal-600',
    violet: 'from-violet-400 to-purple-600',
    amber: 'from-amber-400 to-orange-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.brand} flex items-center justify-center mb-3`}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, label, color = 'bg-brand-500' }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-blue-500',
  VIEWED: 'bg-indigo-500',
  SHORTLISTED: 'bg-violet-500',
  INTERVIEW: 'bg-amber-500',
  OFFER: 'bg-emerald-500',
  HIRED: 'bg-green-500',
  REJECTED: 'bg-red-400',
};

export function EmployerAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['employer-analytics'],
    queryFn: () => api.get('/employer/analytics').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 skeleton h-28" />)}
        </div>
      </div>
    );
  }

  const funnelMax = data?.conversionFunnel?.[0]?.count || 1;
  const topViewsMax = data?.topJobs?.[0]?.viewCount || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hiring Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your job performance and candidate pipeline</p>
        </div>
        <Link to="/employer/jobs" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
          Manage Jobs <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={data?.totalJobs || 0} sub={`${data?.publishedJobs || 0} live`} color="brand" />
        <StatCard icon={Users} label="Total Applications" value={data?.totalApplications || 0} sub={`${data?.newApps7d || 0} this week`} color="violet" />
        <StatCard icon={Eye} label="Total Views" value={(data?.totalViews || 0).toLocaleString()} color="emerald" />
        <StatCard icon={TrendingUp} label="New (30d)" value={data?.newApps30d || 0} sub="Applications" color="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600" /> Hiring Funnel
          </h2>
          <div className="space-y-3">
            {data?.conversionFunnel?.map((step: { status: string; count: number }) => (
              <MiniBar
                key={step.status}
                label={step.status.replace(/_/g, ' ')}
                value={step.count}
                max={funnelMax}
                color={STATUS_COLORS[step.status] || 'bg-gray-400'}
              />
            ))}
          </div>
          {data?.conversionFunnel && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Conversion:{' '}
                <span className="font-semibold text-emerald-600">
                  {data.conversionFunnel[0]?.count > 0
                    ? `${Math.round(((data.conversionFunnel.find((s: { status: string }) => s.status === 'HIRED')?.count || 0) / data.conversionFunnel[0].count) * 100)}%`
                    : '—'} hired
                </span>{' '}
                of all applicants
              </p>
            </div>
          )}
        </div>

        {/* Top Jobs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Eye size={16} className="text-brand-600" /> Top Performing Jobs
          </h2>
          <div className="space-y-3">
            {data?.topJobs?.slice(0, 5).map((job: { id: string; title: string; slug: string; viewCount: number; _count: { applications: number }; expiresAt: string | null }) => (
              <div key={job.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <Link to={`/job/${job.slug}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600 truncate block">
                    {job.title}
                  </Link>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Eye size={10} />{job.viewCount}</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={10} />{job._count.applications} applied</span>
                    {job.expiresAt && (
                      <span className={`text-xs flex items-center gap-1 ${new Date(job.expiresAt) < new Date(Date.now() + 7 * 86400000) ? 'text-red-500' : 'text-gray-400'}`}>
                        <Clock size={10} />Expires {new Date(job.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min((job.viewCount / topViewsMax) * 100, 100)}%` }} />
                  </div>
                </div>
                <Link to={`/employer/applications?jobId=${job.id}`} className="text-xs text-brand-600 hover:underline flex-shrink-0 font-medium">
                  View
                </Link>
              </div>
            ))}
            {(!data?.topJobs || data.topJobs.length === 0) && (
              <div className="text-center py-8 text-gray-400">
                <Briefcase size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No published jobs yet</p>
                <Link to="/employer/jobs/new" className="text-brand-600 text-sm underline mt-1 inline-block">Post your first job</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Applications Chart */}
      {data?.dailyApplications?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-600" /> Applications (Last 30 Days)
          </h2>
          <div className="flex items-end gap-1 h-32">
            {data.dailyApplications.map((d: { day: string; count: number }, i: number) => {
              const maxCount = Math.max(...data.dailyApplications.map((dd: { count: number }) => dd.count), 1);
              const pct = (d.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group" title={`${new Date(d.day).toLocaleDateString()}: ${d.count}`}>
                  <span className="text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">{d.count}</span>
                  <div
                    className="w-full rounded-t bg-brand-500 group-hover:bg-brand-600 transition-colors"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{new Date(data.dailyApplications[0]?.day).toLocaleDateString()}</span>
            <span>{new Date(data.dailyApplications[data.dailyApplications.length - 1]?.day).toLocaleDateString()}</span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckCircle size={15} className="text-brand-600" /> Tips to Improve Performance
        </h3>
        <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-600">
          <p>• Add salary range — jobs with salary info get 3× more applies</p>
          <p>• Include required skills — improves ATS matching scores</p>
          <p>• Respond to applicants within 48h to build reputation</p>
        </div>
      </div>
    </div>
  );
}
