import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { SlidersHorizontal, X, Briefcase, Bell, BellRing } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { JobFilters, CategoryNode } from '../../components/JobFilters';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/ui/EmptyState';
import { SEOHead, buildBreadcrumbSchema } from '../../components/SEOHead';
import { EMIRATES_LABELS } from '@uaejobs/shared';

const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ddotsmediajobs.com';

// City intro copy — shown when browsing by emirate
const CITY_INTRO: Record<string, string> = {
  DUBAI: 'Dubai is the UAE\'s commercial hub and home to thousands of job opportunities across technology, finance, hospitality, retail, and construction. Whether you\'re a recent graduate or an experienced professional, DdotsmediaJobs lists the latest Dubai vacancies from top employers updated daily.',
  ABU_DHABI: 'Abu Dhabi, the UAE capital, offers a wide range of career opportunities in government, oil & gas, healthcare, and financial services. Browse the latest Abu Dhabi job vacancies below and apply free on DdotsmediaJobs.',
  SHARJAH: 'Sharjah is a growing business and cultural centre in the UAE with strong demand for professionals in education, manufacturing, logistics, and healthcare. Find the latest jobs in Sharjah on DdotsmediaJobs.',
  AJMAN: 'Ajman offers competitive career opportunities in manufacturing, retail, and services. Explore the latest job vacancies in Ajman and apply directly on DdotsmediaJobs.',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah is rapidly expanding with opportunities in tourism, ceramics, construction, and free zone businesses. Discover the latest RAK job openings on DdotsmediaJobs.',
  FUJAIRAH: 'Fujairah\'s growing port and free zone create strong demand for logistics, shipping, and trade professionals. Find jobs in Fujairah on DdotsmediaJobs.',
  UMM_AL_QUWAIN: 'Umm Al Quwain offers emerging opportunities in industry and tourism. Browse UAQ vacancies on DdotsmediaJobs.',
};

const FILTER_LABELS: Record<string, string> = {
  q: 'Search', emirate: 'Emirate', workMode: 'Work Mode',
  employmentType: 'Type', salaryMin: 'Min Salary', salaryMax: 'Max Salary',
  isFeatured: 'Featured', isEmiratization: 'Emiratization',
};

