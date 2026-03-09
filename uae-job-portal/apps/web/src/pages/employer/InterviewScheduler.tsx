import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Video, Phone, MapPin, Check, X, Plus, User } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import toast from 'react-hot-toast';

interface InterviewSlot {
  id: string;
  scheduledAt: string;
  durationMins: number;
  type: string;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  proposedBy: string;
  application: {
    id: string;
    user: {
      email: string;
      seekerProfile: { firstName: string; lastName: string; avatarUrl: string | null } | null;
    };
    job: { title: string };
  };
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  VIDEO: <Video size={14} className="text-blue-500" />,
  PHONE: <Phone size={14} className="text-green-500" />,
  ONSITE: <MapPin size={14} className="text-amber-500" />,
};

const STATUS_STYLE: Record<string, string> = {
  PROPOSED: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  COMPLETED: 'bg-gray-50 text-gray-600 border-gray-200',
};

function groupByDate(slots: InterviewSlot[]) {
  const map: Record<string, InterviewSlot[]> = {};
  for (const slot of slots) {
    const date = new Date(slot.scheduledAt).toDateString();
    if (!map[date]) map[date] = [];
    map[date].push(slot);
  }
  return map;
}

export function InterviewScheduler() {
  const qc = useQueryClient();
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [form, setForm] = useState({
    scheduledAt: '', durationMins: 60, type: 'VIDEO', meetingLink: '', location: '', notes: '',
  });

  const { data: slots, isLoading } = useQuery({
    queryKey: ['interview-slots'],
    queryFn: () => api.get('/candidates/interviews').then((r) => r.data.data),
  });

  const { data: applications } = useQuery({
    queryKey: ['employer-applications-brief'],
    queryFn: () => api.get('/employer/applications?status=SHORTLISTED&limit=50').then((r) => r.data.data),
    enabled: proposeOpen,
  });

  const proposeMutation = useMutation({
    mutationFn: () => api.post(`/candidates/interviews/propose/${selectedAppId}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interview-slots'] });
      toast.success('Interview invitation sent!');
      setProposeOpen(false);
      setForm({ scheduledAt: '', durationMins: 60, type: 'VIDEO', meetingLink: '', location: '', notes: '' });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const grouped = groupByDate(slots || []);
  const upcomingDates = Object.keys(grouped).filter((d) => new Date(d) >= new Date(new Date().toDateString()));
  const pastDates = Object.keys(grouped).filter((d) => new Date(d) < new Date(new Date().toDateString()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Scheduler</h1>
          <p className="text-sm text-gray-500 mt-0.5">Schedule and manage candidate interviews</p>
        </div>
        <button
          onClick={() => setProposeOpen(true)}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          <Plus size={16} /> Schedule Interview
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Upcoming', value: upcomingDates.reduce((n, d) => n + grouped[d].filter((s) => s.status !== 'CANCELLED').length, 0), color: 'text-brand-600' },
          { label: 'Confirmed', value: (slots || []).filter((s: InterviewSlot) => s.status === 'CONFIRMED').length, color: 'text-emerald-600' },
          { label: 'Pending Response', value: (slots || []).filter((s: InterviewSlot) => s.status === 'PROPOSED').length, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 skeleton h-24" />)}
        </div>
      ) : slots?.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Calendar size={36} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">No interviews scheduled</h3>
          <p className="text-sm text-gray-400 mb-4">Schedule interviews for shortlisted candidates</p>
          <button onClick={() => setProposeOpen(true)} className="bg-brand-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
            Schedule First Interview
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingDates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcomingDates.flatMap((date) =>
                  grouped[date].map((slot) => <SlotCard key={slot.id} slot={slot} />)
                )}
              </div>
            </div>
          )}
          {pastDates.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Past</h2>
              <div className="space-y-3 opacity-60">
                {pastDates.flatMap((date) =>
                  grouped[date].map((slot) => <SlotCard key={slot.id} slot={slot} />)
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Propose Modal */}
      {proposeOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Schedule Interview</h3>
              <button onClick={() => setProposeOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Application *</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Choose candidate...</option>
                  {applications?.items?.map((app: { id: string; user: { email: string; seekerProfile: { firstName: string; lastName: string } | null }; job: { title: string } }) => (
                    <option key={app.id} value={app.id}>
                      {app.user.seekerProfile
                        ? `${app.user.seekerProfile.firstName} ${app.user.seekerProfile.lastName}`
                        : app.user.email} — {app.job.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="VIDEO">Video Call</option>
                    <option value="PHONE">Phone</option>
                    <option value="ONSITE">On-site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select
                    value={form.durationMins}
                    onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>
              {form.type === 'VIDEO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
                  <input
                    value={form.meetingLink}
                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                    placeholder="https://meet.google.com/..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              {form.type === 'ONSITE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location / Office Address</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Office address..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Anything the candidate should prepare..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>
              <button
                onClick={() => proposeMutation.mutate()}
                disabled={!selectedAppId || !form.scheduledAt || proposeMutation.isPending}
                className="w-full bg-brand-600 text-white py-2.5 rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {proposeMutation.isPending ? 'Sending...' : 'Send Interview Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotCard({ slot }: { slot: InterviewSlot }) {
  const dt = new Date(slot.scheduledAt);
  const name = slot.application.user.seekerProfile
    ? `${slot.application.user.seekerProfile.firstName} ${slot.application.user.seekerProfile.lastName}`
    : slot.application.user.email;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-start gap-4">
      <div className="text-center flex-shrink-0 bg-brand-50 rounded-xl p-2.5 min-w-[56px]">
        <p className="text-xs font-semibold text-brand-700">{dt.toLocaleString('en', { month: 'short' })}</p>
        <p className="text-2xl font-extrabold text-brand-900 leading-none">{dt.getDate()}</p>
        <p className="text-xs text-brand-600">{dt.toLocaleString('en', { hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">{slot.application.job.title}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize flex-shrink-0 ${STATUS_STYLE[slot.status] || ''}`}>
            {slot.status.toLowerCase()}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">{TYPE_ICON[slot.type]}{slot.type}</span>
          <span className="flex items-center gap-1"><Clock size={10} />{slot.durationMins} min</span>
          {slot.meetingLink && (
            <a href={slot.meetingLink} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
              Join Meeting ↗
            </a>
          )}
          {slot.location && (
            <span className="flex items-center gap-1"><MapPin size={10} />{slot.location}</span>
          )}
        </div>

        {slot.notes && <p className="text-xs text-gray-400 mt-1 italic">{slot.notes}</p>}
      </div>
    </div>
  );
}
