import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Play, Pause, Copy, Users, Link2 } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { JobStatusBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/Pagination';

function ManageJobsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-700">Job Title</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Status</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Applications</th>
            <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Views</th>
            <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[...Array(4)].map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <div className="skeleton h-4 rounded w-48" />
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <div className="skeleton h-5 rounded-full w-20" />
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <div className="skeleton h-4 rounded w-10" />
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <div className="skeleton h-4 rounded w-8" />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <div className="skeleton h-7 w-7 rounded" />
                  <div className="skeleton h-7 w-7 rounded" />
                  <div className="skeleton h-7 w-7 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ManageJobs() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employer-jobs', page, statusFilter],
    queryFn: () =>
      api.get(`/employer/jobs?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data.data),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.post(`/employer/jobs/${id}/${action}`),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: ['employer-jobs'] });
      toast.success(`Job ${action}ed`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employer/jobs/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-jobs'] }); toast.success('Job deleted'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const statuses = ['', 'DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'CLOSED'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Jobs</h1>
        <Link to="/employer/jobs/new">
          <Button icon={<Plus className="h-4 w-4" />}>Post a Job</Button>
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ManageJobsSkeleton />
      ) : !data?.items?.length ? (
        <EmptyState
          illustration="jobs"
          title="No jobs posted yet"
          description="Post your first job and start receiving applications."
          action={{ label: 'Post a Job', to: '/employer/jobs/new' }}
        />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Job Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Applications</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Views</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((job: {
                  id: string; title: string; status: string; viewCount: number; shortCode?: string;
                  _count?: { applications: number }; applications?: { id: string }[];
                }) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{job.title}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      <Link to={`/employer/jobs/${job.id}/applications`} className="flex items-center gap-1 hover:text-brand-600">
                        <Users className="h-3.5 w-3.5" />
                        {job._count?.applications || job.applications?.length || 0}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{job.viewCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === 'DRAFT' && (
                          <button
                            onClick={() => actionMutation.mutate({ id: job.id, action: 'publish' })}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Publish"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {job.status === 'PUBLISHED' && (
                          <button
                            onClick={() => actionMutation.mutate({ id: job.id, action: 'pause' })}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        )}
                        {job.status === 'PAUSED' && (
                          <button
                            onClick={() => actionMutation.mutate({ id: job.id, action: 'publish' })}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Republish"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        {job.shortCode && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/s/${job.shortCode}`);
                              toast.success('Short link copied!');
                            }}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                            title="Copy short link"
                          >
                            <Link2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => actionMutation.mutate({ id: job.id, action: 'clone' })}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                          title="Clone"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <Link to={`/employer/jobs/${job.id}/edit`} className="p-1.5 text-brand-600 hover:bg-brand-50 rounded">
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => { if (confirm('Delete this job?')) deleteMutation.mutate(job.id); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
