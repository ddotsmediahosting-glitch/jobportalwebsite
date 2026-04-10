import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Sparkles, Loader2, X, ArrowLeft, ArrowRight, CheckCircle2,
  Wand2, Briefcase, Building2, MapPin, Clock, Zap,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from '@uaejobs/shared';
import { CategorySelect } from '../../components/ui/CategorySelect';

const EMIRATE_OPTS = Object.entries(EMIRATES_LABELS).map(([v, l]) => ({ value: v, label: l }));
const WORK_MODE_OPTS = Object.entries(WORK_MODE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const EMPLOYMENT_OPTS = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));
const VISA_OPTS = [
  { value: 'NOT_REQUIRED', label: 'Not Required / Any' },
  { value: 'PROVIDED', label: 'Visa Provided' },
  { value: 'TRANSFER_AVAILABLE', label: 'Transfer Available' },
  { value: 'NOT_PROVIDED', label: 'Not Provided' },
];

interface AIJDResult {
  title: string; summary: string; responsibilities: string[]; requirements: string[];
  niceToHave: string[]; benefits: string[]; skills: string[];
  suggestedSalaryMin: number; suggestedSalaryMax: number;
  suggestedExperienceMin: number; suggestedExperienceMax: number;
  suggestedEmploymentType: string; suggestedWorkMode: string; suggestedLevel: string;
}

