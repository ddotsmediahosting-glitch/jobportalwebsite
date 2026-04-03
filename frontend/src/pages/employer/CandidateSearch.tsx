import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Bookmark, BookmarkCheck, User, Zap, Star, Clock, Filter, X } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { EMIRATES_LABELS, WORK_MODE_LABELS, Emirates, WorkMode } from '@uaejobs/shared';
import toast from 'react-hot-toast';

const EXPERIENCE_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '0–2 yrs', value: '0-2' },
  { label: '2–5 yrs', value: '2-5' },
  { label: '5–10 yrs', value: '5-10' },
  { label: '10+ yrs', value: '10-' },
];

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  headline: string | null;
  emirate: Emirates | null;
  skills: string[];
  yearsOfExperience: number | null;
  desiredRole: string | null;
  desiredWorkModes: WorkMode[];
  desiredSalaryMin: number | null;
  desiredSalaryMax: number | null;
  immediateJoiner: boolean;
  noticePeriod: string | null;
  avatarUrl: string | null;
  isSaved: boolean;
  user: { id: string };
}

export function CandidateSearch() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [emirate, setEmirate] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [expRange, setExpRange] = useState('');
  const [skills, setSkills] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const buildParams = () => {
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (q) params.set('q', q);
    if (emirate) params.set('emirate', emirate);
    if (workMode) params.set('workMode', workMode);
    if (skills) params.set('skills', skills);
    if (expRange) {
      const [min, max] = expRange.split('-');
      if (min) params.set('experienceMin', min);
      if (max) params.set('experienceMax', max);
    }
    return params;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['candidates', q, emirate, workMode, expRange, skills, page],
    queryFn: () => api.get(`/candidates/search?${buildParams()}`).then((r) => r.data.data),
    enabled: hasSearched,
  });

  const saveMutation = useMutation({
    mutationFn: ({ seekerUserId, isSaved }: { seekerUserId: string; isSaved: boolean }) =>
      isSaved
        ? api.delete(`/candidates/save/${seekerUserId}`)
        : api.post(`/candidates/save/${seekerUserId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] });
      toast.success('Candidate list updated');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setHasSearched(true);
  };

  const isPremiumError = (error as { response?: { status?: number } })?.response?.status === 402;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Search</h1>
        <p className="text-sm text-gray-500 mt-0.5">Search public seeker profiles (Premium feature)</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Skills, job title, or keywords..."
              className="w-full text-sm focus:outline-none placeholder-gray-400"
            />
          </div>
          <select
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none text-gray-600"
          >
            <option value="">Any Emirate</option>
            {Object.entries(EMIRATES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 hover:border-brand-300 transition-colors"
          >
            <Filter size={14} /> Filters
          </button>
          <button
            type="submit"
            className="bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            Search
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                <option value="">Any</option>
                {Object.entries(WORK_MODE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Experience</label>
              <select
                value={expRange}
                onChange={(e) => setExpRange(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              >
                {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Skills (comma-separated)</label>
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Python, AWS..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          </div>
        )}
      </form>

      {/* Premium gate */}
      {isPremiumError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <Star size={32} className="mx-auto text-amber-500 mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">Premium Feature</h3>
          <p className="text-sm text-gray-600 mb-4">Candidate search requires a Premium subscription</p>
          <a href="/employer/billing" className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-colors inline-block">
            Upgrade to Premium
          </a>
        </div>
      )}

      {/* Results */}
      {hasSearched && !isPremiumError && (
        <>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 skeleton h-40" />
              ))}
            </div>
          ) : data?.items?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <User size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No candidates found. Try broader search terms.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">{data?.total || 0} candidates found</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.items?.map((c: Candidate) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {c.avatarUrl ? (
                          <img loading="lazy" decoding="async" src={c.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold">
                            {c.firstName[0]}{c.lastName[0]}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-gray-500">{c.headline || c.desiredRole || 'No headline'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => saveMutation.mutate({ seekerUserId: c.user.id, isSaved: c.isSaved })}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${c.isSaved ? 'text-brand-600 bg-brand-50' : 'text-gray-300 hover:text-brand-500'}`}
                        title={c.isSaved ? 'Remove from saved' : 'Save candidate'}
                      >
                        {c.isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.emirate && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={10} />{EMIRATES_LABELS[c.emirate]}
                        </span>
                      )}
                      {c.yearsOfExperience !== null && (
                        <span className="text-xs text-gray-500">{c.yearsOfExperience}y exp</span>
                      )}
                      {c.immediateJoiner && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          <Zap size={9} /> Immediate
                        </span>
                      )}
                      {c.noticePeriod && !c.immediateJoiner && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={9} />{c.noticePeriod}
                        </span>
                      )}
                    </div>

                    {(Array.isArray(c.skills) ? c.skills : []).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(c.skills) ? c.skills as string[] : []).slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                        {(Array.isArray(c.skills) ? c.skills : []).length > 4 && <span className="text-[10px] text-gray-400">+{(Array.isArray(c.skills) ? c.skills : []).length - 4}</span>}
                      </div>
                    )}

                    {(c.desiredSalaryMin || c.desiredSalaryMax) && (
                      <p className="text-xs text-emerald-600 font-medium mt-2">
                        Expects: AED {c.desiredSalaryMin?.toLocaleString()} – {c.desiredSalaryMax?.toLocaleString()}/mo
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {data?.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {[...Array(Math.min(data.totalPages, 5))].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                        page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!hasSearched && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <User size={40} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-1">Search Candidates</h3>
          <p className="text-sm text-gray-400">Use the search above to find qualified candidates across the UAE</p>
        </div>
      )}
    </div>
  );
}
