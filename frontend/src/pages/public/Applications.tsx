import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api, getApiError } from '../../lib/api';
import { ApplicationStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { EMIRATES_LABELS } from '@uaejobs/shared';

const WITHDRAWABLE_STATUSES = new Set(['SUBMITTED', 'VIEWED', 'SHORTLISTED']);

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
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications', page],
    queryFn: () => api.get(`/seeker/applications?page=${page}`).then((r) => r.data.data),
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) =>
      api.delete(`/seeker/applications/${applicationId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Application withdrawn');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleWithdraw = (id: string, jobTitle: string) => {
    if (!window.confirm(`Withdraw your application for "${jobTitle}"? The employer will be notified and you cannot reapply unless they relist the role.`)) {
      return;
    }
    withdrawMutation.mutate(id);
  };

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
                  {WITHDRAWABLE_STATUSES.has(app.status) && (
                    <button
                      onClick={() => handleWithdraw(app.id, app.job.title)}
                      disabled={withdrawMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-700 hover:underline mt-0.5 disabled:opacity-50"
                    >
                      Withdraw
                    </button>
                  )}
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
