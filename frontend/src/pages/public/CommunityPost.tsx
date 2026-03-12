import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ThumbsUp, MessageSquare, Eye, CheckCircle2, Pin, Tag, ArrowLeft,
  Clock, Share2, Flag, ChevronRight, MessageCircle, Mail, Send,
  Users, AlertCircle, Shield, Copy, ExternalLink,
} from 'lucide-react';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

// ── Types ────────────────────────────────────────────────────────────────────

interface Reply {
  id: string;
  body: string;
  isAccepted: boolean;
  isAdminReply: boolean;
  isAnonymous: boolean;
  upvoteCount: number;
  authorName: string;
  createdAt: string;
}

interface DiscussionDetail {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  isPinned: boolean;
  isAnswered: boolean;
  status: string;
  viewCount: number;
  upvoteCount: number;
  replyCount: number;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  hasVoted: boolean;
  replies: Reply[];
}

interface Settings {
  whatsappNumber: string | null;
  whatsappGroupLink: string | null;
  contactEmail: string | null;
  telegramLink: string | null;
  allowAnonymous: boolean;
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

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatBody(text: string) {
  // Simple newline to paragraph
  return text.split('\n').filter(Boolean).map((p, i) => (
    <p key={i} className="mb-3 last:mb-0">{p}</p>
  ));
}

// ── Reply Form ────────────────────────────────────────────────────────────────

function ReplyForm({ discussionId, onSuccess }: { discussionId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({ body: '', isAnonymous: false, authorName: '', authorEmail: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.body.trim()) return toast.error('Please enter your answer');
    if (form.body.length < 10) return toast.error('Answer is too short');
    setLoading(true);
    try {
      await api.post(`/community/${discussionId}/replies`, form);
      toast.success('Your answer was submitted!');
      setForm({ body: '', isAnonymous: false, authorName: '', authorEmail: '' });
      onSuccess();
    } catch {
      toast.error('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
      <h3 className="text-base font-bold text-gray-900 mb-4">Your Answer</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
          placeholder="Share your experience, knowledge or advice… Be specific and helpful. Include relevant details like your industry, role, or experience in UAE."
          rows={6}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none text-gray-800"
          maxLength={3000}
        />
        <p className="text-xs text-gray-400 -mt-2">{form.body.length}/3000 characters</p>

        <div className="grid grid-cols-2 gap-3">
          <input
            value={form.authorName}
            onChange={(e) => setForm({ ...form, authorName: e.target.value })}
            placeholder="Your name (optional)"
            disabled={form.isAnonymous}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <input
            value={form.authorEmail}
            onChange={(e) => setForm({ ...form, authorEmail: e.target.value })}
            type="email"
            placeholder="Email (not shown publicly)"
            disabled={form.isAnonymous}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isAnonymous}
              onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              className="w-4 h-4 accent-brand-600"
            />
            <span className="text-sm text-gray-600">Post anonymously</span>
          </label>
          <button
            type="submit"
            disabled={loading || !form.body.trim()}
            className="px-6 py-2.5 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Post Answer'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Reply Card ────────────────────────────────────────────────────────────────

function ReplyCard({ reply, discussionId }: { reply: Reply; discussionId: string }) {
  const qc = useQueryClient();
  const [voted, setVoted] = useState(false);
  const [localCount, setLocalCount] = useState(reply.upvoteCount);

  const voteMut = useMutation({
    mutationFn: () => api.post(`/community/replies/${reply.id}/vote`).then((r) => r.data),
    onSuccess: (data) => {
      setVoted(data.voted);
      setLocalCount((c) => data.voted ? c + 1 : c - 1);
    },
  });

  return (
    <div className={`relative rounded-2xl border p-5 ${
      reply.isAccepted
        ? 'bg-emerald-50 border-emerald-200'
        : reply.isAdminReply
        ? 'bg-indigo-50 border-indigo-200'
        : 'bg-white border-gray-100'
    }`}>
      {reply.isAccepted && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
            <CheckCircle2 className="h-3 w-3" /> Best Answer
          </span>
        </div>
      )}
      {reply.isAdminReply && !reply.isAccepted && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
            <Shield className="h-3 w-3" /> Official Response
          </span>
        </div>
      )}

      <div className={`flex gap-4 ${reply.isAccepted || reply.isAdminReply ? 'mt-2' : ''}`}>
        {/* Upvote */}
        <div className="flex flex-col items-center gap-1 min-w-[40px]">
          <button
            onClick={() => voteMut.mutate()}
            disabled={voteMut.isPending}
            className={`p-2 rounded-xl transition-all ${
              voted ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs font-bold text-gray-700">{localCount}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-800 leading-relaxed mb-4">
            {formatBody(reply.body)}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
              reply.isAdminReply ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {reply.authorName[0]?.toUpperCase() || 'A'}
            </div>
            <span className="font-medium text-gray-600">{reply.authorName}</span>
            {reply.isAdminReply && <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">Admin</span>}
            <span>·</span>
            <span>{timeAgo(reply.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CommunityPost() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [localVoted, setLocalVoted] = useState<boolean | null>(null);
  const [localVoteCount, setLocalVoteCount] = useState<number | null>(null);

  const { data: discussion, isLoading } = useQuery({
    queryKey: ['discussion', id],
    queryFn: () => api.get(`/community/${id}`).then((r) => r.data.data as DiscussionDetail),
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ['community-settings'],
    queryFn: () => api.get('/community/settings').then((r) => r.data.data as Settings),
  });

  const voteMut = useMutation({
    mutationFn: () => api.post(`/community/${id}/vote`).then((r) => r.data),
    onSuccess: (data) => {
      setLocalVoted(data.voted);
      setLocalVoteCount((c) => {
        const base = c ?? discussion?.upvoteCount ?? 0;
        return data.voted ? base + 1 : base - 1;
      });
    },
  });

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-4">
        <div className="h-6 bg-gray-100 rounded w-1/3" />
        <div className="h-10 bg-gray-100 rounded w-3/4" />
        <div className="h-40 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <MessageSquare className="h-16 w-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Discussion not found</h2>
        <p className="text-gray-500 mb-4">This question may have been removed or is pending review.</p>
        <Link to="/community" className="text-brand-600 font-semibold hover:underline">← Back to Community</Link>
      </div>
    );
  }

  const voted = localVoted ?? discussion.hasVoted;
  const voteCount = localVoteCount ?? discussion.upvoteCount;
  const waLink = settings?.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I need help with: ${discussion.title}`)}`
    : settings?.whatsappGroupLink || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-5">
          <Link to="/" className="hover:text-brand-600 transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/community" className="hover:text-brand-600 transition-colors">Community</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-600 truncate max-w-xs">{discussion.title}</span>
        </nav>

        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Question */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {discussion.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                {discussion.isAnswered && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" /> Answered
                  </span>
                )}
                <span className="text-[11px] font-semibold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[discussion.category] || discussion.category}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4 leading-snug">
                {discussion.title}
              </h1>

              {/* Author + meta */}
              <div className="flex items-center gap-3 text-xs text-gray-400 mb-5 pb-5 border-b border-gray-100">
                <div className="h-7 w-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {discussion.authorName[0]?.toUpperCase() || 'A'}
                </div>
                <span className="font-medium text-gray-600">{discussion.authorName}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(discussion.createdAt)}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{discussion.viewCount} views</span>
                <span className="hidden sm:flex items-center gap-1">·<MessageSquare className="h-3 w-3" />{discussion.replyCount} answers</span>
              </div>

              {/* Body */}
              <div className="text-sm sm:text-base text-gray-700 leading-relaxed mb-5">
                {formatBody(discussion.body)}
              </div>

              {/* Tags */}
              {discussion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {discussion.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/community?tag=${t}`}
                      className="text-xs bg-brand-50 text-brand-600 hover:bg-brand-100 px-2.5 py-1 rounded-full font-medium transition-colors"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => voteMut.mutate()}
                  disabled={voteMut.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    voted
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-600'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />
                  {voted ? 'Helpful' : 'Helpful'} ({voteCount})
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>

                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Ask on WhatsApp
                  </a>
                )}

