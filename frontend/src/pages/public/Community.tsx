import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare, ThumbsUp, Eye, CheckCircle2, Pin, Tag, Search,
  ChevronRight, TrendingUp, Clock, Star, Filter, Plus, Flame,
  MessageCircle, Phone, Mail, Send, AlertCircle, Users, HelpCircle,
  Briefcase, DollarSign, FileText, Globe, Award, Home,
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface Discussion {
  id: string;
  title: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isAnswered: boolean;
  isAnonymous: boolean;
  viewCount: number;
  upvoteCount: number;
  replyCount: number;
  authorName: string;
  createdAt: string;
}

interface Settings {
  whatsappNumber: string | null;
  whatsappGroupLink: string | null;
  contactEmail: string | null;
  telegramLink: string | null;
  bannerText: string | null;
  bannerEnabled: boolean;
  allowAnonymous: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'ALL', label: 'All Topics', icon: Globe, color: 'text-gray-600' },
  { key: 'VISA_WORK_PERMITS', label: 'Visa & Permits', icon: FileText, color: 'text-blue-600' },
  { key: 'SALARY_COMPENSATION', label: 'Salary & Comp', icon: DollarSign, color: 'text-green-600' },
  { key: 'JOB_SEARCH', label: 'Job Search', icon: Search, color: 'text-purple-600' },
  { key: 'INTERVIEW_HELP', label: 'Interview Help', icon: HelpCircle, color: 'text-orange-600' },
  { key: 'CAREER_ADVICE', label: 'Career Advice', icon: Award, color: 'text-indigo-600' },
  { key: 'COMPANY_REVIEWS', label: 'Company Reviews', icon: Star, color: 'text-yellow-600' },
  { key: 'UAE_WORK_LAWS', label: 'UAE Work Laws', icon: AlertCircle, color: 'text-red-600' },
  { key: 'INDUSTRY', label: 'Industry Talk', icon: Briefcase, color: 'text-teal-600' },
  { key: 'EMIRATIZATION', label: 'Emiratization', icon: Home, color: 'text-emerald-600' },
  { key: 'FREELANCE_REMOTE', label: 'Freelance / Remote', icon: Globe, color: 'text-cyan-600' },
  { key: 'NETWORKING', label: 'Networking', icon: Users, color: 'text-pink-600' },
  { key: 'RELOCATING', label: 'Relocating to UAE', icon: Home, color: 'text-amber-600' },
  { key: 'GENERAL', label: 'General', icon: MessageSquare, color: 'text-gray-500' },
];

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest', icon: Clock },
  { key: 'top', label: 'Top Voted', icon: TrendingUp },
  { key: 'active', label: 'Most Active', icon: Flame },
  { key: 'unanswered', label: 'Unanswered', icon: HelpCircle },
];

const POPULAR_TAGS = [
  'dubai', 'abu-dhabi', 'visa', 'salary', 'expat', 'tech', 'finance',
  'gratuity', 'probation', 'remote', 'interview', 'labour-law',
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString();
}

function getCategoryMeta(key: string) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
}

// ── Ask Question Modal ───────────────────────────────────────────────────────

function AskModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '', body: '', category: 'GENERAL', tags: '', isAnonymous: false,
    authorName: '', authorEmail: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return toast.error('Title and description are required');
    setLoading(true);
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.post('/community', { ...form, tags });
      toast.success('Your question was submitted! It will appear after review.');
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to submit question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Ask the Community</h2>
          <p className="text-sm text-gray-500 mt-1">Get answers from UAE job seekers and professionals</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Question Title <span className="text-red-500">*</span></label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. How do I calculate end of service gratuity in UAE?"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              maxLength={200}
            />
            <p className="text-xs text-gray-400 mt-1">{form.title.length}/200</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Details <span className="text-red-500">*</span></label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Describe your question in detail. Include relevant context like your industry, experience level, emirate, etc."
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              maxLength={5000}
            />
            <p className="text-xs text-gray-400 mt-1">{form.body.length}/5000</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {CATEGORIES.filter((c) => c.key !== 'ALL').map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="e.g. dubai, visa, salary"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
              <input
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                placeholder="e.g. Ahmed K."
                disabled={form.isAnonymous}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(for replies, not shown)</span></label>
              <input
                value={form.authorEmail}
                onChange={(e) => setForm({ ...form, authorEmail: e.target.value })}
                type="email"
                placeholder="your@email.com"
                disabled={form.isAnonymous}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
            <div>
              <p className="text-sm font-medium text-gray-700">Post Anonymously</p>
              <p className="text-xs text-gray-500">Your name won't be shown. Useful for sensitive questions.</p>
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting…' : 'Submit Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Discussion Card ──────────────────────────────────────────────────────────

function DiscussionCard({ d }: { d: Discussion }) {
  const meta = getCategoryMeta(d.category);
  const Icon = meta.icon;
  return (
    <Link
      to={`/community/${d.id}`}
      className="block bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 hover:border-brand-200 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex gap-4">
        {/* Stats column */}
        <div className="hidden sm:flex flex-col items-center gap-3 min-w-[56px]">
          <div className={`flex flex-col items-center p-2 rounded-xl ${d.upvoteCount > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <ThumbsUp className="h-3.5 w-3.5 mb-0.5" />
            <span className="text-xs font-bold">{d.upvoteCount}</span>
          </div>
          <div className={`flex flex-col items-center p-2 rounded-xl ${d.isAnswered ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500'}`}>
            <MessageSquare className="h-3.5 w-3.5 mb-0.5" />
            <span className="text-xs font-bold">{d.replyCount}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-2">
            {d.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                <Pin className="h-2.5 w-2.5" /> Pinned
              </span>
            )}
            {d.isAnswered && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-2.5 w-2.5" /> Answered
              </span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold bg-gray-100 px-2 py-0.5 rounded-full ${meta.color}`}>
              <Icon className="h-2.5 w-2.5" />
              {meta.label}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-semibold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-2 mb-2">
            {d.title}
          </h3>

          {(Array.isArray(d.tags) ? d.tags : []).length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {(Array.isArray(d.tags) ? d.tags as string[] : []).slice(0, 4).map((t) => (
                <span key={t} className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="font-medium text-gray-600">{d.authorName}</span>
            <span>·</span>
            <span>{timeAgo(d.createdAt)}</span>
            <span className="hidden sm:flex items-center gap-1">
              · <Eye className="h-3 w-3" /> {d.viewCount}
            </span>
            <div className="sm:hidden flex items-center gap-2 ml-auto">
              <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{d.upvoteCount}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{d.replyCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function Community() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showAsk, setShowAsk] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || 'ALL';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const tag = searchParams.get('tag') || '';

  const { data: settingsData } = useQuery({
    queryKey: ['community-settings'],
    queryFn: () => api.get('/community/settings').then((r) => r.data.data as Settings),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['community', category, sort, search, page, tag],
    queryFn: () => {
      const params: any = { sort, page, limit: 20 };
      if (category !== 'ALL') params.category = category;
      if (search) params.search = search;
      if (tag) params.tag = tag;
      return api.get('/community', { params }).then((r) => r.data.data);
    },
  });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam('search', searchInput);
  };

  const settings = settingsData;
  const waLink = settings?.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`
    : settings?.whatsappGroupLink || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-brand-200 text-sm font-medium mb-3">
              <Users className="h-4 w-4" />
              UAE Job Community
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Ask. Answer. Grow Together.
            </h1>
            <p className="text-brand-100 text-base sm:text-lg mb-6">
              Your go-to community for UAE job questions — visa help, salary benchmarks, interview tips, career advice, and more.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search questions…"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors text-sm"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setShowAsk(true)}
                className="hidden sm:flex items-center gap-2 px-5 py-3 bg-brand-500 border border-white/20 text-white font-semibold rounded-xl hover:bg-brand-400 transition-colors text-sm"
              >
                <Plus className="h-4 w-4" /> Ask Question
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Announcement banner */}
      {settings?.bannerEnabled && settings.bannerText && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{settings.bannerText}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Left sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-4">
            {/* Categories */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
              <nav className="space-y-0.5">
                {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => setParam('category', key === 'ALL' ? '' : key)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                      category === key
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Popular tags */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Popular Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TAGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setParam('tag', tag === t ? '' : t)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                      tag === t
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Contact card */}
            {(waLink || settings?.contactEmail) && (
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white">
                <p className="font-bold text-sm mb-1">Need Direct Help?</p>
                <p className="text-xs text-green-100 mb-3">Reach us directly for urgent queries</p>
                <div className="space-y-2">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp Us
                    </a>
                  )}
                  {settings?.whatsappGroupLink && (
                    <a
                      href={settings.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Join WhatsApp Group
                    </a>
                  )}
                  {settings?.contactEmail && (
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Email Us
                    </a>
                  )}
                  {settings?.telegramLink && (
                    <a
                      href={settings.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-3 py-2 text-xs font-semibold transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Telegram Channel
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Main feed */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1">
                {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setParam('sort', key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sort === key ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {search && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    Results for "<span className="font-semibold text-gray-700">{search}</span>"
                    <button onClick={() => { setSearchInput(''); setParam('search', ''); }} className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                  </span>
                )}
                {tag && (
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full flex items-center gap-1 font-medium">
                    #{tag}
                    <button onClick={() => setParam('tag', '')} className="hover:text-red-600">✕</button>
                  </span>
                )}
                <button
                  onClick={() => setShowAsk(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ask Question
                </button>
              </div>
            </div>

            {/* Mobile category scroll */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setParam('category', key === 'ALL' ? '' : key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    category === key
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Discussion list */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : !data?.items?.length ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium mb-1">No discussions yet</p>
                <p className="text-gray-400 text-sm mb-4">Be the first to ask a question!</p>
                <button
                  onClick={() => setShowAsk(true)}
                  className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  Ask a Question
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.items.map((d: Discussion) => (
                  <DiscussionCard key={d.id} d={d} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setParam('page', String(page - 1))}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500 px-3">
                  Page {page} of {data.totalPages}
                </span>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setParam('page', String(page + 1))}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden xl:block w-64 flex-shrink-0 space-y-4">
            {/* Community stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Community</p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Questions</span>
                  <span className="font-bold text-gray-900">{data?.total ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Answered</span>
                  <span className="font-bold text-emerald-600">
                    {data?.items?.filter((d: Discussion) => d.isAnswered).length ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-indigo-50 to-brand-50 rounded-2xl border border-brand-100 p-4">
              <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mb-3">💡 Tips</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex gap-2"><span className="text-brand-500 flex-shrink-0">→</span>Be specific in your question</li>
                <li className="flex gap-2"><span className="text-brand-500 flex-shrink-0">→</span>Add relevant tags for visibility</li>
                <li className="flex gap-2"><span className="text-brand-500 flex-shrink-0">→</span>Post anonymously for sensitive topics</li>
                <li className="flex gap-2"><span className="text-brand-500 flex-shrink-0">→</span>Upvote helpful answers</li>
              </ul>
            </div>

            {/* Direct contact CTA */}
            {(waLink || settings?.contactEmail) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Us Directly</p>
                <div className="space-y-2">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl text-green-700 transition-colors"
                    >
                      <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">WhatsApp</p>
                        <p className="text-[10px] text-green-600">Chat with us now</p>
                      </div>
                    </a>
                  )}
                  {settings?.whatsappGroupLink && (
                    <a
                      href={settings.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-700 transition-colors"
                    >
                      <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">WhatsApp Group</p>
                        <p className="text-[10px] text-emerald-600">Join our community</p>
                      </div>
                    </a>
                  )}
                  {settings?.contactEmail && (
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-blue-700 transition-colors"
                    >
                      <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Email</p>
                        <p className="text-[10px] text-blue-600">{settings.contactEmail}</p>
                      </div>
                    </a>
                  )}
                  {settings?.telegramLink && (
                    <a
                      href={settings.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl text-sky-700 transition-colors"
                    >
                      <div className="h-8 w-8 bg-sky-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Send className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Telegram</p>
                        <p className="text-[10px] text-sky-600">Follow our channel</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {showAsk && <AskModal onClose={() => setShowAsk(false)} onSuccess={refetch} />}
    </div>
  );
}
