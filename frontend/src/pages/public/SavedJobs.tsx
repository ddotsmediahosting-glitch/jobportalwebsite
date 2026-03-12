import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { api, getApiError } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { Pagination } from '../../components/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';

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
        <PageSpinner />
      ) : !data?.items?.length ? (
        <div className="text-center py-20 text-gray-400">
          <p>No saved jobs yet</p>
          <Link to="/jobs" className="text-brand-600 text-sm mt-2 inline-block">Browse jobs →</Link>
        </div>
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
