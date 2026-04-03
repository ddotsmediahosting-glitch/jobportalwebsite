import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import {
  FileText, Briefcase, Users, Star, CheckCircle, ArrowRight,
  Mail, Zap, BookOpen, Video, Upload, Send, ChevronDown,
  ChevronUp, Loader2, ExternalLink, MessageSquare, Target,
  TrendingUp, AlertCircle, Phone,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import toast from 'react-hot-toast';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PortfolioResult {
  overallScore: number;
  overallLabel: string;
  presentationScore: number;
  contentScore: number;
  uaeMarketScore: number;
  strengths: string[];
  improvements: string[];
  firstImpression: string;
  platformTips: string[];
  summary: string;
}

interface InterviewQuestion {
  question: string;
  tip: string;
  category: string;
}

interface InterviewResult {
  questions: InterviewQuestion[];
  generalTips: string[];
  salaryGuidance?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs font-bold text-gray-800">{score}/100</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ── Portfolio Review Panel ─────────────────────────────────────────────────────

function PortfolioReviewPanel() {
  const [form, setForm] = useState({ role: '', portfolioUrl: '', targetIndustry: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortfolioResult | null>(null);
  const charMin = 50;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim() || !form.description.trim()) {
      toast.error('Role and portfolio description are required.');
      return;
    }
    if (form.description.trim().length < charMin) {
      toast.error(`Please describe your portfolio in at least ${charMin} characters.`);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/portfolio-review', {
        role: form.role.trim(),
        portfolioUrl: form.portfolioUrl.trim() || undefined,
        targetIndustry: form.targetIndustry || undefined,
        description: form.description.trim(),
      });
      setResult(data.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (s: number) =>
    s >= 80 ? 'bg-emerald-500' : s >= 60 ? 'bg-yellow-400' : 'bg-red-400';
  const scoreLabel = (s: number) =>
    s >= 80 ? 'text-emerald-700 bg-emerald-50' : s >= 60 ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50';

  return (
    <div className="space-y-6">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your Role / Specialisation <span className="text-red-500">*</span>
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. UX Designer, Videographer, Content Creator"
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Target Industry</label>
              <select
                name="targetIndustry"
                value={form.targetIndustry}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
              >
                <option value="">Any industry</option>
                <option value="Advertising & Marketing">Advertising & Marketing</option>
                <option value="Media & Broadcasting">Media & Broadcasting</option>
                <option value="Digital & Tech">Digital & Tech</option>
                <option value="Fashion & Retail">Fashion & Retail</option>
                <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                <option value="Finance & Banking">Finance & Banking</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Portfolio URL (optional)</label>
            <input
              name="portfolioUrl"
              type="url"
              value={form.portfolioUrl}
              onChange={handleChange}
              placeholder="https://behance.net/yourname or https://yoursite.com"
              className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Describe your portfolio & what you want feedback on <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Tell us what's in your portfolio, what types of work you showcase, what platforms you use, and what specific feedback you're looking for..."
              className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400 resize-y"
              required
            />
            <p className={`text-xs mt-1 ${form.description.length >= charMin ? 'text-green-600' : 'text-gray-400'}`}>
              {form.description.length} chars {form.description.length < charMin ? `(min ${charMin})` : '✓'}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm shadow-sm"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Analysing…</> : <><Zap size={15} /> Analyse My Portfolio</>}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Score overview */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
            <div className="text-center flex-shrink-0">
              <div className={`text-5xl font-extrabold mb-1 ${result.overallScore >= 80 ? 'text-emerald-600' : result.overallScore >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                {result.overallScore}
              </div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full ${scoreLabel(result.overallScore)}`}>
                {result.overallLabel}
              </div>
            </div>
            <div className="flex-1 space-y-2 w-full">
              <ScoreBar label="Presentation" score={result.presentationScore} color={scoreColor(result.presentationScore)} />
              <ScoreBar label="Content Quality" score={result.contentScore} color={scoreColor(result.contentScore)} />
              <ScoreBar label="UAE Market Fit" score={result.uaeMarketScore} color={scoreColor(result.uaeMarketScore)} />
            </div>
          </div>

          {/* First impression */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <h4 className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-2">
              <MessageSquare size={14} /> First Impression
            </h4>
            <p className="text-sm text-blue-700 leading-relaxed">{result.firstImpression}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <h4 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                <CheckCircle size={14} /> Strengths
              </h4>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-700 flex items-start gap-2">
                    <span className="mt-0.5 h-3.5 w-3.5 rounded-full bg-emerald-200 flex-shrink-0 flex items-center justify-center text-emerald-700 font-bold" style={{ fontSize: 8 }}>{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <TrendingUp size={14} /> Areas to Improve
              </h4>
              <ul className="space-y-2">
                {result.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-start gap-2">
                    <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Platform tips */}
          {result.platformTips.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Target size={14} /> Platform Tips
              </h4>
              <ul className="space-y-1.5">
                {result.platformTips.map((t, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-brand-500 mt-0.5">•</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="p-4 bg-white border border-gray-200 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Summary</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
          </div>

          <button
            onClick={() => setResult(null)}
            className="text-sm text-violet-600 hover:underline font-medium"
          >
            ← Analyse another portfolio
          </button>
        </div>
      )}
    </div>
  );
}

// ── Interview Prep Panel ───────────────────────────────────────────────────────

function InterviewPrepPanel() {
  const [form, setForm] = useState({ role: '', industry: '', experienceLevel: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) { toast.error('Please enter a job role.'); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/ai/interview-questions', {
        role: form.role.trim(),
        industry: form.industry || 'Media & Marketing',
        experienceLevel: form.experienceLevel || 'mid',
        company: form.company.trim() || undefined,
      });
      setResult(data.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Target Role <span className="text-red-500">*</span>
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Social Media Manager, Art Director"
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
              <select
                name="industry"
                value={form.industry}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              >
                <option value="">Select industry</option>
                <option value="Media & Broadcasting">Media & Broadcasting</option>
                <option value="Advertising & Marketing">Advertising & Marketing</option>
                <option value="Digital & Tech">Digital & Tech</option>
                <option value="Design & Creative">Design & Creative</option>
                <option value="PR & Communications">PR & Communications</option>
                <option value="Film & Production">Film & Production</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Experience Level</label>
              <select
                name="experienceLevel"
                value={form.experienceLevel}
                onChange={handleChange}
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
              >
                <option value="junior">Junior (0–2 years)</option>
                <option value="mid">Mid-level (3–5 years)</option>
                <option value="senior">Senior (6+ years)</option>
                <option value="manager">Manager / Director</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company (optional)</label>
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="e.g. MBC Group, Publicis"
                className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder-gray-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-rose-600 hover:to-pink-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm shadow-sm"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><Video size={15} /> Generate Questions</>}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3 border border-gray-200">
            Practice these questions out loud. Click each one to reveal coaching tips.
          </div>

          {result.questions.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-rose-500 uppercase tracking-wide block mb-0.5">{q.category}</span>
                    <span className="text-sm font-medium text-gray-800">{q.question}</span>
                  </div>
                </div>
                {expandedIdx === i ? <ChevronUp size={15} className="text-gray-400 mt-1 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 mt-1 flex-shrink-0" />}
              </button>
              {expandedIdx === i && (
                <div className="px-4 pb-4 pt-1 bg-rose-50 border-t border-rose-100">
                  <p className="text-xs text-rose-700 leading-relaxed">
                    <span className="font-semibold">Tip:</span> {q.tip}
                  </p>
                </div>
              )}
            </div>
          ))}

          {result.generalTips && result.generalTips.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">General Interview Tips</h4>
              <ul className="space-y-1.5">
                {result.generalTips.map((t, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <CheckCircle size={11} className="text-green-500 flex-shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.salaryGuidance && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Salary Guidance</h4>
              <p className="text-xs text-blue-700 leading-relaxed">{result.salaryGuidance}</p>
            </div>
          )}

          <button onClick={() => setResult(null)} className="text-sm text-rose-600 hover:underline font-medium">
            ← Generate for another role
          </button>
        </div>
      )}
    </div>
  );
}

// ── Career Coaching Panel ──────────────────────────────────────────────────────

function CareerCoachingPanel() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', currentRole: '', goal: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Name, email and message are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        service: 'Career Coaching',
        message: `Current Role: ${form.currentRole || 'N/A'}\nGoal: ${form.goal || 'N/A'}\n\n${form.message.trim()}`,
      });
      setSent(true);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Enquiry Sent!</h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          We've received your coaching enquiry and will get back to you within 24 hours (Sun–Thu).
        </p>
        <a
          href="https://wa.me/971509379212"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-sm text-green-600 hover:underline font-medium"
        >
          <Phone size={13} /> Or WhatsApp us for a faster response
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required
            className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required
            className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / WhatsApp</label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+971 50 000 0000"
            className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Role</label>
          <input name="currentRole" value={form.currentRole} onChange={handleChange} placeholder="e.g. Junior Graphic Designer"
            className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Career Goal</label>
        <input name="goal" value={form.goal} onChange={handleChange} placeholder="e.g. Move from freelance to in-house agency role in Dubai"
          className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">What would you like to work on? <span className="text-red-500">*</span></label>
        <textarea name="message" value={form.message} onChange={handleChange} rows={4} required
          placeholder="Tell us about your current situation, challenges, and what you'd like help with…"
          className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder-gray-400 resize-y" />
      </div>
      <button type="submit" disabled={submitting}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm shadow-sm">
        {submitting ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={14} /> Book a Session</>}
      </button>
    </form>
  );
}

// ── Services config ────────────────────────────────────────────────────────────

type ServiceId = 'cv-review' | 'portfolio-review' | 'interview-prep' | 'career-coaching';

interface ServiceConfig {
  id: ServiceId;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  iconColor: string;
  title: string;
  tagline: string;
  desc: string;
  features: string[];
  mode: 'link' | 'inline';
  ctaLabel: string;
  ctaTo?: string;
  panel?: React.ReactNode;
}

const SERVICES: ServiceConfig[] = [
  {
    id: 'cv-review',
    icon: FileText,
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'CV & Resume Review',
    tagline: 'AI-powered ATS analysis in seconds',
    desc: 'Upload your CV and job description for an instant AI analysis — ATS score, keyword gaps, sub-scores, and a personalised cover letter.',
    features: ['ATS compatibility score', 'Keyword gap analysis', 'UAE market alignment', 'AI cover letter generator'],
    mode: 'link',
    ctaLabel: 'Analyse My CV Free →',
    ctaTo: '/cv-analyzer',
  },
  {
    id: 'portfolio-review',
    icon: Upload,
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Portfolio Review',
    tagline: 'AI feedback on your creative portfolio',
    desc: 'Get instant AI-powered feedback on your portfolio tailored for UAE media and creative employers. Scores across presentation, content quality, and market fit.',
    features: ['Overall portfolio score', 'Presentation & content critique', 'UAE market fit rating', 'Platform-specific tips'],
    mode: 'inline',
    ctaLabel: 'Get Instant Feedback',
    panel: <PortfolioReviewPanel />,
  },
  {
    id: 'interview-prep',
    icon: Video,
    gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    title: 'Interview Preparation',
    tagline: 'AI-generated role-specific questions',
    desc: 'Generate tailored interview questions for your exact role, industry, and experience level. Each question includes a coaching tip.',
    features: ['Role-specific questions', 'Category breakdown', 'Expert coaching tips', 'Salary negotiation guidance'],
    mode: 'inline',
    ctaLabel: 'Generate Questions',
    panel: <InterviewPrepPanel />,
  },
  {
    id: 'career-coaching',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Career Direction Coaching',
    tagline: '1:1 sessions with industry experts',
    desc: 'Not sure which media or creative path to take? Book a session with our team to map your skills, explore UAE opportunities, and build an action plan.',
    features: ['Skills & strengths mapping', 'UAE media career paths', 'Goal setting & timeline', 'Niche positioning strategy'],
    mode: 'inline',
    ctaLabel: 'Book a Session',
    panel: <CareerCoachingPanel />,
  },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Senior Graphic Designer, Dubai',
    text: 'After the portfolio review I completely restructured my Behance. Within 3 weeks I had 2 interviews at agencies I\'d been targeting for months.',
    stars: 5,
  },
  {
    name: 'James K.',
    role: 'Content Creator, Abu Dhabi',
    text: 'The CV analyzer flagged ATS issues I had no idea about. My application response rate went from near zero to consistent callbacks.',
    stars: 5,
  },
  {
    name: 'Layla H.',
    role: 'Marketing Manager, Sharjah',
    text: 'The career coaching session helped me finally commit to making the move from agency to in-house. Best career decision I made.',
    stars: 5,
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

export function CareerServices() {
  const [activePanel, setActivePanel] = useState<ServiceId | null>(null);

  const togglePanel = (id: ServiceId) => setActivePanel((prev) => (prev === id ? null : id));

  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Career Services for Media & Creative Professionals | DdotsmediaJobs"
        description="CV review, portfolio critique, interview prep, and career coaching tailored for media, design, marketing, and creative professionals in the UAE."
        canonical="https://ddotsmediajobs.com/career-services"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 text-white overflow-hidden py-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star size={13} className="fill-yellow-400 text-yellow-400" /> For Media & Creative Professionals
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
            Career Services Built for the{' '}
            <span className="text-yellow-400">Creative Industry</span>
          </h1>
          <p className="text-lg text-brand-100/80 max-w-2xl mx-auto mb-8">
            AI-powered CV analysis, portfolio critique, interview prep, and career coaching — all tailored for media, design, marketing, and content roles in the UAE.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cv-analyzer"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
            >
              <Zap size={15} /> Try Free AI CV Check
            </Link>
            <a
              href="https://wa.me/971509379212"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all"
            >
              <Phone size={15} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-3">
            <Briefcase size={11} /> What We Offer
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900">Choose Your Service</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            Click any service below to use it directly — no waiting, no email back-and-forth.
          </p>
        </div>

        <div className="space-y-6">
          {SERVICES.map((svc) => {
            const Icon = svc.icon;
            const isOpen = activePanel === svc.id;

            return (
              <div key={svc.id} className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${isOpen ? 'border-gray-300 shadow-lg' : 'border-gray-100 hover:shadow-md'}`}>
                {/* Header row */}
                <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${svc.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-md`}>
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{svc.title}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${svc.iconBg} ${svc.iconColor}`}>
                        {svc.tagline}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{svc.desc}</p>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {svc.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <CheckCircle size={11} className="text-green-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {svc.mode === 'link' ? (
                      <Link
                        to={svc.ctaTo!}
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${svc.iconBg} ${svc.iconColor} hover:opacity-80`}
                      >
                        {svc.ctaLabel} <ExternalLink size={13} />
                      </Link>
                    ) : (
                      <button
                        onClick={() => togglePanel(svc.id)}
                        className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                          isOpen
                            ? `bg-gradient-to-r ${svc.gradient} text-white shadow-sm`
                            : `${svc.iconBg} ${svc.iconColor} hover:opacity-80`
                        }`}
                      >
                        {isOpen ? 'Close' : svc.ctaLabel}
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expandable panel */}
                {svc.mode === 'inline' && isOpen && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-5 bg-gray-50">
                    {svc.panel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">Simple, fast, and focused on results.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Pick a Service', desc: 'Choose CV review, portfolio critique, interview prep, or career coaching above.' },
              { step: '02', title: 'Use It Instantly', desc: 'AI services give you instant results. Coaching enquiries get a response within 24 hours.' },
              { step: '03', title: 'Take Action', desc: 'Apply the feedback, ace your interviews, and land the role you\'ve been targeting.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4 shadow-md">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-gray-900">What Professionals Say</h2>
          <p className="text-gray-500 mt-2">Real results from media and creative professionals in the UAE.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, text, stars }) => (
            <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {[...Array(stars)].map((_, i) => (
                  <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">"{text}"</p>
              <div>
                <div className="font-semibold text-sm text-gray-900">{name}</div>
                <div className="text-xs text-gray-500">{role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-500 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Ready to Accelerate Your Career?</h2>
          <p className="text-brand-100/80 mb-6">Start with a free AI CV check or reach us directly.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/cv-analyzer"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
            >
              <Zap size={15} /> Free AI CV Check
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all"
            >
              <Mail size={15} /> Contact Us
            </Link>
            <a
              href="https://wa.me/971509379212"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl transition-all"
            >
              <MessageSquare size={15} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