export function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = Object.fromEntries(searchParams.entries());
  const page = Number(filters.page) || 1;

  // Build API params: subcategoryId overrides categoryId for the actual API call
  const apiParams: Record<string, string | number> = { ...filters, page };
  if (apiParams.subcategoryId) {
    apiParams.categoryId = apiParams.subcategoryId;
    delete apiParams.subcategoryId;
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => api.get('/jobs', { params: apiParams }).then((r) => r.data.data),
    placeholderData: (prev) => prev,
  });

  const { data: categories } = useQuery<CategoryNode[]>({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  const { data: savedJobs } = useQuery({
    queryKey: ['saved-jobs-ids'],
    queryFn: () =>
      user?.role === 'SEEKER'
        ? api.get('/seeker/saved-jobs?limit=200').then((r) => new Set(r.data.data.items.map((j: { id: string }) => j.id)))
        : new Set<string>(),
    enabled: user?.role === 'SEEKER',
  });

  const saveMutation = useMutation({
    mutationFn: (jobId: string) =>
      savedJobs?.has(jobId)
        ? api.delete(`/seeker/saved-jobs/${jobId}`)
        : api.post(`/seeker/saved-jobs/${jobId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saved-jobs-ids'] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  // Save current search as a JobAlert — sends daily email with new matches.
  const saveSearchMutation = useMutation({
    mutationFn: () => {
      const name = filters.q
        ? `Alert: ${filters.q}`
        : filters.emirate
          ? `Jobs in ${EMIRATES_LABELS[filters.emirate as keyof typeof EMIRATES_LABELS] || filters.emirate}`
          : 'My Job Alert';
      return api.post('/seeker/alerts', {
        name,
        keywords: filters.q || undefined,
        categoryId: filters.subcategoryId || filters.categoryId || undefined,
        emirate: filters.emirate || undefined,
        workMode: filters.workMode || undefined,
        salaryMin: filters.salaryMin ? Number(filters.salaryMin) : undefined,
        frequency: 'DAILY',
      });
    },
    onSuccess: () => toast.success('Search saved — you\'ll get email alerts for new matching jobs'),
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setSearchParams({ ...newFilters, page: '1' });
    setMobileFiltersOpen(false);
  };

  const activeFilters = Object.entries(filters).filter(([k, v]) => k !== 'page' && v);

  const getCategoryName = (id: string) => categories?.find((c) => c.id === id)?.name ?? id;
  const getSubcategoryName = (id: string) => {
    for (const cat of categories ?? []) {
      const found = cat.children?.find((s) => s.id === id);
      if (found) return found.name;
    }
    return id;
  };

  const getFilterChipLabel = (key: string, value: string) => {
    if (key === 'categoryId') return getCategoryName(value);
    if (key === 'subcategoryId') return getSubcategoryName(value);
    if (key === 'isFeatured') return 'Featured only';
    if (key === 'isEmiratization') return 'Emiratization only';
    return `${FILTER_LABELS[key] ?? key}: ${value}`;
  };

  const removeFilter = (key: string) => {
    const next = { ...filters };
    delete next[key];
    if (key === 'categoryId') delete next.subcategoryId;
    setSearchParams({ ...next, page: '1' });
  };

  // ── Dynamic SEO values ─────────────────────────────────────────────────────
  const emirateCode = filters.emirate as string | undefined;
  const emirateName = emirateCode ? (EMIRATES_LABELS as Record<string, string>)[emirateCode] : null;
  const activeCategoryName = filters.categoryId
    ? categories?.find((c) => c.id === filters.categoryId)?.name ?? null
    : null;
  const totalCount = data?.total ?? 0;
  const year = new Date().getFullYear();

  let pageTitle: string;
  let pageDescription: string;
  let pageH1: string;
  let canonicalSuffix = '';

  if (emirateName) {
    pageH1 = `Jobs in ${emirateName}`;
    pageTitle = `Jobs in ${emirateName} ${year} | ${totalCount > 0 ? `${totalCount.toLocaleString()}+` : 'Latest'} Vacancies – DdotsmediaJobs`;
    pageDescription = `Find the latest jobs in ${emirateName}. ${totalCount > 0 ? `${totalCount.toLocaleString()}+ verified` : 'Thousands of'} vacancies updated daily. Full-time, part-time & visa-sponsored roles. Apply free on DdotsmediaJobs.`;
    canonicalSuffix = `?emirate=${emirateCode}`;
  } else if (activeCategoryName) {
    pageH1 = `${activeCategoryName} Jobs in UAE`;
    pageTitle = `${activeCategoryName} Jobs in UAE ${year} | ${totalCount > 0 ? `${totalCount.toLocaleString()}+` : 'Latest'} Vacancies – DdotsmediaJobs`;
    pageDescription = `Browse ${totalCount > 0 ? `${totalCount.toLocaleString()}+` : 'the latest'} ${activeCategoryName} jobs in UAE. Find vacancies across Dubai, Abu Dhabi, Sharjah and all Emirates. Apply free today on DdotsmediaJobs.`;
    canonicalSuffix = `?categoryId=${filters.categoryId}`;
  } else if (filters.q) {
    pageH1 = `"${filters.q}" Jobs in UAE`;
    pageTitle = `${filters.q} Jobs in UAE ${year} – DdotsmediaJobs`;
    pageDescription = `Find "${filters.q}" jobs in UAE. ${totalCount > 0 ? `${totalCount.toLocaleString()} results` : 'Browse vacancies'} across Dubai, Abu Dhabi, Sharjah and all Emirates on DdotsmediaJobs.`;
  } else {
    pageH1 = 'Browse Jobs in UAE';
    pageTitle = `Jobs in UAE ${year} | 10,000+ Vacancies – DdotsmediaJobs`;
    pageDescription = `Browse 10,000+ verified jobs in UAE. Find vacancies in Dubai, Abu Dhabi, Sharjah and all Emirates. Full-time, part-time, fresher & visa-sponsored roles. Apply free today.`;
    canonicalSuffix = '';
  }

  const canonicalUrl = `${BASE_URL}/jobs${canonicalSuffix}`;
  const cityIntro = emirateCode ? CITY_INTRO[emirateCode] ?? null : null;

  const breadcrumbItems = [
    { name: 'Home', url: BASE_URL },
    { name: 'Jobs in UAE', url: `${BASE_URL}/jobs` },
    ...(emirateName ? [{ name: `Jobs in ${emirateName}`, url: canonicalUrl }] : []),
    ...(activeCategoryName ? [{ name: `${activeCategoryName} Jobs`, url: canonicalUrl }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={canonicalUrl}
        ogUrl={canonicalUrl}
        ogTitle={pageTitle}
        ogDescription={pageDescription}
        jsonLd={buildBreadcrumbSchema(breadcrumbItems)}
      />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Briefcase size={18} className="text-brand-500" /> {pageH1}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data
                  ? <><span className="font-semibold text-gray-800">{data.total.toLocaleString()}</span> positions available</>
                  : 'Searching jobs…'
                }
                {isFetching && !isLoading && (
                  <span className="ml-2 text-[10px] font-medium text-brand-500 bg-brand-50 px-2 py-0.5 rounded-full">updating…</span>
                )}
              </p>
            </div>

            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm"
            >
              <SlidersHorizontal size={14} /> Filters
              {activeFilters.length > 0 && (
                <span className="bg-white text-brand-700 text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {activeFilters.map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1.5 rounded-full"
                >
                  {getFilterChipLabel(key, value)}
                  <button
                    type="button"
                    onClick={() => removeFilter(key)}
                    className="ml-0.5 hover:text-brand-900 transition-colors"
                    aria-label={`Remove ${key} filter`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors px-1"
              >
                Clear all
              </button>
              {user?.role === 'SEEKER' && (
                <button
                  type="button"
                  onClick={() => saveSearchMutation.mutate()}
                  disabled={saveSearchMutation.isPending}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  title="Get daily email alerts for new jobs matching this search"
                >
                  {saveSearchMutation.isPending ? <BellRing className="h-3.5 w-3.5 animate-pulse" /> : <Bell className="h-3.5 w-3.5" />}
                  Save search → email me
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative w-80 max-w-full bg-white h-full overflow-y-auto shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                <SlidersHorizontal size={14} className="text-brand-500" /> Filters
              </h2>
              <button type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="p-4">
              <JobFilters values={filters} onChange={handleFilterChange} categories={categories} />
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar — desktop */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <JobFilters values={filters} onChange={handleFilterChange} categories={categories} />
            </div>
          </div>

          {/* Job list */}
          <div className="flex-1 min-w-0">
            {/* City / category intro paragraph (SEO content block) */}
            {cityIntro && !isLoading && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-card">
                <h2 className="font-semibold text-gray-900 mb-1 text-sm">{pageH1}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{cityIntro}</p>
              </div>
            )}

            {isLoading ? (
              <div className="grid gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 shadow-card">
                    <div className="flex gap-3">
                      <div className="skeleton h-11 w-11 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="skeleton h-4 rounded-lg w-3/4" />
                        <div className="skeleton h-3 rounded-lg w-1/2" />
                      </div>
                    </div>
                    <div className="skeleton h-3 rounded-lg w-full" />
                    <div className="skeleton h-3 rounded-lg w-2/3" />
                    <div className="flex gap-2 pt-1">
                      <div className="skeleton h-5 rounded-full w-16" />
                      <div className="skeleton h-5 rounded-full w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.items?.length ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
                <EmptyState
                  illustration="search"
                  title="No jobs found"
                  description="Try adjusting your filters or search terms."
                  className="col-span-full py-12"
                />
              </div>
            ) : (
              <>
                <div className={`grid gap-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : ''}`}>
                  {data.items.map((job: Parameters<typeof JobCard>[0]['job']) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      isSaved={savedJobs?.has(job.id)}
                      onSave={user?.role === 'SEEKER' ? () => saveMutation.mutate(job.id) : undefined}
                    />
                  ))}
                </div>

                <Pagination
                  page={page}
                  totalPages={data.totalPages}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(p) => setSearchParams({ ...filters, page: String(p) })}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
