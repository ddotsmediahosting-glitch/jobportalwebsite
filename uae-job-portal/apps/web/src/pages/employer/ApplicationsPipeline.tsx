import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, FileText, Star, Calendar, MessageSquare, Sparkles, Loader2, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
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

interface ScreenResult {
  applicationId: string; candidateName: string; fitScore: number;
  fitLabel: string; matchingStrengths: string[]; gaps: string[];
  recommendation: string; priority: 'shortlist' | 'review' | 'reject';
}

const FIT_COLORS: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-800',
  Good: 'bg-blue-100 text-blue-800',
  Fair: 'bg-amber-100 text-amber-800',
  Poor: 'bg-red-100 text-red-800',
};
const PRIORITY_COLORS: Record<string, string> = {
  shortlist: 'text-green-600', review: 'text-amber-600', reject: 'text-red-500',
};
const SCORE_BG: (score: number) => string = (score) => {
  if (score >= 75) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 55) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (score >= 35) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

export function ApplicationsPipeline() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [screenJobId, setScreenJobId] = useState('');
  const [screenResults, setScreenResults] = useState<ScreenResult[] | null>(null);
  const [screenOpen, setScreenOpen] = useState(false);
  const qc = useQueryClient();

  // Fetch persisted screening results for the selected job
  const { data: savedResults, refetch: refetchSaved } = useQuery<ScreenResult[]>({
    queryKey: ['screening-results', screenJobId],
    queryFn: () => api.get(`/ai/screening-results/${screenJobId}`).then(r => r.data.data),
    enabled: !!screenJobId,
    staleTime: 60_000,
  });

  // Build a lookup map: applicationId → ScreenResult
  const resultMap = React.useMemo(() => {
    const map: Record<string, ScreenResult> = {};
    (savedResults || []).forEach(r => { map[r.applicationId] = r; });
    return map;
  }, [savedResults]);

  const screenMutation = useMutation({
    mutationFn: (jobId: string) => api.post(`/ai/screen-applications/${jobId}`).then(r => r.data.data),
    onSuccess: (data) => {
      setScreenResults(data);
      setScreenOpen(true);
      qc.invalidateQueries({ queryKey: ['screening-results', screenJobId] });
      toast.success(`Screened ${data.length} applications`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

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

  // Collect unique job IDs from applications for AI screening
  const jobOptions = data?.items
    ? Array.from(new Map(data.items.map((a: Application) => [a.job.id, a.job.title])).entries())
        .map(([id, title]) => ({ value: id as string, label: title as string }))
    : [];

  // Whether cached results exist for selected job
  const hasSavedResults = savedResults && savedResults.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* AI Screener */}
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2">
            <Sparkles size={15} className="text-violet-600 flex-shrink-0" />
            <select
              value={screenJobId}
              onChange={e => setScreenJobId(e.target.value)}
              className="text-xs border-none bg-transparent text-violet-700 font-medium focus:outline-none"
            >
              <option value="">Select job to screen...</option>
              {jobOptions.map(j => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
            {hasSavedResults && (
              <button
                onClick={() => { setScreenResults(savedResults!); setScreenOpen(true); }}
                className="flex items-center gap-1 text-violet-600 text-xs px-2 py-1.5 rounded-lg hover:bg-violet-100 transition-colors font-medium"
                title="View saved results"
              >
                <TrendingUp size={12} /> Results
              </button>
            )}
            <button
              onClick={() => screenJobId && screenMutation.mutate(screenJobId)}
              disabled={!screenJobId || screenMutation.isPending}
              className="flex items-center gap-1.5 bg-violet-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors font-medium"
              title={hasSavedResults ? 'Re-screen all applications' : 'Screen all applications'}
            >
              {screenMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : hasSavedResults ? <RefreshCw size={12} /> : <Sparkles size={12} />}
              {hasSavedResults ? 'Re-screen' : 'AI Screen'}
            </button>
          </div>
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={statusOptions}
              placeholder="All statuses"
            />
          </div>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">AI Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Applied</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((app: Application) => {
                  const name = app.user.seekerProfile
                    ? `${app.user.seekerProfile.firstName} ${app.user.seekerProfile.lastName}`
                    : app.user.email;
                  const aiResult = resultMap[app.id];

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
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {aiResult ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${SCORE_BG(aiResult.fitScore)}`}>
                              {aiResult.fitScore}
                            </span>
                            <span className="text-xs text-gray-400">{aiResult.fitLabel}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
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

      {/* AI Screening Results Modal */}
      <Modal isOpen={screenOpen} onClose={() => setScreenOpen(false)} title="AI Application Screening Results" size="lg">
        {screenResults && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <p className="text-xs text-gray-500 mb-3">Candidates ranked by AI fit score. Click "Shortlist" to update application status.</p>
            {screenResults
              .sort((a, b) => b.fitScore - a.fitScore)
              .map(r => (
                <div key={r.applicationId} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.candidateName}</p>
                      <p className={`text-xs font-medium capitalize ${PRIORITY_COLORS[r.priority]}`}>
                        {r.priority === 'shortlist' ? '★ Shortlist' : r.priority === 'review' ? '◈ Review' : '✕ Reject'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-gray-900">{r.fitScore}<span className="text-xs text-gray-400">/100</span></div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FIT_COLORS[r.fitLabel] || 'bg-gray-100 text-gray-600'}`}>{r.fitLabel}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${r.fitScore}%` }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mb-2 text-xs">
                    {r.matchingStrengths.length > 0 && (
                      <div>
                        <p className="font-medium text-green-700 mb-1">Strengths</p>
                        {r.matchingStrengths.map((s, i) => <p key={i} className="text-gray-600">✓ {s}</p>)}
                      </div>
                    )}
                    {r.gaps.length > 0 && (
                      <div>
                        <p className="font-medium text-red-600 mb-1">Gaps</p>
                        {r.gaps.map((g, i) => <p key={i} className="text-gray-600">✗ {g}</p>)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 italic mb-3">{r.recommendation}</p>
                  {r.priority === 'shortlist' && (
                    <button
                      onClick={() => { statusMutation.mutate({ id: r.applicationId, status: 'SHORTLISTED' }); toast.success(`${r.candidateName} shortlisted`); }}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Move to Shortlisted
                    </button>
                  )}
                </div>
              ))}
          </div>
        )}
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} title="Application Detail" size="lg">
        {selectedApp && (() => {
          const aiResult = resultMap[selectedApp.id];
          return (
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

              {/* AI Screening Result Panel */}
              {aiResult ? (
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-violet-600" />
                    <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide">AI Screening Result</p>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[aiResult.priority]}`}>
                        {aiResult.priority === 'shortlist' ? '★ Recommended to Shortlist' : aiResult.priority === 'review' ? '◈ Needs Further Review' : '✕ Not Recommended'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${FIT_COLORS[aiResult.fitLabel] || 'bg-gray-100 text-gray-600'}`}>{aiResult.fitLabel}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{aiResult.fitScore}<span className="text-sm text-gray-400">/100</span></div>
                    </div>
                  </div>
                  <div className="w-full bg-violet-200 rounded-full h-2 mb-3">
                    <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all" style={{ width: `${aiResult.fitScore}%` }} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3 text-xs">
                    {aiResult.matchingStrengths.length > 0 && (
                      <div>
                        <p className="font-medium text-green-700 mb-1">Strengths</p>
                        {aiResult.matchingStrengths.map((s, i) => <p key={i} className="text-gray-600">✓ {s}</p>)}
                      </div>
                    )}
                    {aiResult.gaps.length > 0 && (
                      <div>
                        <p className="font-medium text-red-600 mb-1">Gaps</p>
                        {aiResult.gaps.map((g, i) => <p key={i} className="text-gray-600">✗ {g}</p>)}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 italic">{aiResult.recommendation}</p>
                  {aiResult.priority === 'shortlist' && selectedApp.status !== 'SHORTLISTED' && (
                    <button
                      onClick={() => { statusMutation.mutate({ id: selectedApp.id, status: 'SHORTLISTED' }); setSelectedApp(null); toast.success('Moved to Shortlisted'); }}
                      className="mt-3 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Move to Shortlisted
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  <Sparkles size={14} className="text-gray-400" />
                  <p className="text-xs text-gray-500">No AI screening result yet. Select this job in the AI Screener and click "AI Screen" to analyse all candidates.</p>
                </div>
              )}

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
          );
        })()}
      </Modal>
    </div>
  );
}
