import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, MoreVertical, ShieldOff, ShieldCheck, Trash2, KeyRound } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

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

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, statusFilter, roleFilter],
    queryFn: () =>
      api.get(`/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}${roleFilter ? `&role=${roleFilter}` : ''}`).then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User status updated.'); setMenuOpen(null); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/reset-password`),
    onSuccess: (res) => {
      toast.success(`Reset link sent. Temp password: ${res.data.data?.tempPassword || 'sent via email'}`);
      setMenuOpen(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('User deleted.'); setMenuOpen(null); setDetailUser(null); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage all platform users.</p>
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
              placeholder="Search by email..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <div className="w-44">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
        <div className="w-40">
          <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} options={ROLE_OPTIONS} />
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
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Joined</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((user: User) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailUser(user)} className="text-left hover:underline text-brand-600 font-medium">
                        {user.email}
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                        user.status === 'SUSPENDED' ? 'bg-yellow-50 text-yellow-700' :
                        user.status === 'BANNED' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
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
                                  <ShieldOff className="h-4 w-4" /> Suspend User
                                </button>
                              ) : (
                                <button
                                  onClick={() => statusMutation.mutate({ id: user.id, status: 'ACTIVE' })}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                                >
                                  <ShieldCheck className="h-4 w-4" /> Activate User
                                </button>
                              )}
                              <button
                                onClick={() => statusMutation.mutate({ id: user.id, status: 'BANNED' })}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                              >
                                <ShieldOff className="h-4 w-4" /> Ban User
                              </button>
                              <button
                                onClick={() => resetPasswordMutation.mutate(user.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50"
                              >
                                <KeyRound className="h-4 w-4" /> Reset Password
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={() => { if (confirm('Delete this user permanently?')) deleteMutation.mutate(user.id); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" /> Delete User
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
              <div className="text-center py-16 text-gray-400">No users found.</div>
            )}
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
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => statusMutation.mutate({ id: detailUser.id, status: detailUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                loading={statusMutation.isPending}
              >
                {detailUser.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => resetPasswordMutation.mutate(detailUser.id)} loading={resetPasswordMutation.isPending}>
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
