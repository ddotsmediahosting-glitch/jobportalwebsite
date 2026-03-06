import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { JobFilters } from '../../components/JobFilters';
import { Pagination } from '../../components/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

export function Jobs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const filters = Object.fromEntries(searchParams.entries());
  const page = Number(filters.page) || 1;

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () =>
      api.get('/jobs', { params: { ...filters, page } }).then((r) => r.data.data),
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

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setSearchParams({ ...newFilters, page: '1' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Jobs in UAE</h1>
        {data && (
          <p className="text-gray-500 mt-1 text-sm">{data.total.toLocaleString()} jobs found</p>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <div className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            <JobFilters values={filters} onChange={handleFilterChange} />
          </div>
        </div>

        {/* Job list */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <PageSpinner />
          ) : !data?.items?.length ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg font-medium">No jobs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4">
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
  );
}
