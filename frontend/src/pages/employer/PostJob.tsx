import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Wand2, Loader2, Sparkles, CheckCircle2, X, ChevronRight,
  Briefcase, Building2, MapPin, Clock, DollarSign, Star,
  ArrowLeft, ArrowRight, Zap,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { createJobSchema, CreateJobInput, EMIRATES_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS, VISA_STATUS_LABELS, JOB_LEVEL_OPTIONS } from '@uaejobs/shared';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Spinner';

const emirateOptions = Object.entries(EMIRATES_LABELS).map(([value, label]) => ({ value, label }));
const workModeOptions = Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({ value, label }));
const employmentOptions = Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const visaOptions = Object.entries(VISA_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const levelOptions = JOB_LEVEL_OPTIONS.map((l) => ({ value: l, label: l }));

interface AIJDResult {
  title: string; summary: string; responsibilities: string[]; requirements: string[];
  niceToHave: string[]; benefits: string[]; skills: string[]; seoKeywords: string[];
  suggestedSalaryMin: number; suggestedSalaryMax: number;
  suggestedExperienceMin: number; suggestedExperienceMax: number;
  suggestedEmploymentType: string; suggestedWorkMode: string; suggestedLevel: string;
}

// ─── AI Wizard Modal ───────────────────────────────────────────────────────────

function AIJobWizard({ onApply, onClose }: { onApply: (result: AIJDResult) => void; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [keyReqs, setKeyReqs] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [emirate, setEmirate] = useState('Dubai');
  const [workMode, setWorkMode] = useState('On-site');
  const [expYears, setExpYears] = useState('3+ years');
  const [result, setResult] = useState<AIJDResult | null>(null);

  const jdMutation = useMutation({
    mutationFn: () =>
      api.post('/ai/job-description', { role, industry, keyRequirements: keyReqs, companyName, emirate, workMode, experienceYears: expYears })
        .then(r => r.data.data as AIJDResult),
    onSuccess: (data) => { setResult(data); setStep(2); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleApply = () => {
    if (result) { onApply(result); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">AI Job Creation Assistant</h2>
              <p className="text-violet-200 text-xs">Powered by Claude — fills your entire job post</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-gray-100 px-6 pt-4 gap-6 flex-shrink-0">
          {[{ n: 1, label: 'Job Details' }, { n: 2, label: 'Review & Apply' }].map(s => (
            <button
              key={s.n}
              onClick={() => result && setStep(s.n as 1 | 2)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${step === s.n ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-400'}`}
            >
              <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs mr-2 ${step === s.n ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s.n}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Tell the AI about the role — it will generate a full job post including description, salary range, skills, and more.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Job Role <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Senior React Developer" className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Industry</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Information Technology" className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Company Name</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your company name" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Emirate</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={emirate} onChange={e => setEmirate(e.target.value)} className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'].map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Work Mode</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select value={workMode} onChange={e => setWorkMode(e.target.value)} className="w-full pl-8 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400">
                      {['On-site', 'Hybrid', 'Remote'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Experience Required</label>
                  <input value={expYears} onChange={e => setExpYears(e.target.value)} placeholder="e.g. 3+ years" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Key Requirements <span className="text-red-500">*</span></label>
                <textarea value={keyReqs} onChange={e => setKeyReqs(e.target.value)} rows={3} placeholder="e.g. React, Node.js, 5 years experience, team leadership, fintech background..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-400" />
              </div>

              {/* What AI will generate */}
              <div className="bg-violet-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-violet-700 mb-2">AI will generate for you:</p>
                <div className="grid grid-cols-2 gap-1.5 text-xs text-violet-600">
                  {['Job title & summary', 'Responsibilities (8-10)', 'Requirements & nice-to-haves', 'Benefits & perks', 'Skills (10-15 ATS keywords)', 'Suggested salary range', 'Recommended experience level', 'Employment & work type'].map(item => (
                    <div key={item} className="flex items-center gap-1.5"><Zap size={10} className="text-violet-400 flex-shrink-0" />{item}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800 font-medium">Job post generated successfully! Review below and click "Apply to Form".</p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Title</p>
                  <p className="text-sm font-semibold text-gray-900">{result.title}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Level</p>
                  <p className="text-sm font-semibold text-gray-900">{result.suggestedLevel}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <p className="text-sm font-semibold text-gray-900">{result.suggestedEmploymentType.replace('_', ' ')}</p>
                </div>
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-xs text-violet-500 mb-1">Salary Range (AED/mo)</p>
                  <p className="text-sm font-bold text-violet-800">
                    {result.suggestedSalaryMin?.toLocaleString()} – {result.suggestedSalaryMax?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Experience</p>
                  <p className="text-sm font-semibold text-gray-900">{result.suggestedExperienceMin}–{result.suggestedExperienceMax} yrs</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Work Mode</p>
                  <p className="text-sm font-semibold text-gray-900">{result.suggestedWorkMode}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Summary</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">{result.summary}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5">Responsibilities ({(Array.isArray(result.responsibilities) ? result.responsibilities : []).length})</p>
                  <ul className="space-y-1 bg-gray-50 rounded-lg p-3">
                    {(Array.isArray(result.responsibilities) ? result.responsibilities : []).map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>{r}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-gray-700 mb-1.5">Requirements ({(Array.isArray(result.requirements) ? result.requirements : []).length})</p>
                  <ul className="space-y-1 bg-gray-50 rounded-lg p-3">
                    {(Array.isArray(result.requirements) ? result.requirements : []).map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>{r}</li>)}
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Skills ({(Array.isArray(result.skills) ? result.skills : []).length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(result.skills) ? result.skills : []).map(s => (
                    <span key={s} className="bg-violet-100 text-violet-700 text-xs px-2.5 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Benefits</p>
                <ul className="text-xs text-gray-600 space-y-0.5 columns-2">
                  {(Array.isArray(result.benefits) ? result.benefits : []).map((b, i) => <li key={i} className="flex gap-1.5"><span className="text-green-500">✓</span>{b}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button
                onClick={() => jdMutation.mutate()}
                disabled={!role || !keyReqs || jdMutation.isPending}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {jdMutation.isPending
                  ? <><Loader2 size={15} className="animate-spin" /> Generating with AI...</>
                  : <><Sparkles size={15} /> Generate Job Post <ArrowRight size={15} /></>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={15} /> Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => { setResult(null); setStep(1); jdMutation.mutate(); }}
                  disabled={jdMutation.isPending}
                  className="flex items-center gap-1.5 border border-violet-300 text-violet-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-50 transition-colors disabled:opacity-50"
                >
                  {jdMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Regenerate
                </button>
                <button
                  onClick={handleApply}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
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

// ─── Main PostJob Page ─────────────────────────────────────────────────────────

export function PostJob() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEditing = !!id;
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
  });

  const { data: existingJob, isLoading: jobLoading } = useQuery({
    queryKey: ['employer-job', id],
    queryFn: () => api.get(`/employer/jobs?id=${id}`).then((r) => r.data.data.items?.[0]),
    enabled: isEditing,
  });

  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(existingJob?.skills || []);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreateJobInput>({
    resolver: zodResolver(createJobSchema),
    values: existingJob as CreateJobInput,
  });

  const handleApplyAIResult = (result: AIJDResult) => {
    const responsibilities = Array.isArray(result.responsibilities) ? result.responsibilities : [];
    const requirements_arr = Array.isArray(result.requirements) ? result.requirements : [];
    const niceToHave = Array.isArray(result.niceToHave) ? result.niceToHave : [];
    const benefits_arr = Array.isArray(result.benefits) ? result.benefits : [];
    const skills_arr = Array.isArray(result.skills) ? result.skills : [];

    const description = [
      result.summary,
      '\n\nResponsibilities:\n' + responsibilities.map(r => `• ${r}`).join('\n'),
    ].join('');
    const requirements = requirements_arr.concat(niceToHave.map(n => `(Preferred) ${n}`)).map(r => `• ${r}`).join('\n');
    const benefits = benefits_arr.map(b => `• ${b}`).join('\n');

    setValue('description', description);
    setValue('requirements', requirements);
    setValue('benefits', benefits);
    if (!watch('title')) setValue('title', result.title);

    // Apply suggested parameters
    if (result.suggestedSalaryMin) setValue('salaryMin', result.suggestedSalaryMin);
    if (result.suggestedSalaryMax) setValue('salaryMax', result.suggestedSalaryMax);
    if (result.suggestedExperienceMin != null) setValue('experienceMin', result.suggestedExperienceMin);
    if (result.suggestedExperienceMax != null) setValue('experienceMax', result.suggestedExperienceMax);
    if (result.suggestedEmploymentType) setValue('employmentType', result.suggestedEmploymentType as CreateJobInput['employmentType']);
    if (result.suggestedWorkMode) setValue('workMode', result.suggestedWorkMode as CreateJobInput['workMode']);
    if (result.suggestedLevel) setValue('level', result.suggestedLevel);

    setSkills(prev => Array.from(new Set([...prev, ...skills_arr.slice(0, 12)])));
    toast.success('AI content applied to form!');
  };

  const mutation = useMutation({
    mutationFn: (data: CreateJobInput) =>
      isEditing ? api.put(`/employer/jobs/${id}`, { ...data, skills }) : api.post('/employer/jobs', { ...data, skills }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employer-jobs'] });
      toast.success(isEditing ? 'Job updated!' : 'Job created!');
      navigate('/employer/jobs');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const flatCats = categories ? categories.flatMap((c: { id: string; name: string; children?: { id: string; name: string }[] }) =>
    c.children?.length
      ? c.children.map((ch: { id: string; name: string }) => ({ value: ch.id, label: `${c.name} › ${ch.name}` }))
      : [{ value: c.id, label: c.name }]
  ) : [];

  if (isEditing && jobLoading) return <PageSpinner />;

  return (
    <div className="max-w-3xl">
      {wizardOpen && <AIJobWizard onApply={handleApplyAIResult} onClose={() => setWizardOpen(false)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Job' : 'Post a New Job'}</h1>
        {!isEditing && (
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-violet-200"
          >
            <Sparkles size={16} />
            Create with AI
          </button>
        )}
      </div>

      {/* AI hint banner (only when form is empty) */}
      {!isEditing && !watch('title') && (
        <div className="mb-6 flex items-center gap-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl px-5 py-4">
          <div className="bg-violet-600 text-white p-2 rounded-xl flex-shrink-0">
            <Wand2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900">Save time with AI</p>
            <p className="text-xs text-violet-600 mt-0.5">Enter a role + requirements and Claude will write your entire job post — description, salary, skills, and more.</p>
          </div>
          <button
            onClick={() => setWizardOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          >
            <Sparkles size={13} /> Try it
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, skills }))} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic Information</h2>
          <Input {...register('title')} label="Job Title" placeholder="Senior Software Engineer" error={errors.title?.message} required />
          <Select {...register('categoryId')} label="Category" options={flatCats} placeholder="Select category" error={errors.categoryId?.message} required />
          <Select {...register('emirate')} label="Emirate" options={emirateOptions} error={errors.emirate?.message} required />
          <Input {...register('location')} label="Location" placeholder="Business Bay, Dubai" />
        </div>

        {/* Job type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Job Type</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select {...register('workMode')} label="Work Mode" options={workModeOptions} required />
            <Select {...register('employmentType')} label="Employment Type" options={employmentOptions} required />
            <Select {...register('visaStatus')} label="Visa Status" options={visaOptions} required />
            <Select {...register('level')} label="Seniority Level" options={levelOptions} placeholder="Select level" />
          </div>
        </div>

        {/* Salary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Salary</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input {...register('salaryMin', { valueAsNumber: true })} label="Salary Min (AED)" type="number" placeholder="10000" />
            <Input {...register('salaryMax', { valueAsNumber: true })} label="Salary Max (AED)" type="number" placeholder="20000" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" {...register('salaryNegotiable')} className="rounded" />
            Salary is negotiable
          </label>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Experience</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input {...register('experienceMin', { valueAsNumber: true })} label="Min Experience (years)" type="number" min={0} placeholder="2" />
            <Input {...register('experienceMax', { valueAsNumber: true })} label="Max Experience (years)" type="number" placeholder="7" />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Required Skills</h2>
          <div className="flex gap-2 mb-3">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Type a skill and press Enter"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <Button type="button" variant="secondary" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))} className="text-gray-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Description</h2>
          <Textarea {...register('description')} label="Job Description" rows={10} placeholder="Describe the role, responsibilities, and what you're looking for..." error={errors.description?.message} required />
          <Textarea {...register('requirements')} label="Requirements (optional)" rows={5} placeholder="List specific requirements..." />
          <Textarea {...register('benefits')} label="Benefits & Perks (optional)" rows={4} placeholder="Health insurance, annual leave, etc..." />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/employer/jobs')}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {isEditing ? 'Update Job' : 'Save as Draft'}
          </Button>
        </div>
      </form>
    </div>
  );
}
