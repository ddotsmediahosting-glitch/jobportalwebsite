import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Zap, Sparkles, ArrowLeft, CheckCircle2, Briefcase, MapPin,
  DollarSign, Clock, ChevronRight, ExternalLink, Loader2,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { EMIRATES_LABELS } from '@uaejobs/shared';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CategorySelect } from '../../components/ui/CategorySelect';

const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));

// ── Step types ─────────────────────────────────────────────────────────────────
type Step = 'form' | 'generating' | 'success';

interface PostedJob {
  id: string;
  slug: string;
  title: string;
  emirate: string;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: string[];
  publishedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Not specified';
  const fmt = (n: number) => (n >= 1000 ? `AED ${Math.round(n / 1000)}k` : `AED ${n}`);
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`;
  if (min) return `${fmt(min)}+/mo`;
  return `Up to ${fmt(max!)}/mo`;
}

// ── Main component ─────────────────────────────────────────────────────────────
export function QuickPost() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [postedJob, setPostedJob] = useState<PostedJob | null>(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [emirate, setEmirate] = useState('DUBAI');
  const [hints, setHints] = useState('');

  // Check AI status
  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get('/ai/status').then((r) => r.data.data as { configured: boolean }),
    staleTime: 60_000,
  });

  const quickPostMutation = useMutation({
    mutationFn: () =>
      api.post('/employer/jobs/quick-post', { title: title.trim(), categoryId, emirate, hints: hints.trim() || undefined })
        .then((r) => r.data.data as PostedJob),
    onSuccess: (job) => {
      setPostedJob(job);
      setStep('success');
    },
    onError: (err) => {
      setStep('form');
      toast.error(getApiError(err));
    },
  });

  const handleGenerate = () => {
    if (!title.trim() || title.trim().length < 3) {
      toast.error('Please enter a job title');
      return;
    }
    if (!categoryId) {
      toast.error('Please select a job category');
      return;
    }
    if (!emirate) {
      toast.error('Please select an emirate');
      return;
    }
    setStep('generating');
    quickPostMutation.mutate();
  };

  // ── Generating screen ────────────────────────────────────────────────────────
  if (step === 'generating') {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="relative mb-8">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Sparkles className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-brand-500 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">AI is writing your job post…</h2>
        <p className="text-gray-500 mb-6 max-w-md">
          Generating a complete job description, requirements, benefits, and salary estimate.
          This usually takes 10–20 seconds.
        </p>
        <div className="flex gap-2 items-center text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Publishing to ddotsmediajobs.com when ready
        </div>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (step === 'success' && postedJob) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 mb-4">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Job is Live!</h1>
            <p className="text-brand-100 text-sm">Your job post is now published on ddotsmediajobs.com</p>
          </div>

          {/* Job summary */}
          <div className="px-8 py-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">{postedJob.title}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-brand-500 flex-shrink-0" />
                {EMIRATES_LABELS[postedJob.emirate as keyof typeof EMIRATES_LABELS] ?? postedJob.emirate}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4 text-brand-500 flex-shrink-0" />
                {formatSalary(postedJob.salaryMin, postedJob.salaryMax)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-brand-500 flex-shrink-0" />
                Expires in 30 days
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Briefcase className="h-4 w-4 text-brand-500 flex-shrink-0" />
                Full Time
              </div>
            </div>

            {Array.isArray(postedJob.skills) && postedJob.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills generated</p>
                <div className="flex flex-wrap gap-1.5">
                  {(postedJob.skills as string[]).slice(0, 10).map((s) => (
                    <span key={s} className="text-xs bg-brand-50 text-brand-700 border border-brand-100 px-2.5 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row gap-3">
            <a
              href={`/job/${postedJob.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-5 rounded-xl font-semibold hover:bg-brand-700 transition-colors text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              View Live Job
            </a>
            <button
              onClick={() => { setStep('form'); setPostedJob(null); setTitle(''); setHints(''); setCategoryId(''); }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 py-3 px-5 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm"
            >
              <Zap className="h-4 w-4" />
              Post Another Job
            </button>
            <button
              onClick={() => navigate('/employer/jobs')}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 py-3 px-5 rounded-xl font-semibold hover:bg-gray-100 transition-colors text-sm"
            >
              Manage Jobs →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form screen ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/employer/jobs" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-brand-500" />
            Auto-Post a Job
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Enter the job title — AI writes the full post and publishes it instantly
          </p>
        </div>
      </div>

      {/* AI status banner */}
      {aiStatus && !aiStatus.configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <strong>AI not configured.</strong> Set <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> in your server environment to enable auto-posting.
        </div>
      )}

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Powered by Claude AI</p>
            <p className="text-xs text-gray-400">Generates description · requirements · benefits · skills · salary estimate</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        <Input
          label="Job Title *"
          placeholder="e.g. Senior Software Engineer, Marketing Manager, Sales Executive"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Category *</label>
          <CategorySelect
            value={categoryId}
            onChange={setCategoryId}
            required
          />
        </div>

        <Select
          label="Emirate *"
          options={emirateOptions}
          value={emirate}
          onChange={(e) => setEmirate(e.target.value)}
          required
        />

        <Textarea
          label="Key Requirements / Notes (optional)"
          placeholder="e.g. Must have 5+ years in React, experience with fintech preferred, Arabic speaker a plus"
          value={hints}
          onChange={(e) => setHints(e.target.value)}
          rows={3}
        />

        <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-xs text-brand-700 space-y-1">
          <p className="font-semibold">What happens next:</p>
          <ul className="list-disc list-inside space-y-0.5 text-brand-600">
            <li>AI writes the full job description, requirements, and benefits</li>
            <li>Salary range and experience level are estimated for the UAE market</li>
            <li>Job is published immediately — no admin review required</li>
            <li>You can edit the job any time from Manage Jobs</li>
          </ul>
        </div>

        <Button
          type="button"
          className="w-full"
          size="lg"
          onClick={handleGenerate}
          disabled={!aiStatus?.configured}
        >
          <Zap className="h-4 w-4 mr-2" />
          Generate & Publish Now
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        <p className="text-center text-xs text-gray-400">
          Job will be live on <span className="font-medium text-gray-600">ddotsmediajobs.com</span> in ~15 seconds.
          Uses 1 job post from your plan quota.
        </p>
      </div>

      {/* Manual post link */}
      <p className="text-center text-sm text-gray-400">
        Prefer full control?{' '}
        <Link to="/employer/post-job" className="text-brand-600 hover:text-brand-700 font-medium">
          Use the manual post form →
        </Link>
      </p>
    </div>
  );
}
