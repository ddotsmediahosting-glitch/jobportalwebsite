import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Briefcase } from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { Pagination } from '../../components/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { EmptyState } from '../../components/ui/EmptyState';
import { SEOHead, buildBreadcrumbSchema } from '../../components/SEOHead';
import { PageSpinner } from '../../components/ui/Spinner';

const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ddotsmediajobs.com';

// Map city slug in URL to emirate enum value
const CITY_SLUG_TO_EMIRATE: Record<string, string> = {
  dubai: 'DUBAI',
  'abu-dhabi': 'ABU_DHABI',
  sharjah: 'SHARJAH',
  ajman: 'AJMAN',
  'ras-al-khaimah': 'RAS_AL_KHAIMAH',
  fujairah: 'FUJAIRAH',
  'umm-al-quwain': 'UMM_AL_QUWAIN',
  uae: '', // no emirate filter
};

const EMIRATE_LABELS: Record<string, string> = {
  DUBAI: 'Dubai', ABU_DHABI: 'Abu Dhabi', SHARJAH: 'Sharjah',
  AJMAN: 'Ajman', RAS_AL_KHAIMAH: 'Ras Al Khaimah',
  FUJAIRAH: 'Fujairah', UMM_AL_QUWAIN: 'Umm Al Quwain',
};

interface ParsedSlug {
  categorySlug: string;
  emirate: string | null;
  emirateName: string | null;
}

function parseCategorySlug(slug: string): ParsedSlug | null {
  // Pattern: {category-slug}-jobs-{city-slug}  e.g. accounting-jobs-uae, it-jobs-dubai
  const idx = slug.lastIndexOf('-jobs-');
  if (idx === -1) return null;

  const categorySlug = slug.slice(0, idx);
  const citySlug = slug.slice(idx + 6); // length of '-jobs-'

  if (!(citySlug in CITY_SLUG_TO_EMIRATE)) return null;

  const emirate = CITY_SLUG_TO_EMIRATE[citySlug] || null;
  const emirateName = emirate ? (EMIRATE_LABELS[emirate] ?? citySlug) : null;

  return { categorySlug, emirate, emirateName };
}

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
}

export function CategoryJobs() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const parsed = categorySlug ? parseCategorySlug(categorySlug) : null;

  // Backward compat: if slug doesn't match the category pattern,
  // try fetching it as a job and redirect to /job/:slug
  const { data: legacyJob, isLoading: checkingLegacy } = useQuery({
    queryKey: ['legacy-job-check', categorySlug],
    queryFn: () => api.get(`/jobs/${categorySlug}`).then((r) => r.data.data).catch(() => null),
    enabled: !parsed && !!categorySlug,
    staleTime: Infinity,
  });

  // Fetch category tree
  const { data: categories, isLoading: catsLoading } = useQuery<CategoryNode[]>({
    queryKey: ['categories', 'tree'],
    queryFn: () => api.get('/categories').then((r) => r.data.data),
    staleTime: 5 * 60_000,
    enabled: !!parsed,
  });

  // Match category by slug (check parent and children)
  const matchedCategory = React.useMemo(() => {
    if (!parsed || !categories) return undefined;
    for (const cat of categories) {
      if (cat.slug === parsed.categorySlug) return cat;
      for (const child of cat.children ?? []) {
        if (child.slug === parsed.categorySlug) return child;
      }
    }
    return null;
  }, [parsed, categories]);

  // Fetch jobs for this category page
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 'category-page', matchedCategory?.id ?? 'unknown', parsed?.emirate, page],
    queryFn: () => {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (matchedCategory?.id) params.categoryId = matchedCategory.id;
      if (parsed?.emirate) params.emirate = parsed.emirate;
      return api.get('/jobs', { params }).then((r) => r.data.data);
    },
    enabled: !!parsed && matchedCategory !== undefined,
    placeholderData: (prev) => prev,
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

  // Handle legacy job slug redirect
  if (!parsed) {
    if (checkingLegacy) return <PageSpinner />;
    if (legacyJob?.slug) return <Navigate to={`/job/${legacyJob.slug}`} replace />;
    return <Navigate to="/jobs" replace />;
  }

  const isLoading = catsLoading || jobsLoading;

  // If categories loaded but no match found, treat as a no-result page (not redirect)
  const categoryName = matchedCategory?.name
    ?? parsed.categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const locationName = parsed.emirateName ?? 'UAE';
  const year = new Date().getFullYear();
  const total = jobsData?.total ?? 0;

  const pageTitle = `${categoryName} Jobs in ${locationName} ${year} | ${total > 0 ? `${total.toLocaleString()}+` : 'Latest'} Vacancies – DdotsmediaJobs`;
  const pageDescription = `Browse ${total > 0 ? `${total.toLocaleString()}+` : 'the latest'} ${categoryName} jobs in ${locationName}. Find verified vacancies updated daily. Apply free on DdotsmediaJobs.`;
  const canonicalUrl = `${BASE_URL}/jobs/${categorySlug}`;

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Jobs in UAE', url: `${BASE_URL}/jobs` },
    { name: `${categoryName} Jobs in ${locationName}`, url: canonicalUrl },
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
        jsonLd={buildBreadcrumbSchema(breadcrumbs)}
      />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase size={18} className="text-brand-500" />
            {categoryName} Jobs in {locationName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {jobsData
              ? <><span className="font-semibold text-gray-800">{total.toLocaleString()}</span> positions available</>
              : 'Searching jobs…'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <div className="flex gap-2 pt-1">
                  <div className="skeleton h-5 rounded-full w-16" />
                  <div className="skeleton h-5 rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !jobsData?.items?.length ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card">
            <EmptyState
              illustration="search"
              title="No jobs found"
              description={`No ${categoryName} jobs in ${locationName} right now. Try browsing all jobs.`}
            />
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {jobsData.items.map((job: Parameters<typeof JobCard>[0]['job']) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobs?.has(job.id)}
                  onSave={user?.role === 'SEEKER' ? () => saveMutation.mutate(job.id) : undefined}
                />
              ))}
            </div>
            {jobsData.totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={jobsData.totalPages}
                total={jobsData.total}
                limit={jobsData.limit}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
