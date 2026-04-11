import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { EMIRATES_LABELS } from '@uaejobs/shared';

function ApplicationsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
          <div className="skeleton h-12 w-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-3/5" />
            <div className="skeleton h-3 rounded w-2/5" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="skeleton h-5 rounded-full w-20" />
            <div className="skeleton h-3 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

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
        <ApplicationsSkeleton />
      ) : !data?.items?.length ? (
        <EmptyState
          illustration="applications"
          title="No applications yet"
          description="Start applying to jobs that match your skills and experience."
          action={{ label: 'Browse Jobs', to: '/jobs' }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((app: {
              id: string; status: string; createdAt: string;
              job: { id: string; title: string; slug: string; emirate: string; employer: { companyName: string; logoUrl?: string } }
            }) => (
              <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                {app.job.employer.logoUrl ? (
                  <img loading="lazy" decoding="async" src={app.job.employer.logoUrl} alt="" className="h-12 w-12 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 font-bold flex-shrink-0">
                    {app.job.employer.companyName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <Link to={`/job/${app.job.slug}`} className="font-semibold text-gray-900 hover:text-brand-600 text-sm">
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
