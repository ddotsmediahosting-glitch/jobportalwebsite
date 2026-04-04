import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Star, TrendingUp, BookOpen, Target, Zap, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, ArrowRight, Briefcase, Award, BarChart2,
  Clock, Brain,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

interface CareerScoreResult {
  overallScore: number;
  grade: string;
  scoreLabel: string;
  breakdown: {
    technicalSkills: number;
    experience: number;
    marketability: number;
    education: number;
    profileStrength: number;
  };
  strengths: string[];
  skillGaps: Array<{
    skill: string;
    priority: 'critical' | 'high' | 'medium';
    reason: string;
    howToLearn: string;
  }>;
  actionItems: Array<{
    action: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
  }>;
  marketPositioning: string;
  salaryPotential: {
    current: string;
    withImprovements: string;
  };
}

const INDUSTRIES = [
  'Technology & IT', 'Finance & Banking', 'Healthcare', 'Construction & Engineering',
  'Hospitality & Tourism', 'Retail & E-commerce', 'Media & Marketing', 'Education',
  'Logistics & Supply Chain', 'Real Estate', 'Oil & Gas', 'Legal', 'Government & Public Sector',
  'Consulting', 'Manufacturing', 'Other',
];

const EDUCATION_LEVELS = [
  'High School / Secondary', 'Diploma / Associate Degree', "Bachelor's Degree",
  "Master's Degree", 'PhD / Doctorate', 'Professional Certification (e.g. CPA, CFA, PMP)',
  'Trade / Vocational Qualification',
];

const PRIORITY_CONFIG = {
  critical: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Critical Gap', dot: 'bg-red-500' },
  high: { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', label: 'High Priority', dot: 'bg-orange-500' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Worth Adding', dot: 'bg-yellow-500' },
};

