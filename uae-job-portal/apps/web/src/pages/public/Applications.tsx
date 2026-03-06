import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';
import { EMIRATES_LABELS } from '@uaejobs/shared';

export function Applications() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', page],
    queryFn: () => api.get(`/seeker/applications?page=${page}`).then((r) => r.data.data),
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Applications</h1>

      {isLoading ? (
        <PageSpinner />
      ) : !data?.items?.length ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No applications yet</p>
          <Link to="/jobs" className="text-brand-600 text-sm mt-2 inline-block">Browse jobs →</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((app: {
              id: string; status: string; createdAt: string;
              job: { id: string; title: string; slug: string; emirate: string; employer: { companyName: string; logoUrl?: string } }
            }) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                {app.job.employer.logoUrl ? (
                  <img src={app.job.employer.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain border border-gray-100" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                    {app.job.employer.companyName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/jobs/${app.job.slug}`} className="font-semibold text-gray-900 hover:text-brand-600 text-sm">
                    {app.job.title}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {app.job.employer.companyName} · {EMIRATES_LABELS[app.job.emirate as keyof typeof EMIRATES_LABELS] || app.job.emirate}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <ApplicationStatusBadge status={app.status} />
                  <span className="text-xs text-gray-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            limit={data.limit}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