// ─── AI Wizard ────────────────────────────────────────────────────────────────
function AIWizard({ onApply, onClose }: { onApply: (r: AIJDResult) => void; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [keyReqs, setKeyReqs] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [emirate, setEmirate] = useState('Dubai');
  const [workMode, setWorkMode] = useState('On-site');
  const [expYears, setExpYears] = useState('1-3 years');
  const [result, setResult] = useState<AIJDResult | null>(null);

  const genMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/job-description', { role, industry, keyRequirements: keyReqs, companyName, emirate, workMode, experienceYears: expYears })
        .then(r => r.data.data as AIJDResult),
    onSuccess: (data) => { setResult(data); setStep(2); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl"><Sparkles size={20} className="text-white" /></div>
            <div>
              <p className="text-white font-bold text-lg">AI Job Writing Assistant</p>
              <p className="text-violet-200 text-xs">Powered by Claude — fills your entire job post</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>

        {/* Steps */}
        <div className="flex border-b border-gray-100 px-6 pt-4 gap-6 flex-shrink-0">
          {[{ n: 1, label: 'Job Details' }, { n: 2, label: 'Review & Apply' }].map(s => (
            <button key={s.n} onClick={() => result && setStep(s.n as 1 | 2)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${step === s.n ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-400'}`}>
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-2 ${step === s.n ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Tell AI about the role and it will write a complete job post for you.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Job Role <span className="text-red-500">*</span></label>
                  <div className="relative"><Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Plumber, Web Developer" className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Industry</label>
                  <div className="relative"><Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Construction, IT" className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Your Name / Company</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your name or business name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Emirate</label>
                  <div className="relative"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={emirate} onChange={e => setEmirate(e.target.value)} className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'].map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Work Mode</label>
                  <div className="relative"><Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={workMode} onChange={e => setWorkMode(e.target.value)} className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {['On-site', 'Hybrid', 'Remote'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Experience Required</label>
                  <input value={expYears} onChange={e => setExpYears(e.target.value)} placeholder="e.g. 1-3 years" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Key Requirements <span className="text-red-500">*</span></label>
                <textarea value={keyReqs} onChange={e => setKeyReqs(e.target.value)} rows={3} placeholder="Describe what you need — skills, experience, qualifications..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-violet-700 mb-2">AI will generate:</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-violet-600">
                  {['Professional job title', 'Full description', 'Responsibilities', 'Requirements', 'Suggested salary range', 'Required skills (ATS)'].map(i => (
                    <div key={i} className="flex items-center gap-1.5"><Zap size={10} className="text-violet-400 flex-shrink-0" />{i}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">Job post generated! Review and click "Apply to Form".</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 mb-1">Title</p>
                  <p className="text-sm font-semibold text-gray-900">{result.title}</p>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-xs text-violet-500 mb-1">Salary (AED/mo)</p>
                  <p className="text-sm font-bold text-violet-800">{result.suggestedSalaryMin?.toLocaleString()} – {result.suggestedSalaryMax?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Experience</p>
                  <p className="text-sm font-semibold text-gray-900">{result.suggestedExperienceMin}–{result.suggestedExperienceMax} yrs</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Summary</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{result.summary}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5">Responsibilities</p>
                  <ul className="space-y-1 bg-gray-50 rounded-lg p-3">
                    {(Array.isArray(result.responsibilities) ? result.responsibilities : []).map((r, i) => <li key={i} className="flex gap-1.5 text-gray-600"><span className="text-violet-400 flex-shrink-0">•</span>{r}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5">Requirements</p>
                  <ul className="space-y-1 bg-gray-50 rounded-lg p-3">
                    {(Array.isArray(result.requirements) ? result.requirements : []).map((r, i) => <li key={i} className="flex gap-1.5 text-gray-600"><span className="text-violet-400 flex-shrink-0">•</span>{r}</li>)}
                  </ul>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(result.skills) ? result.skills : []).map(s => <span key={s} className="bg-violet-100 text-violet-700 text-xs px-2.5 py-0.5 rounded-full">{s}</span>)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={() => genMutation.mutate()} disabled={!role || !keyReqs || genMutation.isPending}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {genMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate <ArrowRight size={15} /></>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={15} /> Back
              </button>
              <div className="flex gap-3">
                <button onClick={() => { setResult(null); setStep(1); genMutation.mutate(); }} disabled={genMutation.isPending}
                  className="flex items-center gap-1.5 border border-violet-300 text-violet-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors disabled:opacity-50">
                  {genMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Regenerate
                </button>
                <button onClick={() => { onApply(result!); onClose(); }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                  <CheckCircle2 size={15} /> Apply to Form
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function PostJobAsUser() {
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', emirate: 'DUBAI',
    workMode: 'ONSITE', employmentType: 'FULL_TIME', visaStatus: 'NOT_REQUIRED',
    location: '', salaryMin: '', salaryMax: '', salaryNegotiable: false,
    experienceMin: '', experienceMax: '', level: '', requirements: '', benefits: '',
  });


  const submitMutation = useMutation({
    mutationFn: () => api.post('/user-jobs', { ...form, skills,
      salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
      salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
      experienceMin: form.experienceMin !== '' ? Number(form.experienceMin) : undefined,
      experienceMax: form.experienceMax !== '' ? Number(form.experienceMax) : undefined,
    }),
    onSuccess: () => {
      toast.success('Job submitted! It will be visible after admin approval.');
      navigate('/my-posts');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const applyAI = (r: AIJDResult) => {
    setForm(prev => ({
      ...prev,
      title: prev.title || r.title,
      description: [r.summary, '\n\nResponsibilities:\n' + (Array.isArray(r.responsibilities) ? r.responsibilities : []).map(x => `• ${x}`).join('\n')].join(''),
      requirements: (Array.isArray(r.requirements) ? r.requirements : []).concat((Array.isArray(r.niceToHave) ? r.niceToHave : []).map(n => `(Preferred) ${n}`)).map(x => `• ${x}`).join('\n'),
      benefits: (Array.isArray(r.benefits) ? r.benefits : []).map(b => `• ${b}`).join('\n'),
      salaryMin: r.suggestedSalaryMin ? String(r.suggestedSalaryMin) : prev.salaryMin,
      salaryMax: r.suggestedSalaryMax ? String(r.suggestedSalaryMax) : prev.salaryMax,
      experienceMin: r.suggestedExperienceMin != null ? String(r.suggestedExperienceMin) : prev.experienceMin,
      experienceMax: r.suggestedExperienceMax != null ? String(r.suggestedExperienceMax) : prev.experienceMax,
      employmentType: r.suggestedEmploymentType || prev.employmentType,
      workMode: r.suggestedWorkMode || prev.workMode,
      level: r.suggestedLevel || prev.level,
    }));
    setSkills(prev => Array.from(new Set([...prev, ...(Array.isArray(r.skills) ? r.skills : []).slice(0, 12)])));
    toast.success('AI content applied!');
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !skills.includes(t)) setSkills(s => [...s, t]);
    setSkillInput('');
  };

  const valid = form.title && form.description && form.categoryId && form.emirate && form.workMode && form.employmentType;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {wizardOpen && <AIWizard onApply={applyAI} onClose={() => setWizardOpen(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post a Job</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your post will be reviewed by admins before going live.</p>
        </div>
        <button onClick={() => setWizardOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-violet-200 transition-all">
          <Sparkles size={16} /> Create with AI
        </button>
      </div>

      {/* AI hint */}
      {!form.title && (
        <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl px-5 py-4">
          <div className="bg-violet-600 text-white p-2 rounded-xl flex-shrink-0"><Wand2 size={18} /></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-900">Let AI write your job post</p>
            <p className="text-xs text-violet-600 mt-0.5">Enter a role + requirements — Claude fills description, salary, skills and more.</p>
          </div>
          <button onClick={() => setWizardOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors">
            <Sparkles size={13} /> Try it
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={set('title')} placeholder="e.g. Electrician, React Developer" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <CategorySelect
            value={form.categoryId}
            onChange={(id) => setForm((p) => ({ ...p, categoryId: id }))}
            required
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emirate <span className="text-red-500">*</span></label>
              <select value={form.emirate} onChange={set('emirate')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {EMIRATE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area / Location</label>
              <input value={form.location} onChange={set('location')} placeholder="e.g. Business Bay, Dubai" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        {/* Job Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Type</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Mode</label>
              <select value={form.workMode} onChange={set('workMode')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {WORK_MODE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
              <select value={form.employmentType} onChange={set('employmentType')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {EMPLOYMENT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status</label>
              <select value={form.visaStatus} onChange={set('visaStatus')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {VISA_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <select value={form.level} onChange={set('level')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Not specified</option>
                {['Junior', 'Mid-level', 'Senior', 'Lead', 'Manager', 'Director', 'Executive'].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Salary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Salary</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (AED/month)</label>
              <input type="number" value={form.salaryMin} onChange={set('salaryMin')} placeholder="e.g. 5000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (AED/month)</label>
              <input type="number" value={form.salaryMax} onChange={set('salaryMax')} placeholder="e.g. 10000" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.salaryNegotiable} onChange={e => setForm(p => ({ ...p, salaryNegotiable: e.target.checked }))} className="rounded" />
            Salary is negotiable
          </label>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Experience</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience (years)</label>
              <input type="number" min={0} value={form.experienceMin} onChange={set('experienceMin')} placeholder="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience (years)</label>
              <input type="number" value={form.experienceMax} onChange={set('experienceMax')} placeholder="5" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Required Skills</h2>
          <div className="flex gap-2 mb-3">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <button type="button" onClick={addSkill} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                {s}<button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Description</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={set('description')} rows={10} placeholder="Describe the role, responsibilities, and what you're looking for..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
            <textarea value={form.requirements} onChange={set('requirements')} rows={4} placeholder="List specific requirements..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Benefits & Perks</label>
            <textarea value={form.benefits} onChange={set('benefits')} rows={3} placeholder="Visa, health insurance, etc..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* Notice */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <CheckCircle2 size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">Your job post will be reviewed by an admin before it appears publicly. You'll be able to track the status in <strong>My Posts</strong>.</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={() => submitMutation.mutate()} disabled={!valid || submitMutation.isPending}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            {submitMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Briefcase size={15} /> Submit for Approval</>}
          </button>
        </div>
      </div>
    </div>
  );
}