                {settings?.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}?subject=${encodeURIComponent('Re: ' + discussion.title)}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email Us
                  </a>
                )}
              </div>
            </div>

            {/* Answers */}
            {discussion.replies.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-brand-500" />
                  {discussion.replies.length} Answer{discussion.replies.length !== 1 ? 's' : ''}
                </h2>
                <div className="space-y-4">
                  {discussion.replies.map((r) => (
                    <ReplyCard key={r.id} reply={r} discussionId={discussion.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Reply form */}
            {discussion.status !== 'CLOSED' ? (
              <ReplyForm
                discussionId={discussion.id}
                onSuccess={() => qc.invalidateQueries({ queryKey: ['discussion', id] })}
              />
            ) : (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 text-center">
                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">This discussion is closed for new answers.</p>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-green-600 font-semibold hover:underline">
                    <MessageCircle className="h-4 w-4" /> Still need help? Contact us on WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-4">
            {/* Contact card */}
            {(waLink || settings?.contactEmail) && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Need Help Faster?</p>
                <div className="space-y-2">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl px-3 py-2.5 text-xs font-bold transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                    </a>
                  )}
                  {settings?.whatsappGroupLink && (
                    <a
                      href={settings.whatsappGroupLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors"
                    >
                      <Users className="h-4 w-4" /> Join WhatsApp Group
                    </a>
                  )}
                  {settings?.contactEmail && (
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="flex items-center gap-2 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors"
                    >
                      <Mail className="h-4 w-4" /> Send Email
                    </a>
                  )}
                  {settings?.telegramLink && (
                    <a
                      href={settings.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors"
                    >
                      <Send className="h-4 w-4" /> Telegram
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Share</p>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 w-full bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-600 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(discussion.title + '\n' + window.location.href)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full mt-2 bg-green-50 hover:bg-green-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-green-700 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
              </a>
            </div>

            {/* Back link */}
            <Link
              to="/community"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Community
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
