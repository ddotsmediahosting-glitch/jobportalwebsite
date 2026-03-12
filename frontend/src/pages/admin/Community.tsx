import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, ThumbsUp, Eye, CheckCircle2, Pin, Search, Filter,
  Trash2, ChevronDown, ChevronUp, Shield, AlertCircle, Settings,
  Save, X, ExternalLink, MessageCircle, Mail, Phone, Send, Users,
  RefreshCw, TrendingUp, Clock, CheckCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface Discussion {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  status: string;
  isPinned: boolean;
  isAnswered: boolean;
  isAnonymous: boolean;
  viewCount: number;
  upvoteCount: number;
  replyCount: number;
  authorName: string | null;
  authorEmail: string | null;
  adminNote: string | null;
  createdAt: string;
  _count?: { replies: number };
}

interface Reply {
  id: string;
  body: string;
  isAccepted: boolean;
  isAdminReply: boolean;
  authorName: string | null;
  authorEmail: string | null;
  upvoteCount: number;
  createdAt: string;
}

interface AdminSettings {
  whatsappNumber?: string;
  whatsappGroupLink?: string;
  contactEmail?: string;
  telegramLink?: string;
  bannerText?: string;
  bannerEnabled?: boolean;
  requireModeration?: boolean;
  allowAnonymous?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'General', VISA_WORK_PERMITS: 'Visa & Work Permits',
  SALARY_COMPENSATION: 'Salary & Compensation', JOB_SEARCH: 'Job Search',
  INTERVIEW_HELP: 'Interview Help', CAREER_ADVICE: 'Career Advice',
  COMPANY_REVIEWS: 'Company Reviews', UAE_WORK_LAWS: 'UAE Work Laws',
  INDUSTRY: 'Industry Talk', EMIRATIZATION: 'Emiratization',
  FREELANCE_REMOTE: 'Freelance / Remote', NETWORKING: 'Networking',
  RELOCATING: 'Relocating to UAE',
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Live', cls: 'bg-emerald-100 text-emerald-700' },
  CLOSED: { label: 'Closed', cls: 'bg-gray-100 text-gray-600' },
  REMOVED: { label: 'Removed', cls: 'bg-red-100 text-red-600' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Discussion Detail Modal ───────────────────────────────────────────────────

function DetailModal({
  id, onClose,
}: { id: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [adminNote, setAdminNote] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  const { data: d, isLoading } = useQuery({
    queryKey: ['admin-discussion', id],
    queryFn: () => api.get(`/admin/community/${id}`).then((r) => r.data.data),
  });

  useEffect(() => { if (d) setAdminNote(d.adminNote || ''); }, [d]);

  const updateMut = useMutation({
    mutationFn: (data: any) => api.patch(`/admin/community/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-community'] });
      qc.invalidateQueries({ queryKey: ['admin-discussion', id] });
      toast.success('Updated');
    },
  });

  const acceptMut = useMutation({
    mutationFn: (replyId: string) => api.post(`/admin/community/replies/${replyId}/accept`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-discussion', id] }); toast.success('Marked as best answer'); },
  });

  const deleteReplyMut = useMutation({
    mutationFn: (replyId: string) => api.delete(`/admin/community/replies/${replyId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-discussion', id] }); toast.success('Reply deleted'); },
  });

  const handleAdminReply = async () => {
    if (!replyBody.trim()) return;
    setReplyLoading(true);
    try {
      await api.post(`/community/${id}/replies`, { body: replyBody, isAnonymous: false, authorName: 'Admin' });
      // Mark as admin reply via patch
      const replies = await api.get(`/admin/community/${id}`).then((r) => r.data.data.replies);
      const latest = replies[replies.length - 1];
      if (latest) await api.patch(`/admin/community/${id}`, {}); // trigger refresh
      toast.success('Admin reply posted');
      setReplyBody('');
      qc.invalidateQueries({ queryKey: ['admin-discussion', id] });
    } catch { toast.error('Failed to post reply'); }
    finally { setReplyLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-gray-900 text-base">Discussion Detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="h-4 w-4" /></button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400 animate-pulse">Loading…</div>
          ) : !d ? null : (
            <div className="p-5 space-y-5">
              {/* Question */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-gray-900">{d.title}</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${STATUS_BADGE[d.status]?.cls}`}>
                    {STATUS_BADGE[d.status]?.label}
                  </span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{d.body}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                  <span>By: <span className="font-medium text-gray-600">{d.isAnonymous ? 'Anonymous' : (d.authorName || '—')}</span></span>
                  {d.authorEmail && <span>Email: <a href={`mailto:${d.authorEmail}`} className="text-brand-600">{d.authorEmail}</a></span>}
                  <span>Category: {CATEGORY_LABELS[d.category]}</span>
                  <span>{timeAgo(d.createdAt)}</span>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {['PENDING', 'APPROVED', 'CLOSED', 'REMOVED'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateMut.mutate({ status: s })}
                    disabled={d.status === s || updateMut.isPending}
                    className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors disabled:opacity-40 ${
                      d.status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {STATUS_BADGE[s]?.label}
                  </button>
                ))}
                <button
                  onClick={() => updateMut.mutate({ isPinned: !d.isPinned })}
                  disabled={updateMut.isPending}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${d.isPinned ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d.isPinned ? '📌 Unpin' : '📌 Pin'}
                </button>
                <button
                  onClick={() => updateMut.mutate({ isAnswered: !d.isAnswered })}
                  disabled={updateMut.isPending}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${d.isAnswered ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d.isAnswered ? '✅ Mark Unanswered' : '✅ Mark Answered'}
                </button>
              </div>

              {/* Admin note */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Internal Note</label>
                <div className="flex gap-2">
                  <input
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add internal note (not visible to public)"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={() => updateMut.mutate({ adminNote })}
                    disabled={updateMut.isPending}
                    className="px-3 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Answers ({d.replies?.length || 0})</h4>
                <div className="space-y-3">
                  {d.replies?.map((r: Reply) => (
                    <div key={r.id} className={`rounded-xl border p-3.5 ${r.isAccepted ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium text-gray-700">{r.authorName || 'Anonymous'}</span>
                          {r.authorEmail && <a href={`mailto:${r.authorEmail}`} className="text-brand-600">{r.authorEmail}</a>}
                          {r.isAdminReply && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold text-[10px]">Admin</span>}
                          {r.isAccepted && <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold text-[10px]">Best Answer</span>}
                          <span>· {timeAgo(r.createdAt)}</span>
                          <span>· 👍 {r.upvoteCount}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => acceptMut.mutate(r.id)}
                            disabled={r.isAccepted || acceptMut.isPending}
                            className="p-1.5 text-xs bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 disabled:opacity-40 transition-colors"
                            title="Mark as best answer"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this reply?')) deleteReplyMut.mutate(r.id); }}
                            disabled={deleteReplyMut.isPending}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                </div>

                {/* Admin reply form */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Post Admin Reply</label>
                  <div className="flex gap-2">
                    <textarea
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Write an official response…"
                      rows={2}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    />
                    <button
                      onClick={handleAdminReply}
                      disabled={replyLoading || !replyBody.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      <Shield className="h-3.5 w-3.5" /> Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab() {
  const qc = useQueryClient();
  const [form, setForm] = useState<AdminSettings>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin-community-settings'],
    queryFn: () => api.get('/admin/community/settings').then((r) => r.data.data),
  });

  useEffect(() => {
    if (data) setForm({
      whatsappNumber: data.whatsappNumber || '',
      whatsappGroupLink: data.whatsappGroupLink || '',
      contactEmail: data.contactEmail || '',
      telegramLink: data.telegramLink || '',
      bannerText: data.bannerText || '',
      bannerEnabled: data.bannerEnabled ?? false,
      requireModeration: data.requireModeration ?? true,
      allowAnonymous: data.allowAnonymous ?? true,
    });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => api.put('/admin/community/settings', form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-community-settings'] }); toast.success('Settings saved'); },
    onError: () => toast.error('Failed to save'),
  });

  if (isLoading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading settings…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Contact Links */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" /> Contact Links
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number</label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                value={form.whatsappNumber || ''}
                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                placeholder="+971 50 123 4567"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Include country code. Used for direct WhatsApp chat button.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Group Invite Link</label>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                value={form.whatsappGroupLink || ''}
                onChange={(e) => setForm({ ...form, whatsappGroupLink: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                value={form.contactEmail || ''}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                type="email"
                placeholder="support@yourdomain.com"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Telegram Channel Link</label>
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <input
                value={form.telegramLink || ''}
                onChange={(e) => setForm({ ...form, telegramLink: e.target.value })}
                placeholder="https://t.me/..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" /> Announcement Banner
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Message</label>
            <input
              value={form.bannerText || ''}
              onChange={(e) => setForm({ ...form, bannerText: e.target.value })}
              placeholder="e.g. 🎉 New jobs added daily — subscribe to job alerts!"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={form.bannerEnabled ?? false}
              onChange={(e) => setForm({ ...form, bannerEnabled: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Show banner on community page</p>
            </div>
          </label>
        </div>
      </div>

      {/* Moderation Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-indigo-600" /> Moderation
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-700">Require moderation before publishing</p>
              <p className="text-xs text-gray-500">New questions will be PENDING until approved by admin</p>
            </div>
            <input
              type="checkbox"
              checked={form.requireModeration ?? true}
              onChange={(e) => setForm({ ...form, requireModeration: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div>
              <p className="text-sm font-medium text-gray-700">Allow anonymous questions</p>
              <p className="text-xs text-gray-500">Users can post without providing their name</p>
            </div>
            <input
              type="checkbox"
              checked={form.allowAnonymous ?? true}
              onChange={(e) => setForm({ ...form, allowAnonymous: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
          </label>
        </div>
      </div>

      <button
        onClick={() => saveMut.mutate()}
        disabled={saveMut.isPending}
        className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saveMut.isPending ? 'Saving…' : 'Save Settings'}
      </button>
    </div>
  );
}

// ── Main Admin Community Page ─────────────────────────────────────────────────

export function AdminCommunity() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'discussions' | 'settings'>('discussions');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data: statsData } = useQuery({
    queryKey: ['admin-community-stats'],
    queryFn: () => api.get('/admin/community/stats').then((r) => r.data.data),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-community', statusFilter, search, page],
    queryFn: () => api.get('/admin/community', {
      params: { status: statusFilter || undefined, search: search || undefined, page, limit: 25 },
    }).then((r) => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/admin/community/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-community'] }); qc.invalidateQueries({ queryKey: ['admin-community-stats'] }); toast.success('Updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/community/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-community'] }); qc.invalidateQueries({ queryKey: ['admin-community-stats'] }); toast.success('Deleted'); },
  });

  const stats = statsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Community Q&A</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage UAE job discussions, questions, and enquiries</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <a href="/community" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors">
            View Page ↗
          </a>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: MessageSquare, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', filter: 'PENDING' },
            { label: 'Live', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', filter: 'APPROVED' },
            { label: 'Closed', value: stats.closed, icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-50', filter: 'CLOSED' },
            { label: 'Answers', value: stats.totalReplies, icon: MessageSquare, color: 'text-brand-700', bg: 'bg-brand-50' },
          ].map(({ label, value, icon: Icon, color, bg, filter }) => (
            <button
              key={label}
              onClick={() => filter && setStatusFilter(filter)}
              className={`${bg} rounded-2xl p-4 text-left transition-all hover:opacity-80 ${filter && statusFilter === filter ? 'ring-2 ring-brand-400' : ''}`}
            >
              <div className={`flex items-center gap-2 mb-1 ${color}`}>
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
              <p className={`text-2xl font-extrabold ${color}`}>{value ?? 0}</p>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100">
        {[{ key: 'discussions', label: 'Discussions' }, { key: 'settings', label: 'Settings' }].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
              tab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'settings' ? <SettingsTab /> : (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search questions, author…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Live</option>
              <option value="CLOSED">Closed</option>
              <option value="REMOVED">Removed</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 animate-pulse">Loading…</div>
            ) : !data?.items?.length ? (
              <div className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No discussions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.items.map((d: Discussion) => {
                  const badge = STATUS_BADGE[d.status] || STATUS_BADGE.PENDING;
                  return (
                    <div key={d.id} className="p-4 sm:p-5 hover:bg-gray-50/60 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${badge.cls}`}>{badge.label}</span>
                            {d.isPinned && <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">📌 Pinned</span>}
                            {d.isAnswered && <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">✅ Answered</span>}
                            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              {CATEGORY_LABELS[d.category] || d.category}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedId(d.id)}
                            className="text-left font-semibold text-gray-900 text-sm hover:text-brand-600 transition-colors line-clamp-1"
                          >
                            {d.title}
                          </button>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>{d.isAnonymous ? 'Anonymous' : (d.authorName || '—')}</span>
                            {d.authorEmail && <span className="truncate max-w-[180px]">{d.authorEmail}</span>}
                            <span>· {timeAgo(d.createdAt)}</span>
                            <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{d.viewCount}</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{d.upvoteCount}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{d.replyCount}</span>
                          </div>
                          {d.adminNote && (
                            <p className="text-xs text-indigo-600 mt-1 bg-indigo-50 px-2 py-1 rounded-lg inline-block">
                              📝 {d.adminNote}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {d.status === 'PENDING' && (
                            <button
                              onClick={() => updateMut.mutate({ id: d.id, status: 'APPROVED' })}
                              disabled={updateMut.isPending}
                              className="text-xs px-2.5 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-200 transition-colors"
                            >
                              Approve
                            </button>
                          )}
                          {d.status === 'APPROVED' && (
                            <button
                              onClick={() => updateMut.mutate({ id: d.id, status: 'CLOSED' })}
                              disabled={updateMut.isPending}
                              className="text-xs px-2.5 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                            >
                              Close
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedId(d.id)}
                            className="p-1.5 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
                            title="View details"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { if (confirm('Delete this discussion and all its replies?')) deleteMut.mutate(d.id); }}
                            disabled={deleteMut.isPending}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors">
                ← Prev
              </button>
              <span className="text-sm text-gray-500">Page {page} of {data.totalPages}</span>
              <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {selectedId && <DetailModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
