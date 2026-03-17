import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'DISMISSED', label: 'Dismissed' },
];

interface Report {
  id: string;
  reason: string;
  details?: string;
  status: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  reporter: { email: string };
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  RESOLVED: 'bg-green-50 text-green-700',
  DISMISSED: 'bg-gray-100 text-gray-600',
};

function ReportsSkeleton() {
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

export function AdminReports() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [selected, setSelected] = useState<Report | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page, statusFilter],
    queryFn: () =>
      api.get(`/admin/reports?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data.data),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      api.patch(`/admin/reports/${id}/resolve`, { status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Report updated.');
      setSelected(null);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">Review user-submitted reports.</p>
        </div>
        <div className="w-44">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
        </div>
      </div>

      {isLoading ? (
        <ReportsSkeleton />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Reason</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Reported</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((r: Report) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(r)} className="text-left">
                        <p className="font-medium text-gray-900 hover:text-brand-600">{r.reason}</p>
                        {r.details && <p className="text-xs text-gray-400 truncate max-w-[200px]">{r.details}</p>}
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r.targetType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status] || 'bg-gray-100 text-gray-600'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'PENDING' && (
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => resolveMutation.mutate({ id: r.id, status: 'RESOLVED' })}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                            title="Resolve"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => resolveMutation.mutate({ id: r.id, status: 'DISMISSED' })}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                            title="Dismiss"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.items?.length && (
              <EmptyState illustration="generic" title="No reports found" description="User-submitted reports will appear here." className="py-12" />
            )}
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Report Details" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-gray-400">Reason</p><p className="font-medium text-gray-900">{selected.reason}</p></div>
              <div><p className="text-xs text-gray-400">Target Type</p><p className="font-medium text-gray-900">{selected.targetType}</p></div>
              <div><p className="text-xs text-gray-400">Target ID</p><p className="font-medium text-gray-900 truncate">{selected.targetId}</p></div>
              <div><p className="text-xs text-gray-400">Reporter</p><p className="font-medium text-gray-900">{selected.reporter.email}</p></div>
              <div><p className="text-xs text-gray-400">Status</p><p className="font-medium text-gray-900">{selected.status}</p></div>
              <div><p className="text-xs text-gray-400">Submitted</p><p className="font-medium text-gray-900">{new Date(selected.createdAt).toLocaleString()}</p></div>
            </div>
            {selected.details && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Details</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-line">{selected.details}</p>
              </div>
            )}
            {selected.status === 'PENDING' && (
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={() => resolveMutation.mutate({ id: selected.id, status: 'RESOLVED' })}
                  loading={resolveMutation.isPending}
                  icon={<CheckCircle className="h-4 w-4" />}
                >
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveMutation.mutate({ id: selected.id, status: 'DISMISSED' })}
                  loading={resolveMutation.isPending}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
