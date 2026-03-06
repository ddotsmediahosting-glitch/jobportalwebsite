import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, FileText, Star, Calendar, MessageSquare } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';
import { Pagination } from '../../components/Pagination';

const APPLICATION_STATUSES = ['SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

interface Application {
  id: string;
  status: string;
  createdAt: string;
  rating?: number;
  notes?: string;
  coverLetter?: string;
  user: { email: string; seekerProfile?: { firstName: string; lastName: string; headline?: string; avatarUrl?: string; skills: string[] } };
  job: { id: string; title: string };
  resume?: { fileUrl: string; fileName: string };
}

export function ApplicationsPipeline() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['employer-applications', page, statusFilter],
    queryFn: () =>
      api.get(`/employer/applications?page=${page}${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/employer/applications/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-applications'] }); toast.success('Status updated'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.patch(`/employer/applications/${id}/notes`, { notes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-applications'] }); toast.success('Notes saved'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const statusOptions = APPLICATION_STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ') }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={statusOptions}
            placeholder="All statuses"
          />
        </div>
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !data?.items?.length ? (
        <div className="text-center py-20 text-gray-400">No applications yet.</div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Candidate</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Applied</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((app: Application) => {
                  const name = app.user.seekerProfile
                    ? `${app.user.seekerProfile.firstName} ${app.user.seekerProfile.lastName}`
                    : app.user.email;

                  return (
                    <tr key={app.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedApp(app); setNotesInput(app.notes || ''); }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xs font-bold flex-shrink-0">
                            {name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{name}</p>
                            {app.user.seekerProfile?.headline && (
                              <p className="text-xs text-gray-400 truncate max-w-[180px]">{app.user.seekerProfile.headline}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{app.job.title}</td>
                      <td className="px-4 py-3"><ApplicationStatusBadge status={app.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden md:table-cell">{new Date(app.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={app.status}
                            onChange={(e) => statusMutation.mutate({ id: app.id, status: e.target.value })}
                            className="text-xs border border-gray-200 rounded px-2 py-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
        </>
      )}

      {/* Detail modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Detail" size="lg">
        {selectedApp && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 text-xl font-bold">
                {(selectedApp.user.seekerProfile?.firstName || selectedApp.user.email)[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedApp.user.seekerProfile
                    ? `${selectedApp.user.seekerProfile.firstName} ${selectedApp.user.seekerProfile.lastName}`
                    : selectedApp.user.email}
                </h3>
                <p className="text-sm text-gray-500">{selectedApp.user.seekerProfile?.headline}</p>
                <ApplicationStatusBadge status={selectedApp.status} />
              </div>
            </div>

            {selectedApp.resume && (
              <a href={selectedApp.resume.fileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-sm text-brand-600 hover:underline">
                <FileText className="h-4 w-4" /> {selectedApp.resume.fileName}
              </a>
            )}

            {selectedApp.coverLetter && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Cover Letter</p>
                <p className="text-sm text-gray-700 whitespace-pre-line bg-gray-50 p-3 rounded-lg">{selectedApp.coverLetter}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Notes (internal)</p>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y"
                placeholder="Add internal notes..."
              />
              <Button size="sm" variant="secondary" className="mt-2"
                onClick={() => notesMutation.mutate({ id: selectedApp.id, notes: notesInput })}>
                Save Notes
              </Button>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {APPLICATION_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => statusMutation.mutate({ id: selectedApp.id, status: s })}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      selectedApp.status === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
