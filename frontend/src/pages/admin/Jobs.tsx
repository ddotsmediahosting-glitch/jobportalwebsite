import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, CheckCircle, XCircle, Eye, Star, CheckSquare, Square,
  MapPin, Clock, Users, X, ExternalLink, Plus, Trash2, Briefcase,
  SlidersHorizontal, ArrowUpDown,
} from 'lucide-react';
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

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'published', label: 'Recently published' },
  { value: 'views', label: 'Most viewed' },
];

const EMIRATE_OPTIONS = [
  { value: 'DUBAI', label: 'Dubai' },
  { value: 'ABU_DHABI', label: 'Abu Dhabi' },
  { value: 'SHARJAH', label: 'Sharjah' },
  { value: 'AJMAN', label: 'Ajman' },
  { value: 'UMM_AL_QUWAIN', label: 'Umm Al Quwain' },
  { value: 'RAS_AL_KHAIMAH', label: 'Ras Al Khaimah' },
  { value: 'FUJAIRAH', label: 'Fujairah' },
];

const WORK_MODE_OPTIONS = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'REMOTE', label: 'Remote' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
];

interface Job {
  id: string;
  title: string;
  slug?: string;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  description?: string;
  createdAt: string;
  publishedAt?: string;
  employer: { id: string; companyName: string };
  category?: { name: string };
  _count?: { applications: number };
}

const emptyForm = {
  employerId: '',
  categoryId: '',
  title: '',
  description: '',
  emirate: 'DUBAI',
  workMode: 'ONSITE',
  employmentType: 'FULL_TIME',
  location: '',
  salaryMin: '',
  salaryMax: '',
  skills: '',
  isFeatured: false,
};

