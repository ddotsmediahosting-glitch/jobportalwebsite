import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ShieldAlert, X, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';

interface AuditLog {
  id: string;
  action: string;
  actorRole: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  actor: { email: string; role: string };
}

function actionColor(action: string): string {
  if (action.includes('DELETE') || action.includes('REJECT') || action.includes('BAN')) return 'bg-red-50 text-red-700';
  if (action.includes('APPROVED') || action.includes('PUBLISHED') || action.includes('ACTIVE') || action.includes('VERIFY')) return 'bg-green-50 text-green-700';
  if (action.includes('SUSPENDED') || action.includes('STATUS')) return 'bg-yellow-50 text-yellow-700';
  if (action.includes('BULK')) return 'bg-purple-50 text-purple-700';
  if (action.includes('SETTINGS') || action.includes('UPDATE')) return 'bg-blue-50 text-blue-700';
  if (action.includes('RESET') || action.includes('PASSWORD')) return 'bg-orange-50 text-orange-700';
  return 'bg-gray-100 text-gray-600';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'USER', label: 'User actions' },
  { value: 'JOB', label: 'Job actions' },
  { value: 'EMPLOYER', label: 'Employer actions' },
  { value: 'REPORT', label: 'Report actions' },
  { value: 'SETTINGS', label: 'Settings changes' },
  { value: 'BULK', label: 'Bulk actions' },
];

function AuditLogsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
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

export function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, search, actionFilter],
    queryFn: () =>
      api.get(`/admin/audit-logs?page=${page}&limit=50${search ? `&action=${encodeURIComponent(search)}` : ''}${actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : ''}`).then((r) => r.data.data),
  });

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500">Admin action history for accountability and compliance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="flex gap-2 flex-1 min-w-[200px] max-w-sm"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search action..."
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

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {ACTION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <AuditLogsSkeleton />
      ) : (
        <>
          {/* Timeline view */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Admin</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Target</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-700">When</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.items?.map((log: AuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-gray-700 truncate max-w-[140px]">{log.actor?.email}</p>
                        <p className="text-xs text-gray-400">{log.actor?.role}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs font-medium text-gray-600">{log.targetType}</span>
                        {log.targetId && (
                          <span className="text-xs text-gray-300 ml-1">
                            · {log.targetId.length > 20 ? log.targetId.slice(0, 8) + '…' : log.targetId}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">{timeAgo(log.createdAt)}</p>
                        <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString('en-AE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <button
                            onClick={() => setSelected(log)}
                            className="text-xs text-brand-600 hover:underline"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data?.items?.length && (
                <EmptyState
                  illustration="generic"
                  title="No audit logs"
                  description="System activity will be recorded here."
                  className="py-8"
                />
              )}
            </div>
          </div>
          <Pagination page={page} totalPages={data?.totalPages} total={data?.total} limit={data?.limit} onPageChange={setPage} />
        </>
      )}

      {/* Metadata detail modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Log Details" size="md">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Action</p>
                <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(selected.action)}`}>
                  {selected.action.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Admin</p>
                <p className="font-medium">{selected.actor?.email}</p>
                <p className="text-xs text-gray-400">{selected.actor?.role}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Target</p>
                <p className="font-medium">{selected.targetType}</p>
                {selected.targetId && <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">{selected.targetId}</p>}
              </div>
              <div>
                <p className="text-xs text-gray-400">Timestamp</p>
                <p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </div>
            {selected.metadata && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Metadata</p>
                <pre className="text-xs bg-gray-50 border border-gray-100 p-3 rounded-lg overflow-auto max-h-64 leading-relaxed">
                  {JSON.stringify(selected.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
