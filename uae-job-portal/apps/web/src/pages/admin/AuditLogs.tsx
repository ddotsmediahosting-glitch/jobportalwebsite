import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/Pagination';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  admin: { email: string };
}

const ACTION_COLORS: Record<string, string> = {
  USER_STATUS_CHANGE: 'bg-yellow-50 text-yellow-700',
  USER_DELETE: 'bg-red-50 text-red-700',
  EMPLOYER_VERIFY: 'bg-green-50 text-green-700',
  EMPLOYER_REJECT: 'bg-red-50 text-red-700',
  JOB_APPROVE: 'bg-green-50 text-green-700',
  JOB_REJECT: 'bg-red-50 text-red-700',
  JOB_FEATURE: 'bg-brand-50 text-brand-700',
  REPORT_RESOLVE: 'bg-green-50 text-green-700',
  REPORT_DISMISS: 'bg-gray-100 text-gray-600',
  SETTINGS_UPDATE: 'bg-blue-50 text-blue-700',
  SUBSCRIPTION_OVERRIDE: 'bg-purple-50 text-purple-700',
};

export function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, search],
    queryFn: () =>
      api.get(`/admin/audit-logs?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`).then((r) => r.data.data),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">Admin action history for accountability and compliance.</p>
      </div>

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
        className="flex gap-2 mb-4 max-w-md"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search action or admin email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">Search</Button>
      </form>

      {isLoading ? (
        <PageSpinner />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Admin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Target</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Time</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((log: AuditLog) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{log.admin.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-400">{log.targetType}</span>
                      {log.targetId && <span className="text-xs text-gray-300 ml-1">· {log.targetId.slice(0, 8)}…</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setSelected(log)}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            View
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data?.items?.length && (
              <div className="text-center py-16 text-gray-400">
                <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No audit logs found.
              </div>
            )}
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* Metadata modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Log Metadata">
        {selected && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-gray-400">Action</p><p className="font-medium">{selected.action}</p></div>
              <div><p className="text-xs text-gray-400">Admin</p><p className="font-medium">{selected.admin.email}</p></div>
              <div><p className="text-xs text-gray-400">Target</p><p className="font-medium">{selected.targetType} · {selected.targetId}</p></div>
              <div><p className="text-xs text-gray-400">Time</p><p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p></div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Metadata</p>
              <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-64">
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