export function AdminJobs() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [emirateFilter, setEmirateFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [rejectModal, setRejectModal] = useState<{ job: Job } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState(false);
  const [postJobModal, setPostJobModal] = useState(false);
  const [postJobForm, setPostJobForm] = useState({ ...emptyForm });

  const hasFilters = !!(search || statusFilter || categoryFilter || emirateFilter || sortBy);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-jobs', page, search, statusFilter, categoryFilter, emirateFilter, sortBy],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (emirateFilter) params.set('emirate', emirateFilter);
      if (sortBy) params.set('sortBy', sortBy);
      return api.get(`/admin/jobs?${params.toString()}`).then((r) => r.data.data);
    },
  });

  // Load categories for filter dropdown (always, not only when modal open)
  const { data: filterCategories } = useQuery({
    queryKey: ['admin-categories-flat-filter'],
    queryFn: () =>
      api.get('/categories?all=true').then((r) => {
        const flat: any[] = [];
        (r.data.data ?? []).forEach((c: any) => {
          flat.push(c);
          (c.children ?? []).forEach((ch: any) => flat.push({ ...ch, parentId: c.id }));
        });
        return flat;
      }),
  });

  const categoryFilterOptions = [
    { value: '', label: 'All categories' },
    ...(filterCategories?.map((c: any) => ({ value: c.id, label: c.parentId ? `  └ ${c.name}` : c.name })) ?? []),
  ];

  const emirateFilterOptions = [
    { value: '', label: 'All locations' },
    ...EMIRATE_OPTIONS,
  ];

  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setStatusFilter('');
    setCategoryFilter(''); setEmirateFilter(''); setSortBy(''); setPage(1);
  };

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data.data),
  });

  // Employers for post job form
  const { data: employersList } = useQuery({
    queryKey: ['admin-employers-all'],
    queryFn: () => api.get('/admin/employers?limit=500').then((r) => r.data.data.items),
    enabled: postJobModal,
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      api.patch(`/admin/jobs/${id}/moderate`, { status, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Job updated.');
      setPreviewJob(null);
      setRejectModal(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ jobIds, action, notes }: { jobIds: string[]; action: string; notes?: string }) =>
      api.post('/admin/jobs/bulk-moderate', { jobIds, action, notes }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(res.data.message ?? 'Bulk action done.');
      setSelected(new Set());
      setBulkModal(false);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const featureMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/jobs/${id}/feature`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast.success('Featured status updated.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/jobs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Job deleted.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const createJobMutation = useMutation({
    mutationFn: (data: typeof postJobForm) =>
      api.post('/admin/jobs', {
        ...data,
        salaryMin: data.salaryMin ? Number(data.salaryMin) : undefined,
        salaryMax: data.salaryMax ? Number(data.salaryMax) : undefined,
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-jobs'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Job posted and published.');
      setPostJobModal(false);
      setPostJobForm({ ...emptyForm });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const allIds: string[] = data?.items?.map((j: Job) => j.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const toggleAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(allIds)); };
  const toggleOne = (id: string) => { const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); setSelected(next); };
  const pendingSelected = data?.items?.filter((j: Job) => selected.has(j.id) && j.status === 'PENDING_APPROVAL').map((j: Job) => j.id) ?? [];

  const employerOptions = [
    { value: '', label: 'Select employer...' },
    ...(employersList?.map((e: any) => ({ value: e.id, label: e.companyName })) ?? []),
  ];
  const categoryOptions = [
    { value: '', label: 'Select category...' },
    ...(filterCategories?.map((c: any) => ({ value: c.id, label: c.parentId ? `  └ ${c.name}` : c.name })) ?? []),
  ];

  const postJobValid = postJobForm.employerId && postJobForm.categoryId && postJobForm.title.length >= 5 && postJobForm.description.length >= 50 && postJobForm.emirate;

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Stats bar */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Jobs', value: statsData.totalJobs ?? 0, color: 'bg-gray-50 text-gray-700' },
            { label: 'Published', value: statsData.publishedJobs ?? 0, color: 'bg-green-50 text-green-700' },
            { label: 'Pending Approval', value: statsData.pendingJobs ?? 0, color: 'bg-amber-50 text-amber-700' },
            { label: 'Total Applications', value: statsData.totalApplications ?? 0, color: 'bg-brand-50 text-brand-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border border-gray-200 px-4 py-3 ${color}`}>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500">Moderate, manage and post job listings</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => setBulkModal(true)} className="text-amber-700 border-amber-300 hover:bg-amber-50">
              <CheckCircle className="h-4 w-4" /> Bulk action ({selected.size})
            </Button>
          )}
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setPostJobModal(true)}>
            Post Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
        {/* Search row */}
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by job title or company..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <div className="w-40">
            <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
          </div>
          <div className="w-44">
            <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} options={categoryFilterOptions} />
          </div>
          <div className="w-36">
            <Select value={emirateFilter} onChange={(e) => { setEmirateFilter(e.target.value); setPage(1); }} options={emirateFilterOptions} />
          </div>
          <div className="w-40 flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} options={SORT_OPTIONS} />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 ml-1">
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <button onClick={toggleAll} className="text-gray-400 hover:text-gray-600">
                        {allSelected ? <CheckSquare className="h-4 w-4 text-brand-600" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Job</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Views / Apps</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Posted</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.items?.map((job: Job) => (
                    <tr key={job.id} className={`hover:bg-gray-50 ${selected.has(job.id) ? 'bg-brand-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleOne(job.id)} className="text-gray-400 hover:text-brand-600">
                          {selected.has(job.id) ? <CheckSquare className="h-4 w-4 text-brand-600" /> : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {job.isFeatured && <Star className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" />}
                          <div className="min-w-0">
                            <button onClick={() => setPreviewJob(job)} className="font-medium text-gray-900 hover:text-brand-600 text-left truncate block max-w-[180px]">
                              {job.title}
                            </button>
                            <p className="text-xs text-gray-400 truncate">{job.employer.companyName} {job.category && <span>· {job.category.name}</span>}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs"><Eye className="h-3.5 w-3.5" />{job.viewCount}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-400"><Users className="h-3 w-3" />{job._count?.applications ?? 0} apps</div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {job.status === 'PENDING_APPROVAL' && (
                            <>
                              <button onClick={() => moderateMutation.mutate({ id: job.id, status: 'PUBLISHED' })} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50" title="Approve">
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button onClick={() => { setRejectReason(''); setRejectModal({ job }); }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Reject">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {/* Featured toggle */}
                          <button
                            onClick={() => featureMutation.mutate(job.id)}
                            className={`p-1.5 rounded-lg transition-colors ${job.isFeatured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-gray-300 hover:bg-gray-100 hover:text-yellow-400'}`}
                            title={job.isFeatured ? 'Remove featured' : 'Mark as featured'}
                          >
                            <Star className="h-4 w-4" fill={job.isFeatured ? 'currentColor' : 'none'} />
                          </button>
                          <button onClick={() => setPreviewJob(job)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" title="Preview">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Delete "${job.title}"?`)) deleteMutation.mutate(job.id); }}
                            className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* ── Post Job Modal ─────────────────────────────────────────────────── */}
      <Modal isOpen={postJobModal} onClose={() => { setPostJobModal(false); setPostJobForm({ ...emptyForm }); }} title="Post a Job" size="xl">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employer <span className="text-red-500">*</span></label>
              <select
                value={postJobForm.employerId}
                onChange={(e) => setPostJobForm((p) => ({ ...p, employerId: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {employerOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
              <select
                value={postJobForm.categoryId}
                onChange={(e) => setPostJobForm((p) => ({ ...p, categoryId: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
            <input
              value={postJobForm.title}
              onChange={(e) => setPostJobForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Senior Software Engineer"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emirate <span className="text-red-500">*</span></label>
              <select
                value={postJobForm.emirate}
                onChange={(e) => setPostJobForm((p) => ({ ...p, emirate: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {EMIRATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select
                value={postJobForm.workMode}
                onChange={(e) => setPostJobForm((p) => ({ ...p, workMode: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {WORK_MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select
                value={postJobForm.employmentType}
                onChange={(e) => setPostJobForm((p) => ({ ...p, employmentType: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {EMPLOYMENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
            <input
              value={postJobForm.location}
              onChange={(e) => setPostJobForm((p) => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Dubai Marina, Dubai"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min (AED/mo)</label>
              <input
                type="number"
                value={postJobForm.salaryMin}
                onChange={(e) => setPostJobForm((p) => ({ ...p, salaryMin: e.target.value }))}
                placeholder="e.g. 5000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max (AED/mo)</label>
              <input
                type="number"
                value={postJobForm.salaryMax}
                onChange={(e) => setPostJobForm((p) => ({ ...p, salaryMax: e.target.value }))}
                placeholder="e.g. 10000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
            <input
              value={postJobForm.skills}
              onChange={(e) => setPostJobForm((p) => ({ ...p, skills: e.target.value }))}
              placeholder="e.g. React, TypeScript, Node.js"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-2">(min 50 characters)</span>
            </label>
            <textarea
              value={postJobForm.description}
              onChange={(e) => setPostJobForm((p) => ({ ...p, description: e.target.value }))}
              rows={6}
              placeholder="Describe the role, responsibilities, and requirements..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">{postJobForm.description.length} / 50 min characters</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={postJobForm.isFeatured} onChange={(e) => setPostJobForm((p) => ({ ...p, isFeatured: e.target.checked }))} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600" />
            </label>
            <span className="text-sm text-gray-600 flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" /> Mark as featured</span>
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-2.5 text-sm text-brand-700 flex items-center gap-2">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            This job will be immediately published without going through the approval queue.
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => { setPostJobModal(false); setPostJobForm({ ...emptyForm }); }}>Cancel</Button>
            <Button
              onClick={() => createJobMutation.mutate(postJobForm)}
              loading={createJobMutation.isPending}
              disabled={!postJobValid}
            >
              <Plus className="h-4 w-4" /> Post & Publish Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Job preview modal */}
      <Modal isOpen={!!previewJob} onClose={() => setPreviewJob(null)} title="Job Preview" size="xl">
        {previewJob && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{previewJob.title}</h2>
                <p className="text-sm text-gray-600 mt-0.5">{previewJob.employer.companyName}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <JobStatusBadge status={previewJob.status} />
                {previewJob.isFeatured && (
                  <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Star className="h-3 w-3" fill="currentColor" /> Featured
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500 border-y border-gray-100 py-3">
              {previewJob.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{previewJob.location}</span>}
              {previewJob.employmentType && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{previewJob.employmentType}</span>}
              {(previewJob.salaryMin || previewJob.salaryMax) && (
                <span>AED {previewJob.salaryMin?.toLocaleString()} – {previewJob.salaryMax?.toLocaleString()}/mo</span>
              )}
              {previewJob.category && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{previewJob.category.name}</span>}
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-gray-900">{previewJob.viewCount}</p>
                <p className="text-xs text-gray-500">Views</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-lg font-bold text-gray-900">{previewJob._count?.applications ?? 0}</p>
                <p className="text-xs text-gray-500">Applications</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-bold text-gray-900">{new Date(previewJob.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">Posted</p>
              </div>
            </div>

            {previewJob.description && (
              <div className="text-sm text-gray-700 max-h-48 overflow-y-auto bg-gray-50 rounded-lg p-4 leading-relaxed whitespace-pre-line">
                {previewJob.description.slice(0, 800)}{previewJob.description.length > 800 ? '…' : ''}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {previewJob.status === 'PENDING_APPROVAL' && (
                <>
                  <Button size="sm" onClick={() => moderateMutation.mutate({ id: previewJob.id, status: 'PUBLISHED' })} loading={moderateMutation.isPending}>
                    <CheckCircle className="h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => { setRejectReason(''); setRejectModal({ job: previewJob }); setPreviewJob(null); }}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                </>
              )}
              {previewJob.status === 'PUBLISHED' && (
                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => moderateMutation.mutate({ id: previewJob.id, status: 'REJECTED' })} loading={moderateMutation.isPending}>
                  <XCircle className="h-4 w-4" /> Take Down
                </Button>
              )}
              <Button size="sm" variant="outline"
                className={previewJob.isFeatured ? 'text-yellow-600 border-yellow-200' : 'text-gray-600'}
                onClick={() => { featureMutation.mutate(previewJob.id); setPreviewJob(null); }}>
                <Star className="h-4 w-4" fill={previewJob.isFeatured ? 'currentColor' : 'none'} />
                {previewJob.isFeatured ? 'Unfeature' : 'Feature'}
              </Button>
              {previewJob.slug && (
                <a href={`/jobs/${previewJob.slug}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline ml-auto">
                  View on site <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Job" size="sm">
        {rejectModal && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Rejecting: <span className="font-medium">{rejectModal.job.title}</span></p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Policy violation, inappropriate content..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setRejectModal(null)}>Cancel</Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => moderateMutation.mutate({ id: rejectModal.job.id, status: 'REJECTED', notes: rejectReason || undefined })}
                loading={moderateMutation.isPending}>
                Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk action modal */}
      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title={`Bulk Moderate (${selected.size} jobs)`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{pendingSelected.length} of {selected.size} selected jobs are pending approval.</p>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1"
              onClick={() => bulkMutation.mutate({ jobIds: pendingSelected.length > 0 ? pendingSelected : [...selected], action: 'PUBLISHED' })}
              loading={bulkMutation.isPending} disabled={pendingSelected.length === 0}>
              <CheckCircle className="h-4 w-4" /> Approve Pending ({pendingSelected.length})
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Or reject all selected with note:</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="Reason..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 mt-2 w-full"
              onClick={() => bulkMutation.mutate({ jobIds: [...selected], action: 'REJECTED', notes: rejectReason || undefined })}
              loading={bulkMutation.isPending}>
              <XCircle className="h-4 w-4" /> Reject Selected ({selected.size})
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setBulkModal(false)} className="w-full">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
