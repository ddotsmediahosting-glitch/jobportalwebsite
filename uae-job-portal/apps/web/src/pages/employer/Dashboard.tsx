import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Eye, TrendingUp, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { JobStatusBadge, VerificationBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

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

  if (empLoading || analyticsLoading) return <PageSpinner />;

  const emp = employer?.employer;
  const sub = emp?.subscription;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{emp?.companyName || 'Dashboard'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <VerificationBadge status={emp?.verificationStatus || 'PENDING'} />
          </div>
        </div>
        <Link to="/employer/jobs/new">
          <Button icon={<Plus className="h-4 w-4" />}>Post a Job</Button>
        </Link>
      </div>

      {emp?.verificationStatus !== 'APPROVED' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Company verification pending</p>
            <p className="text-xs text-yellow-600 mt-0.5">
              Upload your trade license and our team will verify your company within 1-2 business days.
              <Link to="/employer/profile" className="ml-1 underline">Complete profile →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Jobs', value: analytics?.totalJobs || 0, icon: Briefcase, color: 'blue' },
          { label: 'Published', value: analytics?.publishedJobs || 0, icon: CheckCircle, color: 'green' },
          { label: 'Applications', value: analytics?.totalApplications || 0, icon: Users, color: 'purple' },
          { label: 'Total Views', value: analytics?.totalViews || 0, icon: Eye, color: 'orange' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg mb-3 ${
              color === 'blue' ? 'bg-blue-50 text-blue-600' :
              color === 'green' ? 'bg-green-50 text-green-600' :
              color === 'purple' ? 'bg-purple-50 text-purple-600' :
              'bg-orange-50 text-orange-600'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Subscription info */}
      {sub && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{sub.plan} Plan</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {sub.jobPostsUsed}/{sub.jobPostsLimit} job posts used this period
              </p>
            </div>
            <Link to="/employer/billing" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              {sub.plan === 'FREE' ? 'Upgrade' : 'Manage Plan'} →
            </Link>
          </div>
          <div className="mt-3 bg-gray-100 rounded-full h-2">
            <div
              className="bg-brand-500 rounded-full h-2 transition-all"
              style={{ width: `${Math.min(100, (sub.jobPostsUsed / sub.jobPostsLimit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Jobs</h3>
            <Link to="/employer/jobs" className="text-xs text-brand-600">View all →</Link>
          </div>
          {!recentJobs?.items?.length ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No jobs yet.
              <Link to="/employer/jobs/new" className="text-brand-600 ml-1">Post your first job →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.items.map((job: { id: string; title: string; status: string; _count?: { applications: number }; publishedAt?: string }) => (
                <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">{job._count?.applications || 0} applications</p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Applications</h3>
            <Link to="/employer/applications" className="text-xs text-brand-600">View all →</Link>
          </div>
          {!recentApplications?.items?.length ? (
            <div className="text-center py-8 text-gray-400 text-sm">No applications yet.</div>
          ) : (
            <div className="space-y-3">
              {recentApplications.items.map((app: {
                id: string; status: string; createdAt: string;
                user: { email: string; seekerProfile?: { firstName: string; lastName: string } };
                job: { title: string };
              }) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {app.user.seekerProfile ? `${app.user.seekerProfile.firstName} ${app.user.seekerProfile.lastName}` : app.user.email}
                    </p>
                    <p className="text-xs text-gray-500">{app.job.title}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
