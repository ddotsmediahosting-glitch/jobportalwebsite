import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

const LINE_WIDTHS = ['w-full', 'w-11/12', 'w-full', 'w-5/6', 'w-full', 'w-4/5'];
const LINE_WIDTHS2 = ['w-full', 'w-3/4', 'w-full', 'w-5/6'];

function ContentPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
      <div className="skeleton h-9 rounded w-2/3 mb-6" />
      {LINE_WIDTHS.map((w, i) => (
        <div key={i} className={`skeleton h-4 rounded ${w}`} />
      ))}
      <div className="h-4" />
      {LINE_WIDTHS2.map((w, i) => (
        <div key={i} className={`skeleton h-4 rounded ${w}`} />
      ))}
    </div>
  );
}

export function ContentPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['content-page', slug],
    queryFn: () => api.get(`/pages/${slug}`).then((r) => r.data.data),
    enabled: !!slug,
  });

  if (isLoading) return <ContentPageSkeleton />;
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
