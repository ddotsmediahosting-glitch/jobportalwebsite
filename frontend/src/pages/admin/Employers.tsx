import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, ExternalLink, Pencil, Plus, KeyRound } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input, Textarea } from '../../components/ui/Input';
import { VerificationBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

const VERIFICATION_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

const EMIRATES = [
  'DUBAI', 'ABU_DHABI', 'SHARJAH', 'AJMAN',
  'RAS_AL_KHAIMAH', 'FUJAIRAH', 'UMM_AL_QUWAIN',
];

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

interface Employer {
  id: string;
  companyName: string;
  slug: string;
  verificationStatus: string;
  industry?: string;
  emirate?: string;
  logoUrl?: string;
  tradeLicenseUrl?: string;
  createdAt: string;
  owner?: { id: string; email: string; status: string };
  _count?: { jobs: number; members: number };
  subscription?: { plan: string; status: string };
}

function EmployersSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-1/2" />
            <div className="skeleton h-3 rounded w-1/3" />
          </div>
          <div className="skeleton h-6 rounded-full w-20" />
        </div>
      ))}
    </div>
  );
}

const emptyCreateForm = {
  companyName: '',
  email: '',
  industry: '',
  emirate: '',
  website: '',
  description: '',
};

const emptyAssignLoginForm = { email: '', password: '' };

