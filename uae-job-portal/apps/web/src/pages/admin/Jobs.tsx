import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Eye, Star } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/Pagination';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { JobStatusBadge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'REJECTED', label: 'Rejected' },
];

interface Job {
  id: string;
  title: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  employer: { companyName: string };
  _count?: { applications: number };
}

export function AdminJobs() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Job | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', page, search, statusFilter],
    queryFn: () =>
      api.get(`/admin/jobs?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data.data),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: string; reason?: string }) =>
      api.patch(`/admin/jobs/${id}/moderate`, { action, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success('Job moderated.');
      setSelected(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      api.patch(`/admin/jobs/${id}/feature`, { featured }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-jobs'] }); toast.success('Job feature status updated.'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-500 mt-1">Moderate and manage job listings.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2 flex-1 min-w-[200px]"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search job title..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <div className="w-48">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Views / Apps</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Posted</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((job: Job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {job.isFeatured && <Star className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" />}
                        <div>
                          <button onClick={() => setSelected(job)} className="font-medium text-gray-900 hover:text-brand-600 text-left">
                            {job.title}
                          </button>
                          <p className="text-xs text-gray-400">{job.employer.companyName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{job.viewCount}</span>
                      <span className="text-xs">{job._count?.applications ?? 0} apps</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {job.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              onClick={() => moderateMutation.mutate({ id: job.id, action: 'approve' })}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                              title="Approve"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:') || 'Policy violation';
                                moderateMutation.mutate({ id: job.id, action: 'reject', reason });
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => featureMutation.mutate({ id: job.id, featured: !job.isFeatured })}
                          className={`p-1.5 rounded-lg ${job.isFeatured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'}`}
                          title={job.isFeatured ? 'Remove featured' : 'Make featured'}
                        >
                          <Star className="h-4 w-4" fill={job.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.items?.length && (
              <div className="text-center py-16 text-gray-400">No jobs found.</div>
            )}
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* Job detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Job Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-400">Title</p><p className="font-medium text-gray-900">{selected.title}</p></div>
              <div><p className="text-xs text-gray-400">Employer</p><p className="font-medium text-gray-900">{selected.employer.companyName}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><JobStatusBadge status={selected.status} /></div>
              <div><p className="text-xs text-gray-400">Views</p><p className="font-medium text-gray-900">{selected.viewCount}</p></div>
              <div><p className="text-xs text-gray-400">Applications</p><p className="font-medium text-gray-900">{selected._count?.applications ?? 0}</p></div>
              <div><p className="text-xs text-gray-400">Featured</p><p className="font-medium text-gray-900">{selected.isFeatured ? 'Yes' : 'No'}</p></div>
            </div>
            {selected.status === 'PENDING_APPROVAL' && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={() => moderateMutation.mutate({ id: selected.id, action: 'approve' })}
                  loading={moderateMutation.isPending}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    const reason = prompt('Rejection reason:') || 'Policy violation';
                    moderateMutation.mutate({ id: selected.id, action: 'reject', reason });
                  }}
                  loading={moderateMutation.isPending}
                  icon={<XCircle className="h-4 w-4" />}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
