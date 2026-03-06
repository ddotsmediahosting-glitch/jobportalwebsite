import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { PageSpinner } from '../../components/ui/Spinner';

export function ContentPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content-page', slug],
    queryFn: () => api.get(`/content/${slug}`).then((r) => r.data.data),
    enabled: !!slug,
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !data) return <Navigate to="/" replace />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{data.title}</h1>
      <div
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
    </div>
  );
}
