import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  DollarSign, TrendingUp, TrendingDown, Building2,
  MapPin, Sparkles, Loader2, ChevronDown, ChevronUp,
  Briefcase, Star, AlertCircle, CheckCircle, Info, KeyRound,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';

const EMIRATE_OPTIONS = [
  { value: 'Dubai', label: 'Dubai' },
  { value: 'Abu Dhabi', label: 'Abu Dhabi' },
  { value: 'Sharjah', label: 'Sharjah' },
  { value: 'Ajman', label: 'Ajman' },
  { value: 'Ras Al Khaimah', label: 'Ras Al Khaimah' },
  { value: 'Fujairah', label: 'Fujairah' },
];

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Construction & Real Estate',
  'Retail & E-commerce', 'Tourism & Hospitality', 'Education', 'Energy & Oil & Gas',
  'Logistics & Transportation', 'Media & Advertising', 'Manufacturing', 'Consulting',
  'Legal', 'Government', 'Non-profit',
];

const EXP_OPTIONS = [
  { value: 0, label: 'Entry level (0-1 yrs)' },
  { value: 2, label: 'Junior (2-3 yrs)' },
  { value: 5, label: 'Mid-level (4-6 yrs)' },
  { value: 8, label: 'Senior (7-10 yrs)' },
  { value: 12, label: 'Lead / Principal (10+ yrs)' },
];

interface SalaryInsightsResult {
  role: string;
  emirate: string;
  industry: string;
  salaryMin: number;
  salaryMax: number;
  salaryMedian: number;
  currency: string;
  topPayingCompanies: string[];
  topPayingIndustries: string[];
  topPayingEmirates: string[];
  inDemandSkills: string[];
  salaryFactors: Array<{ factor: string; impact: 'positive' | 'negative'; description: string }>;
  marketOutlook: string;
  negotiationTips: string[];
}

interface FormData {
  role: string;
  industry: string;
  emirate: string;
  yearsOfExperience: number;
}

function SalaryBar({ min, max, median }: { min: number; max: number; median: number }) {
  const range = max - min;
  const medianPct = range > 0 ? ((median - min) / range) * 100 : 50;
  return (
    <div className="relative mt-6 mb-2">
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-brand-300 to-brand-600 rounded-full w-full" />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-brand-600 rounded-full shadow-md"
        style={{ left: `calc(${medianPct}% - 10px)` }}
      />
      <div className="flex justify-between text-xs text-gray-500 mt-3 font-medium">
        <span>AED {min.toLocaleString()}</span>
        <span className="text-brand-700 font-semibold">Median: AED {median.toLocaleString()}</span>
        <span>AED {max.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function SalaryInsights() {
  const [result, setResult] = useState<SalaryInsightsResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('factors');

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api.get('/ai/status').then((r) => r.data.data as { configured: boolean }),
    staleTime: 60_000,
  });

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: { role: '', industry: 'Technology', emirate: 'Dubai', yearsOfExperience: 5 },
  });

  const insightsMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/ai/salary-insights', data).then((r) => r.data.data),
    onSuccess: (data) => setResult(data),
    onError: (err) => toast.error(getApiError(err)),
  });

  const toggle = (key: string) => setExpandedSection(expandedSection === key ? null : key);

  const popularRoles = [
    'Software Engineer', 'Product Manager', 'Data Scientist', 'Marketing Manager',
    'Financial Analyst', 'HR Manager', 'Sales Executive', 'Project Manager',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-800 text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-200 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles size={14} /> AI-Powered Salary Intelligence
          </div>
          <h1 className="text-4xl font-extrabold mb-3">UAE Salary Insights</h1>
          <p className="text-emerald-200 text-lg max-w-xl mx-auto">
            Get real-time AI-powered salary benchmarks for any role across the UAE. Make informed decisions about your career and compensation.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* AI not configured banner */}
        {aiStatus && !aiStatus.configured && (
          <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <KeyRound size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold">AI features are not configured</p>
              <p className="mt-0.5 text-amber-700">Add a valid <code className="bg-amber-100 px-1 rounded">ANTHROPIC_API_KEY</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the API container to enable salary insights.</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" /> Check Salary Benchmark
          </h2>

          <form onSubmit={handleSubmit((d) => insightsMutation.mutate(d))} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title / Role *</label>
              <input
                {...register('role', { required: 'Role is required' })}
                placeholder="e.g. Senior Software Engineer, Marketing Manager"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {errors.role && <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>}

              {/* Quick selects */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {popularRoles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setValue('role', r)}
                    className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <select
                  {...register('industry')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {INDUSTRY_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
                <select
                  {...register('emirate')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {EMIRATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  {...register('yearsOfExperience', { valueAsNumber: true })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {EXP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <Button
              type="submit"
              loading={insightsMutation.isPending}
              icon={insightsMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              {insightsMutation.isPending ? 'Analyzing market data...' : 'Get Salary Insights'}
            </Button>
          </form>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-fade-in">
            {/* Salary Range Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{result.role}</h3>
                  <p className="text-sm text-gray-500">{result.industry} · {result.emirate} · Monthly in AED</p>
                </div>
                <span className="text-4xl font-extrabold text-emerald-600">
                  {result.salaryMedian.toLocaleString()}
                  <span className="text-base text-gray-400 font-normal ml-1">AED</span>
                </span>
              </div>

              <SalaryBar min={result.salaryMin} max={result.salaryMax} median={result.salaryMedian} />

              <div className="mt-5 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 leading-relaxed">{result.marketOutlook}</p>
                </div>
              </div>
            </div>

            {/* In-Demand Skills */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" /> Skills That Command Higher Pay
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.inDemandSkills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-sm bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Top Payers */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Building2 size={14} className="text-purple-500" /> Top Employers
                </h4>
                <ul className="space-y-1.5">
                  {result.topPayingCompanies.map((c, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span className="w-4 h-4 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-blue-500" /> Best Industries
                </h4>
                <ul className="space-y-1.5">
                  {result.topPayingIndustries.map((ind, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                      {ind}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-500" /> Best Emirates
                </h4>
                <ul className="space-y-1.5">
                  {result.topPayingEmirates.map((em, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center gap-1.5">
                      <span className="w-4 h-4 bg-rose-100 text-rose-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                      {em}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Salary Factors - collapsible */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle('factors')}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-emerald-500" /> Salary Factors
                </span>
                {expandedSection === 'factors' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expandedSection === 'factors' && (
                <div className="px-5 pb-5 space-y-2 border-t border-gray-100">
                  {result.salaryFactors.map((f, i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      {f.impact === 'positive' ? (
                        <TrendingUp size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <TrendingDown size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{f.factor}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Negotiation Tips - collapsible */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => toggle('tips')}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle size={16} className="text-brand-500" /> Negotiation Tips for UAE
                </span>
                {expandedSection === 'tips' ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expandedSection === 'tips' && (
                <div className="px-5 pb-5 space-y-2 border-t border-gray-100">
                  {result.negotiationTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 py-1.5">
                      <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-gray-700">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-gray-400 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              <p>Salary data is AI-generated based on market trends and publicly available information. Actual salaries may vary by company, qualifications, and negotiation. Use as a guide only.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