const IMPACT_CONFIG = {
  high: { color: 'text-green-700', bg: 'bg-green-100', label: 'High Impact' },
  medium: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Medium Impact' },
  low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Nice to Have' },
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? '#16a34a' :
    score >= 65 ? '#2563eb' :
    score >= 50 ? '#d97706' :
    '#dc2626';

  return (
    <div className="relative flex items-center justify-center w-48 h-48">
      <svg className="w-48 h-48 -rotate-90" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="90" cy="90" r={radius}
          stroke={color} strokeWidth="12" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-bold text-gray-900">{score}</div>
        <div className="text-lg font-bold" style={{ color }}>{grade}</div>
        <div className="text-xs text-gray-500 mt-0.5">out of 100</div>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) {
  const color =
    score >= 80 ? 'bg-green-500' :
    score >= 65 ? 'bg-blue-500' :
    score >= 50 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-44 shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-700">{label}</span>
      </div>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={clsx('h-2.5 rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

function SkillGapCard({ gap }: { gap: CareerScoreResult['skillGaps'][0] }) {
  const [open, setOpen] = useState(false);
  const cfg = PRIORITY_CONFIG[gap.priority];
  return (
    <div className={clsx('border rounded-xl p-4 cursor-pointer', cfg.bg)} onClick={() => setOpen(!open)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx('w-2 h-2 rounded-full', cfg.dot)} />
          <span className="font-semibold text-gray-900">{gap.skill}</span>
          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full bg-white border', cfg.color)}>
            {cfg.label}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </div>
      {open && (
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-gray-700"><span className="font-medium">Why it matters:</span> {gap.reason}</p>
          <p className="text-gray-700"><span className="font-medium">How to learn:</span> {gap.howToLearn}</p>
        </div>
      )}
    </div>
  );
}

function SkillTagInput({
  skills, onChange,
}: {
  skills: string[];
  onChange: (s: string[]) => void;
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function addSkill(val: string) {
    const trimmed = val.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 30) {
      onChange([...skills, trimmed]);
    }
    setInput('');
  }

  function removeSkill(s: string) {
    onChange(skills.filter((x) => x !== s));
  }

  return (
    <div
      className="min-h-[44px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 flex flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map((s) => (
        <span key={s} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-sm rounded-full px-3 py-0.5">
          {s}
          <button type="button" onClick={() => removeSkill(s)} className="text-blue-500 hover:text-blue-700 font-bold leading-none">×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(input); }
          if (e.key === 'Backspace' && !input && skills.length) removeSkill(skills[skills.length - 1]);
        }}
        onBlur={() => { if (input.trim()) addSkill(input); }}
        placeholder={skills.length === 0 ? 'Type a skill and press Enter...' : ''}
        className="flex-1 min-w-[120px] outline-none text-sm bg-transparent"
      />
    </div>
  );
}

export function CareerScore() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    currentRole: '',
    yearsOfExperience: 3,
    skills: [] as string[],
    education: '',
    industry: '',
    targetRole: '',
    bio: '',
  });

  const [result, setResult] = useState<CareerScoreResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/career-score', {
        currentRole: form.currentRole,
        yearsOfExperience: Number(form.yearsOfExperience),
        skills: form.skills,
        education: form.education,
        industry: form.industry,
        targetRole: form.targetRole || undefined,
        bio: form.bio || undefined,
      });
      return res.data.data as CareerScoreResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.currentRole || !form.education || !form.industry) return;
    mutation.mutate();
  }

  const scoreLabelColor =
    result && result.overallScore >= 80 ? 'text-green-700 bg-green-50' :
    result && result.overallScore >= 65 ? 'text-blue-700 bg-blue-50' :
    result && result.overallScore >= 50 ? 'text-yellow-700 bg-yellow-50' :
    'text-red-700 bg-red-50';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
            <Brain className="w-4 h-4" />
            AI-Powered Assessment
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Career Score</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Get an instant, AI-powered assessment of your career profile against the UAE job market.
            Discover your score, skill gaps, and a personalised action plan to get hired faster.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            Tell us about your career
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Current Role */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Job Title / Role <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.currentRole}
                  onChange={(e) => setForm((f) => ({ ...f, currentRole: e.target.value }))}
                  placeholder="e.g. Marketing Manager, Software Engineer, Sales Executive"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0} max={30} step={1}
                    value={form.yearsOfExperience}
                    onChange={(e) => setForm((f) => ({ ...f, yearsOfExperience: Number(e.target.value) }))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="w-16 text-center rounded-lg border border-gray-300 px-2 py-1.5 text-sm font-semibold bg-blue-50 text-blue-700">
                    {form.yearsOfExperience} yr{form.yearsOfExperience !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Highest Education <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.education}
                  onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select education level...</option>
                  {EDUCATION_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              {/* Target Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Role <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.targetRole}
                  onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
                  placeholder="e.g. Senior Product Manager"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Skills */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Skills <span className="text-gray-400 font-normal">(type and press Enter to add)</span>
                </label>
                <SkillTagInput skills={form.skills} onChange={(s) => setForm((f) => ({ ...f, skills: s })) } />
                <p className="text-xs text-gray-400 mt-1">Add up to 30 skills for a more accurate assessment</p>
              </div>

              {/* Bio */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brief Summary <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Describe your background, key achievements, or what you're looking for..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {user?.role === 'SEEKER' && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 flex items-start gap-2 text-sm text-blue-700">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Logged in as a job seeker — fill in your details above for the most accurate assessment based on your UAE job market profile.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !form.currentRole || !form.education || !form.industry}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {mutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Analysing your career profile...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Calculate My Career Score
                </>
              )}
            </button>

            {mutation.isError && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {(mutation.error as Error)?.message || 'Something went wrong. Please try again.'}
              </div>
            )}
          </form>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultsRef} className="mt-10 space-y-6">
            {/* Score Hero */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreRing score={result.overallScore} grade={result.grade} />
                <div className="flex-1 text-center md:text-left">
                  <div className={clsx('inline-block text-lg font-bold px-4 py-1.5 rounded-full mb-3', scoreLabelColor)}>
                    {result.scoreLabel}
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed">{result.marketPositioning}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-0.5">Current Salary Potential</div>
                      <div className="font-semibold text-gray-900 text-sm">{result.salaryPotential.current}</div>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <div className="text-xs text-gray-500 mb-0.5">After Improvements</div>
                      <div className="font-semibold text-green-700 text-sm">{result.salaryPotential.withImprovements}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-600" />
                Score Breakdown
              </h3>
              <div className="space-y-4">
                <BreakdownBar label="Technical Skills" score={result.breakdown.technicalSkills} icon={Brain} />
                <BreakdownBar label="Experience" score={result.breakdown.experience} icon={Briefcase} />
                <BreakdownBar label="Marketability" score={result.breakdown.marketability} icon={TrendingUp} />
                <BreakdownBar label="Education" score={result.breakdown.education} icon={BookOpen} />
                <BreakdownBar label="Profile Strength" score={result.breakdown.profileStrength} icon={Star} />
              </div>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skill Gaps */}
            {result.skillGaps.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-orange-500" />
                  Skill Gaps
                  <span className="text-xs font-normal text-gray-500 ml-1">— click to see how to close each gap</span>
                </h3>
                <div className="space-y-3">
                  {result.skillGaps.map((gap, i) => (
                    <SkillGapCard key={i} gap={gap} />
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {result.actionItems.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Your Action Plan
                </h3>
                <div className="space-y-3">
                  {result.actionItems.map((item, i) => {
                    const cfg = IMPACT_CONFIG[item.impact];
                    return (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.action}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                              {cfg.label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {item.timeframe}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
              <Award className="w-8 h-8 mx-auto mb-3 opacity-90" />
              <h3 className="text-xl font-bold mb-2">Ready to put your score to work?</h3>
              <p className="text-blue-100 text-sm mb-5">Browse thousands of UAE jobs matched to your career level and start applying today.</p>
              <a
                href="/jobs"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Browse Jobs <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Retake */}
            <div className="text-center">
              <button
                onClick={() => { setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-sm text-blue-600 hover:underline"
              >
                Retake assessment with different details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