export function AdminEmployers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [verFilter, setVerFilter] = useState('');
  const [selected, setSelected] = useState<Employer | null>(null);
  const [editEmployer, setEditEmployer] = useState<Employer | null>(null);
  const [editForm, setEditForm] = useState({
    companyName: '', industry: '', description: '', website: '', emirate: '', logoUrl: '', size: '',
  });
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);

  // Assign login email state
  const [assignLoginEmployer, setAssignLoginEmployer] = useState<Employer | null>(null);
  const [assignLoginForm, setAssignLoginForm] = useState(emptyAssignLoginForm);
  const [showAssignPassword, setShowAssignPassword] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-employers', page, search, verFilter],
    queryFn: () =>
      api.get(`/admin/employers?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}${verFilter ? `&verificationStatus=${verFilter}` : ''}`).then((r) => r.data.data),
  });

  const updateEmployerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      api.patch(`/admin/employers/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-employers'] });
      toast.success('Company updated.');
      setEditEmployer(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const openEditEmployer = (emp: Employer) => {
    setEditEmployer(emp);
    setEditForm({
      companyName: emp.companyName,
      industry: emp.industry || '',
      description: '',
      website: '',
      emirate: emp.emirate || '',
      logoUrl: emp.logoUrl || '',
      size: '',
    });
  };

  const createEmployerMutation = useMutation({
    mutationFn: (data: typeof emptyCreateForm) => api.post('/admin/employers', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-employers'] });
      setCreateModal(false);
      setCreateForm(emptyCreateForm);
      setCreatedCredentials(res.data.data.credentials);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const assignLoginMutation = useMutation({
    mutationFn: ({ id, email, password }: { id: string; email: string; password?: string }) =>
      api.patch(`/admin/employers/${id}/login`, { email, password: password || undefined }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-employers'] });
      toast.success(`Login email set to ${vars.email}`);
      setAssignLoginEmployer(null);
      setAssignLoginForm(emptyAssignLoginForm);
      setShowAssignPassword(false);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      api.patch(`/admin/employers/${id}/verify`, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-employers'] });
      toast.success('Verification status updated.');
      setSelected(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const openAssignLogin = (emp: Employer) => {
    setAssignLoginEmployer(emp);
    setAssignLoginForm({ email: emp.owner?.email || '', password: '' });
    setShowAssignPassword(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employers</h1>
          <p className="text-gray-500 mt-1">Review and verify employer profiles.</p>
        </div>
        <Button onClick={() => setCreateModal(true)} icon={<Plus className="h-4 w-4" />}>
          Create Company
        </Button>
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
              placeholder="Search company name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <div className="w-48">
          <Select value={verFilter} onChange={(e) => { setVerFilter(e.target.value); setPage(1); }} options={VERIFICATION_OPTIONS} />
        </div>
      </div>

      {isLoading ? (
        <EmployersSkeleton />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Login Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Verification</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Jobs</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((emp: Employer) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 text-sm font-bold flex-shrink-0 overflow-hidden">
                          {emp.logoUrl ? <img loading="lazy" decoding="async" src={emp.logoUrl} alt="" className="w-full h-full object-cover" /> : emp.companyName[0]}
                        </div>
                        <div>
                          <button onClick={() => setSelected(emp)} className="font-medium text-gray-900 hover:text-brand-600 text-left">
                            {emp.companyName}
                          </button>
                          <p className="text-xs text-gray-400">{emp.industry}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-500 font-mono">
                        {emp.owner?.email || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {emp.subscription?.plan || 'FREE'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={emp.verificationStatus} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {emp._count?.jobs ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {emp.verificationStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={() => verifyMutation.mutate({ id: emp.id, status: 'APPROVED' })}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                              title="Verify"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason (optional):');
                                verifyMutation.mutate({ id: emp.id, status: 'REJECTED', reason: reason || undefined });
                              }}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                              title="Reject"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openAssignLogin(emp)}
                          className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50"
                          title="Assign / change login email"
                        >
                          <KeyRound className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditEmployer(emp)}
                          className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50"
                          title="Edit company"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelected(emp)}
                          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                          title="View details"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.items?.length && (
              <EmptyState illustration="generic" title="No employers found" description="Registered employers will appear here." className="py-12" />
            )}
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* ── Create Company modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={createModal}
        onClose={() => { setCreateModal(false); setCreateForm(emptyCreateForm); }}
        title="Create Company"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
            Fill in the company details. If you provide a login email now, the employer can log in immediately.
            Otherwise, credentials will be auto-generated and you can assign a real email later.
          </div>

          {/* Company info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Company Name *"
              required
              value={createForm.companyName}
              onChange={(e) => setCreateForm((p) => ({ ...p, companyName: e.target.value }))}
              placeholder="Acme Corporation"
              autoFocus
            />
            <Input
              label="Industry"
              value={createForm.industry}
              onChange={(e) => setCreateForm((p) => ({ ...p, industry: e.target.value }))}
              placeholder="e.g. Technology, Finance"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
              <select
                title="Emirate"
                value={createForm.emirate}
                onChange={(e) => setCreateForm((p) => ({ ...p, emirate: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">— Select —</option>
                {EMIRATES.map((e) => (
                  <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <Input
              label="Website"
              value={createForm.website}
              onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
              placeholder="https://company.com"
            />
          </div>
          <Textarea
            label="Description"
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            placeholder="Brief company description..."
          />

          {/* Login credentials */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Login Access</p>
            <Input
              label="Company Login Email (optional)"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="contact@company.com — leave blank to auto-generate"
              hint="If left blank, a placeholder email is generated. You can assign a real email anytime later."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={() => { setCreateModal(false); setCreateForm(emptyCreateForm); }}>
              Cancel
            </Button>
            <Button
              onClick={() => createEmployerMutation.mutate(createForm)}
              loading={createEmployerMutation.isPending}
              disabled={!createForm.companyName.trim()}
            >
              Create Company
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Generated credentials modal ───────────────────────────────────────── */}
      <Modal isOpen={!!createdCredentials} onClose={() => setCreatedCredentials(null)} title="Company Created" size="md">
        {createdCredentials && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 font-medium">
              Company account created successfully. Share these login credentials with the employer.
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Login Email</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono break-all">{createdCredentials.email}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(createdCredentials.email); toast.success('Copied!'); }}
                    className="text-xs text-brand-600 hover:underline whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono">{createdCredentials.password}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(createdCredentials.password); toast.success('Copied!'); }}
                    className="text-xs text-brand-600 hover:underline whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              You can change the login email anytime using the <KeyRound className="inline h-3 w-3" /> button on the employer row.
            </p>
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <Button onClick={() => setCreatedCredentials(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Assign Login Email modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={!!assignLoginEmployer}
        onClose={() => { setAssignLoginEmployer(null); setAssignLoginForm(emptyAssignLoginForm); setShowAssignPassword(false); }}
        title="Assign Login Access"
        size="sm"
      >
        {assignLoginEmployer && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              Setting a real email for <span className="font-semibold">{assignLoginEmployer.companyName}</span>. The employer will use this email to log in.
            </div>

            {assignLoginEmployer.owner?.email && (
              <p className="text-xs text-gray-500">
                Current login: <span className="font-mono text-gray-700">{assignLoginEmployer.owner.email}</span>
              </p>
            )}

            <Input
              label="New Login Email *"
              type="email"
              required
              value={assignLoginForm.email}
              onChange={(e) => setAssignLoginForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="contact@company.com"
              autoFocus
            />

            <div>
              <button
                type="button"
                className="text-xs text-brand-600 hover:underline"
                onClick={() => setShowAssignPassword((v) => !v)}
              >
                {showAssignPassword ? 'Hide' : '+ Also set a new password'}
              </button>
              {showAssignPassword && (
                <div className="mt-2">
                  <Input
                    label="New Password"
                    type="password"
                    value={assignLoginForm.password}
                    onChange={(e) => setAssignLoginForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="Leave blank to keep existing password"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setAssignLoginEmployer(null); setAssignLoginForm(emptyAssignLoginForm); setShowAssignPassword(false); }}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  assignLoginMutation.mutate({
                    id: assignLoginEmployer.id,
                    email: assignLoginForm.email,
                    password: assignLoginForm.password || undefined,
                  })
                }
                loading={assignLoginMutation.isPending}
                disabled={!assignLoginForm.email.trim()}
                icon={<KeyRound className="h-4 w-4" />}
              >
                Save Login Email
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Company modal ────────────────────────────────────────────────── */}
      <Modal isOpen={!!editEmployer} onClose={() => setEditEmployer(null)} title="Edit Company" size="lg">
        {editEmployer && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
              Editing: <span className="font-semibold">{editEmployer.companyName}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Company Name" value={editForm.companyName}
                onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))} />
              <Input label="Industry" value={editForm.industry}
                onChange={(e) => setEditForm((p) => ({ ...p, industry: e.target.value }))}
                placeholder="e.g. Technology, Finance" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Website" value={editForm.website}
                onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://company.com" />
              <Input label="Logo URL" value={editForm.logoUrl}
                onChange={(e) => setEditForm((p) => ({ ...p, logoUrl: e.target.value }))}
                placeholder="https://..." />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
                <select title="Emirate" value={editForm.emirate}
                  onChange={(e) => setEditForm((p) => ({ ...p, emirate: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— Select —</option>
                  {EMIRATES.map((e) => (
                    <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select title="Company Size" value={editForm.size}
                  onChange={(e) => setEditForm((p) => ({ ...p, size: e.target.value }))}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">— Select —</option>
                  {COMPANY_SIZES.map((s) => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea label="Description" value={editForm.description}
              onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
              rows={3} placeholder="Brief company description..." />
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button type="button" variant="ghost" onClick={() => setEditEmployer(null)}>Cancel</Button>
              <Button onClick={() => updateEmployerMutation.mutate({ id: editEmployer.id, data: editForm })}
                loading={updateEmployerMutation.isPending}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Detail modal ──────────────────────────────────────────────────────── */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Employer Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Company Name" value={selected.companyName} />
              <InfoRow label="Industry" value={selected.industry || '—'} />
              <InfoRow label="Emirate" value={selected.emirate || '—'} />
              <InfoRow label="Verification" value={selected.verificationStatus} />
              <InfoRow label="Login Email" value={selected.owner?.email || '—'} />
              <InfoRow label="Plan" value={selected.subscription?.plan || 'FREE'} />
              <InfoRow label="Jobs Posted" value={String(selected._count?.jobs ?? 0)} />
              <InfoRow label="Team Members" value={String(selected._count?.members ?? 0)} />
              <InfoRow label="Joined" value={new Date(selected.createdAt).toLocaleDateString()} />
            </div>
            {selected.tradeLicenseUrl && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Trade License</p>
                <a href={selected.tradeLicenseUrl} target="_blank" rel="noreferrer"
                  className="text-sm text-brand-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3.5 w-3.5" /> View document
                </a>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSelected(null); openAssignLogin(selected); }}
                icon={<KeyRound className="h-4 w-4" />}
              >
                Assign Login Email
              </Button>
              {selected.verificationStatus !== 'APPROVED' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => verifyMutation.mutate({ id: selected.id, status: 'APPROVED' })}
                    loading={verifyMutation.isPending}
                    icon={<CheckCircle className="h-4 w-4" />}
                  >
                    Verify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      const reason = prompt('Rejection reason (optional):');
                      verifyMutation.mutate({ id: selected.id, status: 'REJECTED', reason: reason || undefined });
                    }}
                    loading={verifyMutation.isPending}
                    icon={<XCircle className="h-4 w-4" />}
                  >
                    Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
