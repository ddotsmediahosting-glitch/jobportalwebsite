import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';

function SavedJobsSkeleton() {
  return (
    <div className="grid gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex gap-3">
            <div className="skeleton h-11 w-11 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 rounded w-3/4" />
              <div className="skeleton h-3 rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="skeleton h-3 rounded w-24" />
            <div className="skeleton h-3 rounded w-16" />
            <div className="skeleton h-3 rounded w-20" />
          </div>
          <div className="flex gap-1.5">
            <div className="skeleton h-5 rounded-full w-16" />
            <div className="skeleton h-5 rounded-full w-20" />
            <div className="skeleton h-5 rounded-full w-14" />
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-50">
            <div className="skeleton h-4 rounded w-24" />
            <div className="skeleton h-7 rounded-lg w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SavedJobs() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-jobs', page],
    queryFn: () => api.get(`/seeker/saved-jobs?page=${page}`).then((r) => r.data.data),
  });

  const removeMutation = useMutation({
    mutationFn: (jobId: string) => api.delete(`/seeker/saved-jobs/${jobId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saved-jobs'] }); toast.success('Removed from saved'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Saved Jobs</h1>

      {isLoading ? (
        <SavedJobsSkeleton />
      ) : !data?.items?.length ? (
        <EmptyState
          illustration="saved"
          title="No saved jobs yet"
          description="Bookmark jobs you're interested in and come back to them anytime."
          action={{ label: 'Browse Jobs', to: '/jobs' }}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {data.items.map((job: Parameters<typeof JobCard>[0]['job']) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={true}
                onSave={() => removeMutation.mutate(job.id)}
              />
            ))}
          </div>
          <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
