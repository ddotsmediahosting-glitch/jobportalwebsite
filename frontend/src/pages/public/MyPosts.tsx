import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Briefcase, Clock, CheckCircle2, XCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Clock size={13} />,
    description: 'Under admin review. Will be published once approved.',
  },
  PUBLISHED: {
    label: 'Published',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 size={13} />,
    description: 'Live and visible to job seekers.',
  },
  DRAFT: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Briefcase size={13} />,
    description: 'Not submitted yet.',
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle size={13} />,
    description: 'Not approved. Please review and resubmit.',
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <XCircle size={13} />,
    description: 'This job post has been closed.',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: <AlertCircle size={13} />,
    description: 'This job post has expired.',
  },
};

interface JobPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
  emirate: string;
  employmentType: string;
  salaryMin?: number;
  salaryMax?: number;
  category?: { name: string };
  _count?: { applications: number };
}

export function MyPosts() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-posts'],
    queryFn: () => api.get('/user-jobs/mine').then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/user-jobs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-posts'] }); toast.success('Job post deleted'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const items: JobPost[] = data?.items || [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Job Posts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track the status of your submitted job posts.</p>
        </div>
        <Link to="/post-job"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Post a Job
        </Link>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No job posts yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">Post your first job and it will appear here for review.</p>
          <Link to="/post-job"
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Post a Job
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(job => {
            const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG['DRAFT'];
            return (
              <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{cfg.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {job.category && <span>{job.category.name}</span>}
                      <span>{job.emirate.replace(/_/g, ' ')}</span>
                      <span>{job.employmentType.replace(/_/g, ' ')}</span>
                      {job.salaryMin && job.salaryMax && (
                        <span>AED {job.salaryMin.toLocaleString()} – {job.salaryMax.toLocaleString()}/mo</span>
                      )}
                      {job._count && job.status === 'PUBLISHED' && (
                        <span className="text-brand-600 font-medium">{job._count.applications} applications</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {new Date(job.createdAt).toLocaleDateString()}
                      {job.publishedAt && ` · Published ${new Date(job.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job.status === 'PUBLISHED' && (
                      <Link to={`/jobs/${job.slug}`} target="_blank"
                        className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye size={13} /> View
                      </Link>
                    )}
                    {job.status !== 'PUBLISHED' && (
                      <button
                        onClick={() => { if (confirm('Delete this job post?')) deleteMutation.mutate(job.id); }}
                        className="flex items-center gap-1.5 text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
