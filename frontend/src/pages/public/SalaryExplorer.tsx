import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Banknote, TrendingUp, MapPin, Briefcase, Search, ChevronDown, Plus, X } from 'lucide-react';
import { api } from '../../lib/api';
import { EMIRATES_LABELS, Emirates } from '@uaejobs/shared';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Construction', 'Retail',
  'Hospitality & Tourism', 'Education', 'Oil & Gas', 'Logistics', 'Real Estate',
  'Marketing & Advertising', 'Legal', 'HR & Recruitment', 'Consulting', 'Media',
];

function fmt(n?: number | null) {
  if (!n) return 'N/A';
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n.toLocaleString();
}

function SalaryBar({ min, max, absMax }: { min: number | null; max: number | null; absMax: number }) {
  if (!min && !max) return null;
  const left = ((min || 0) / absMax) * 100;
  const width = (((max || min || 0) - (min || 0)) / absMax) * 100;
  return (
    <div className="relative h-2 bg-gray-100 rounded-full w-full">
      <div
        className="absolute h-2 rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
        style={{ left: `${left}%`, width: `${Math.max(width, 4)}%` }}
      />
    </div>
  );
}

export function SalaryExplorer() {
  const [jobTitle, setJobTitle] = useState('');
  const [industry, setIndustry] = useState('');
  const [emirate, setEmirate] = useState('');
  const [searched, setSearched] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const [submitData, setSubmitData] = useState({
    jobTitle: '', industry: '', emirate: '', experienceMin: 0, experienceMax: 5,
    salaryMin: 0, salaryMax: 0, isAnonymous: true,
  });

  const { data: topRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['salary-top-roles', emirate],
    queryFn: () => api.get(`/salary/top-roles${emirate ? `?emirate=${emirate}` : ''}`).then((r) => r.data.data),
  });

  const { data: industries } = useQuery({
    queryKey: ['salary-industries'],
    queryFn: () => api.get('/salary/industries').then((r) => r.data.data),
  });

  const { data: exploreData, isLoading: exploreLoading, refetch } = useQuery({
    queryKey: ['salary-explore', jobTitle, industry, emirate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (jobTitle) params.set('jobTitle', jobTitle);
      if (industry) params.set('industry', industry);
      if (emirate) params.set('emirate', emirate);
      return api.get(`/salary/explore?${params}`).then((r) => r.data.data);
    },
    enabled: false,
  });

  const submitMutation = useMutation({
    mutationFn: (data: typeof submitData) => api.post('/salary/submit', data),
    onSuccess: () => {
      toast.success('Salary data submitted! Thank you for contributing.');
      setShowSubmit(false);
      setSubmitData({ jobTitle: '', industry: '', emirate: '', experienceMin: 0, experienceMax: 5, salaryMin: 0, salaryMax: 0, isAnonymous: true });
    },
    onError: () => toast.error('Failed to submit. Please try again.'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    refetch();
  };

  const absMax = Math.max(
    ...(exploreData?.byEmirate?.map((e: { avgMax: number }) => e.avgMax || 0) || [50000]),
    50000
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <Banknote size={14} className="text-emerald-300" />
            <span className="text-emerald-100">Powered by real salary data from UAE professionals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">UAE Salary Explorer</h1>
          <p className="text-lg text-emerald-100/80 mb-10">
            Discover competitive salary ranges across industries, roles, and emirates
          </p>

          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-2xl">
            <div className="flex-1 flex items-center gap-2 px-3">
              <Search size={15} className="text-gray-400 flex-shrink-0" />
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Job title (e.g. Software Engineer)"
                className="w-full text-gray-900 text-sm focus:outline-none placeholder-gray-400 bg-transparent"
              />
            </div>
            <select
              value={emirate}
              onChange={(e) => setEmirate(e.target.value)}
              className="text-sm text-gray-600 border-l border-gray-100 px-3 focus:outline-none bg-transparent cursor-pointer"
            >
              <option value="">All Emirates</option>
              {Object.entries(EMIRATES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors flex-shrink-0"
            >
              Explore Salaries
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Search Results */}
        {searched && (
          <div className="mb-12">
            {exploreLoading ? (
              <div className="text-center py-10 text-gray-500">Analyzing salary data...</div>
            ) : exploreData ? (
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Summary */}
                <div className="md:col-span-1">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="font-bold text-gray-900 mb-4 text-lg">
                      {jobTitle || 'Overall'} Salary
                      {emirate && ` in ${EMIRATES_LABELS[emirate as Emirates]}`}
                    </h2>
                    {exploreData.summary.sampleSize > 0 ? (
                      <>
                        <div className="text-center py-4">
                          <p className="text-xs text-gray-400 mb-1">Average Range</p>
                          <p className="text-3xl font-bold text-emerald-600">
                            AED {fmt(exploreData.summary.avgMin)}
                          </p>
                          <p className="text-gray-400 text-sm">to</p>
                          <p className="text-3xl font-bold text-emerald-700">
                            AED {fmt(exploreData.summary.avgMax)}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">per month</p>
                        </div>
                        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Min Reported</span>
                            <span className="font-semibold">AED {fmt(exploreData.summary.min)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Max Reported</span>
                            <span className="font-semibold">AED {fmt(exploreData.summary.max)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Data Points</span>
                            <span className="font-semibold">{exploreData.summary.sampleSize}</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Banknote size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No data yet for this search.</p>
                        <button onClick={() => setShowSubmit(true)} className="mt-2 text-emerald-600 text-xs underline">
                          Be the first to submit your salary!
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* By Emirate */}
                <div className="md:col-span-2">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Salary by Emirate</h3>
                    <div className="space-y-3">
                      {exploreData.byEmirate?.length > 0 ? exploreData.byEmirate.map((e: { emirate: string; avgMin: number | null; avgMax: number | null; count: number }) => (
                        <div key={e.emirate} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{EMIRATES_LABELS[e.emirate as Emirates] || e.emirate}</span>
                            <span className="text-emerald-600 font-semibold">
                              AED {fmt(e.avgMin)} – {fmt(e.avgMax)}
                            </span>
                          </div>
                          <SalaryBar min={e.avgMin} max={e.avgMax} absMax={absMax} />
                          <p className="text-xs text-gray-400">{e.count} data points</p>
                        </div>
                      )) : (
                        <p className="text-gray-400 text-sm text-center py-4">No emirate data available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Top Roles by Salary */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-600" /> Top Roles by Salary
              </h2>
              <select
                value={emirate}
                onChange={(e) => setEmirate(e.target.value)}
                className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
              >
                <option value="">All Emirates</option>
                {Object.entries(EMIRATES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {rolesLoading ? (
                [...Array(8)].map((_, i) => <div key={i} className="p-4"><div className="skeleton h-4 rounded w-3/4" /></div>)
              ) : topRoles?.map((role: { jobTitle: string; avgMin: number | null; avgMax: number | null; count: number }, i: number) => (
                <div
                  key={role.jobTitle}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => { setJobTitle(role.jobTitle); setSearched(true); refetch(); }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-800">{role.jobTitle}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      AED {fmt(role.avgMin)}–{fmt(role.avgMax)}
                    </p>
                    <p className="text-xs text-gray-400">{role.count} reports</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Industries */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-brand-600" /> By Industry
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {industries?.map((ind: { industry: string | null; avgMin: number | null; avgMax: number | null; count: number }) => (
                <div
                  key={ind.industry}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => { setIndustry(ind.industry || ''); setSearched(true); refetch(); }}
                >
                  <span className="text-sm font-medium text-gray-800">{ind.industry}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">
                      AED {fmt(ind.avgMin)}–{fmt(ind.avgMax)}
                    </p>
                    <p className="text-xs text-gray-400">{ind.count} reports</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit salary CTA */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Know your worth?</h3>
          <p className="text-gray-500 mb-4 text-sm">Share your salary anonymously and help others in the UAE job market</p>
          <button
            onClick={() => setShowSubmit(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> Submit My Salary
          </button>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900">Submit Your Salary</h3>
              <button onClick={() => setShowSubmit(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  value={submitData.jobTitle}
                  onChange={(e) => setSubmitData({ ...submitData, jobTitle: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <select
                    value={submitData.industry}
                    onChange={(e) => setSubmitData({ ...submitData, industry: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select...</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emirate</label>
                  <select
                    value={submitData.emirate}
                    onChange={(e) => setSubmitData({ ...submitData, emirate: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select...</option>
                    {Object.entries(EMIRATES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (AED/mo) *</label>
                  <input
                    type="number"
                    value={submitData.salaryMin || ''}
                    onChange={(e) => setSubmitData({ ...submitData, salaryMin: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (AED/mo) *</label>
                  <input
                    type="number"
                    value={submitData.salaryMax || ''}
                    onChange={(e) => setSubmitData({ ...submitData, salaryMax: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 20000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={submitData.experienceMin}
                    onChange={(e) => setSubmitData({ ...submitData, experienceMin: Number(e.target.value) })}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Min"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="number"
                    value={submitData.experienceMax}
                    onChange={(e) => setSubmitData({ ...submitData, experienceMax: Number(e.target.value) })}
                    className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={submitData.isAnonymous}
                  onChange={(e) => setSubmitData({ ...submitData, isAnonymous: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Submit anonymously
              </label>
              <button
                onClick={() => submitMutation.mutate(submitData)}
                disabled={!submitData.jobTitle || !submitData.salaryMin || !submitData.salaryMax || submitMutation.isPending}
                className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Salary Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
