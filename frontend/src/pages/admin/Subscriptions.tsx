import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CreditCard, Building2, Edit2, Check, X } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';

interface Subscription {
  id: string;
  employerId: string;
  plan: string;
  status: string;
  jobPostsLimit: number;
  jobPostsUsed: number;
  featuredPostsLimit: number;
  featuredPostsUsed: number;
  candidateSearchEnabled: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  employer: { companyName: string; slug: string };
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-50 text-blue-700',
  PROFESSIONAL: 'bg-purple-50 text-purple-700',
  ENTERPRISE: 'bg-amber-50 text-amber-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  TRIAL: 'bg-blue-50 text-blue-700',
  EXPIRED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit === 0 ? 0 : Math.min((used / limit) * 100, 100);
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{used}/{limit}</span>
    </div>
  );
}

function SubscriptionsSkeleton() {
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

export function AdminSubscriptions() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [editSub, setEditSub] = useState<Subscription | null>(null);
  const [form, setForm] = useState({ jobPostsLimit: 0, featuredPostsLimit: 0, candidateSearchEnabled: false, plan: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', page],
    queryFn: () => api.get(`/admin/subscriptions?page=${page}&limit=20`).then((r) => r.data.data),
  });

  const overrideMutation = useMutation({
    mutationFn: ({ employerId, data }: { employerId: string; data: typeof form }) =>
      api.patch(`/admin/subscriptions/${employerId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success('Subscription updated.');
      setEditSub(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const openEdit = (sub: Subscription) => {
    setForm({
      jobPostsLimit: sub.jobPostsLimit,
      featuredPostsLimit: sub.featuredPostsLimit,
      candidateSearchEnabled: sub.candidateSearchEnabled,
      plan: sub.plan,
    });
    setEditSub(sub);
  };

  // Aggregate stats
  const stats = data ? {
    total: data.total,
    active: data.items?.filter((s: Subscription) => s.status === 'ACTIVE').length ?? 0,
    paid: data.items?.filter((s: Subscription) => s.plan !== 'FREE').length ?? 0,
  } : null;

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500">Manage employer plans and limits</p>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl"><CreditCard className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Total Subscriptions</p>
              <p className="text-xl font-bold text-gray-900">{data.total}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-xl"><Check className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Active (this page)</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-xl"><Building2 className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-gray-500">Paid plans (this page)</p>
              <p className="text-xl font-bold text-gray-900">{stats.paid}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <SubscriptionsSkeleton />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Company</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Job Posts</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Featured</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Search</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden xl:table-cell">Expires</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.items?.map((sub: Subscription) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[160px]">{sub.employer.companyName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PLAN_COLORS[sub.plan] ?? 'bg-gray-100 text-gray-600'}`}>
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[sub.status] ?? 'bg-gray-100 text-gray-500'}`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell w-36">
                        <UsageBar used={sub.jobPostsUsed} limit={sub.jobPostsLimit} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell w-32">
                        <UsageBar used={sub.featuredPostsUsed} limit={sub.featuredPostsLimit} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {sub.candidateSearchEnabled ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-gray-400">
                        {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => openEdit(sub)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          title="Edit limits"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.items?.length && (
                <EmptyState illustration="generic" title="No subscriptions found" className="py-12" />
              )}
            </div>
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* Edit modal */}
      <Modal isOpen={!!editSub} onClose={() => setEditSub(null)} title="Override Subscription" size="sm">
        {editSub && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">{editSub.employer.companyName}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Job Post Limit</label>
                  <input
                    type="number"
                    value={form.jobPostsLimit}
                    onChange={(e) => setForm({ ...form, jobPostsLimit: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Featured Limit</label>
                  <input
                    type="number"
                    value={form.featuredPostsLimit}
                    onChange={(e) => setForm({ ...form, featuredPostsLimit: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="candidateSearch"
                  checked={form.candidateSearchEnabled}
                  onChange={(e) => setForm({ ...form, candidateSearchEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="candidateSearch" className="text-sm text-gray-700">Candidate search enabled</label>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setEditSub(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => overrideMutation.mutate({ employerId: editSub.employerId, data: form })}
                loading={overrideMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
