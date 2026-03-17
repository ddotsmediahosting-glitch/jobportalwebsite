import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Search, MoreVertical, ShieldOff, ShieldCheck, Trash2, KeyRound,
  Download, CheckSquare, Square, Users as UsersIcon, X, UserPlus, Copy, Eye, EyeOff,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'BANNED', label: 'Banned' },
  { value: 'PENDING_VERIFICATION', label: 'Pending verification' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'SEEKER', label: 'Seeker' },
  { value: 'EMPLOYER', label: 'Employer' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUB_ADMIN', label: 'Sub-Admin' },
];

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  seekerProfile?: { firstName: string; lastName: string } | null;
  ownedEmployer?: { companyName: string; verificationStatus: string } | null;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    SUSPENDED: 'bg-yellow-50 text-yellow-700',
    BANNED: 'bg-red-50 text-red-700',
    PENDING_VERIFICATION: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
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

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
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

export function AdminUsers() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('SUSPENDED');
  // Sub-admin creation
  const [subAdminModal, setSubAdminModal] = useState(false);
  const [subAdminForm, setSubAdminForm] = useState({ email: '', password: '' });
  const [showSubAdminPass, setShowSubAdminPass] = useState(false);
  // Reset password result
  const [resetResult, setResetResult] = useState<{ email: string; password: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, statusFilter, roleFilter],
    queryFn: () =>
      api.get(`/admin/users?page=${page}&limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`).then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status updated.'); setMenuOpen(null); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: { id: string; email: string }) => {
      const tempPass = 'Temp#' + Math.random().toString(36).slice(2, 10);
      return api.post(`/admin/users/${payload.id}/reset-password`, { newPassword: tempPass })
        .then(() => ({ email: payload.email, password: tempPass }));
    },
    onSuccess: (data) => { setResetResult(data); setMenuOpen(null); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const createSubAdminMutation = useMutation({
    mutationFn: (form: { email: string; password: string }) =>
      api.post('/admin/users/sub-admin', form).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Sub-Admin account created.');
      setSubAdminModal(false);
      setSubAdminForm({ email: '', password: '' });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted.'); setMenuOpen(null); setDetailUser(null); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ userIds, status }: { userIds: string[]; status: string }) =>
      api.post('/admin/users/bulk-status', { userIds, status }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(res.data.message ?? 'Bulk update done.');
      setSelected(new Set());
      setBulkModal(false);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/admin/users/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded.');
    } catch {
      toast.error('Export failed.');
    }
  };

  const allIds: string[] = data?.items?.map((u: User) => u.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Manage platform users</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkModal(true)}
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
            >
              <UsersIcon className="h-4 w-4" /> Bulk action ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button size="sm" icon={<UserPlus className="h-4 w-4" />} onClick={() => setSubAdminModal(true)}>
            Create Sub-Admin
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2 flex-1 min-w-[200px]"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <div className="w-44">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
        <div className="w-40">
          <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} options={ROLE_OPTIONS} />
        </div>
      </div>

      {isLoading ? (
        <UsersSkeleton />
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
                    <th className="text-left px-4 py-3 font-medium text-gray-700">User</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Joined</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Last Login</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.items?.map((user: User) => (
                    <tr key={user.id} className={`hover:bg-gray-50 ${selected.has(user.id) ? 'bg-brand-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleOne(user.id)} className="text-gray-400 hover:text-brand-600">
                          {selected.has(user.id)
                            ? <CheckSquare className="h-4 w-4 text-brand-600" />
                            : <Square className="h-4 w-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setDetailUser(user)} className="text-left">
                          <p className="font-medium text-brand-600 hover:underline truncate max-w-[200px]">{user.email}</p>
                          {user.seekerProfile && (
                            <p className="text-xs text-gray-400">{user.seekerProfile.firstName} {user.seekerProfile.lastName}</p>
                          )}
                          {user.ownedEmployer && (
                            <p className="text-xs text-gray-400">{user.ownedEmployer.companyName}</p>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {menuOpen === user.id && (
                              <div className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[180px]">
                                {user.status === 'ACTIVE' ? (
                                  <button
                                    onClick={() => statusMutation.mutate({ id: user.id, status: 'SUSPENDED' })}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                                  >
                                    <ShieldOff className="h-4 w-4" /> Suspend
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                                  >
                                    <ShieldCheck className="h-4 w-4" /> Activate
                                  </button>
                                )}
                                <button
                                  onClick={() => statusMutation.mutate({ id: user.id, status: 'BANNED' })}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                                >
                                  <ShieldOff className="h-4 w-4" /> Ban
                                </button>
                                <button
                                  onClick={() => resetPasswordMutation.mutate({ id: user.id, email: user.email })}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                                >
                                  <KeyRound className="h-4 w-4" /> Reset Password
                                </button>
                                <hr className="my-1 border-gray-100" />
                                <button
                                  onClick={() => { if (confirm('Delete this user permanently?')) deleteMutation.mutate(user.id); }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.items?.length && (
                <EmptyState illustration="generic" title="No users found" description="Try adjusting your search or filters." className="py-12" />
              )}
            </div>
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!detailUser} onClose={() => setDetailUser(null)} title="User Details" size="lg">
        {detailUser && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <InfoRow label="Email" value={detailUser.email} />
              <InfoRow label="Role" value={detailUser.role} />
              <InfoRow label="Status" value={detailUser.status} />
              <InfoRow label="Joined" value={new Date(detailUser.createdAt).toLocaleString()} />
              {detailUser.lastLoginAt && (
                <InfoRow label="Last Login" value={new Date(detailUser.lastLoginAt).toLocaleString()} />
              )}
              {detailUser.seekerProfile && (
                <InfoRow label="Name" value={`${detailUser.seekerProfile.firstName} ${detailUser.seekerProfile.lastName}`} />
              )}
              {detailUser.ownedEmployer && (
                <InfoRow label="Company" value={detailUser.ownedEmployer.companyName} />
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate({ id: detailUser.id, status: detailUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                loading={statusMutation.isPending}
              >
                {detailUser.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => resetPasswordMutation.mutate({ id: detailUser.id, email: detailUser.email })} loading={resetPasswordMutation.isPending}>
                Reset Password
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={() => { if (confirm('Delete permanently?')) deleteMutation.mutate(detailUser.id); }}
                loading={deleteMutation.isPending}
              >
                Delete User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk action modal */}
      <Modal isOpen={bulkModal} onClose={() => setBulkModal(false)} title={`Bulk Update (${selected.size} users)`} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Set status for all {selected.size} selected users:</p>
          <Select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'BANNED', label: 'Banned' },
            ]}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setBulkModal(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => bulkMutation.mutate({ userIds: [...selected], status: bulkStatus })}
              loading={bulkMutation.isPending}
            >
              Apply to {selected.size} users
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Sub-Admin modal */}
      <Modal isOpen={subAdminModal} onClose={() => setSubAdminModal(false)} title="Create Sub-Admin Account" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Sub-admins can manage users, jobs, and employers but cannot create other admins.</p>
          <Input
            label="Email address"
            type="email"
            value={subAdminForm.email}
            onChange={(e) => setSubAdminForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="subadmin@example.com"
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showSubAdminPass ? 'text' : 'password'}
              value={subAdminForm.password}
              onChange={(e) => setSubAdminForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Minimum 8 characters"
              required
            />
            <button
              type="button"
              onClick={() => setShowSubAdminPass(!showSubAdminPass)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showSubAdminPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={() => setSubAdminModal(false)}>Cancel</Button>
            <Button
              size="sm"
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => createSubAdminMutation.mutate(subAdminForm)}
              loading={createSubAdminMutation.isPending}
              disabled={!subAdminForm.email || !subAdminForm.password}
            >
              Create Sub-Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password reset result modal */}
      <Modal isOpen={!!resetResult} onClose={() => setResetResult(null)} title="Password Reset" size="sm">
        {resetResult && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm font-medium text-green-800 mb-1">Password successfully reset for:</p>
              <p className="text-sm text-green-700 font-mono">{resetResult.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Temporary password (share securely):</p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="flex-1 font-mono text-sm text-gray-900">{resetResult.password}</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(resetResult.password); toast.success('Copied!'); }}
                  className="text-gray-400 hover:text-brand-600 flex-shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">The user must change this password on next login.</p>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setResetResult(null)}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
