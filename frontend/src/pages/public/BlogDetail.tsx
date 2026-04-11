import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, Eye, ArrowLeft, Tag } from 'lucide-react';
import { api } from '../../lib/api';
import { SEOHead, buildBreadcrumbSchema } from '../../components/SEOHead';
import { PageSpinner } from '../../components/ui/Spinner';
import { NotFound } from './NotFound';

const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://ddotsmediajobs.com';

interface BlogPost {
  id: string; slug: string; title: string; excerpt?: string | null;
  content: string; coverImage?: string | null; author: string;
  category: string; tags: string[]; readTime?: number | null;
  viewCount: number; publishedAt?: string | null; createdAt: string;
}

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, isError } = useQuery<BlogPost>({
    queryKey: ['blog', slug],
    queryFn: () => api.get(`/blog/${slug}`).then((r) => r.data.data),
    retry: false,
  });

  if (isLoading) return <PageSpinner />;
  if (isError || !post) return <NotFound />;

  const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];

  const breadcrumbs = [
    { name: 'Home', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog` },
    { name: post.title, url: canonicalUrl },
  ];

  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage || undefined,
    author: { '@type': 'Person', name: post.author },
    publisher: {
      '@type': 'Organization',
      name: 'DdotsmediaJobs',
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo.png` },
    },
    datePublished: post.publishedAt || post.createdAt,
    url: canonicalUrl,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead
        title={`${post.title} | DdotsmediaJobs Blog`}
        description={post.excerpt || `Read ${post.title} on DdotsmediaJobs.`}
        canonical={canonicalUrl}
        ogUrl={canonicalUrl}
        ogTitle={post.title}
        ogDescription={post.excerpt || undefined}
        ogImage={post.coverImage || undefined}
        ogType="article"
        jsonLd={{ ...buildBreadcrumbSchema(breadcrumbs), article: jsonLdArticle }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium mb-6"
        >
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        <article className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
          {/* Cover image */}
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 sm:h-80 object-cover"
              loading="eager"
            />
          )}

          <div className="p-6 sm:p-8">
            {/* Category badge */}
            <div className="mb-3">
              <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full font-medium">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-5 border-b border-gray-100 mb-6">
              <span className="font-medium text-gray-700">{post.author}</span>
              {post.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(post.publishedAt).toLocaleDateString('en-AE', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              )}
              {post.readTime && (
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {post.readTime} min read
                </span>
              )}
              <span className="flex items-center gap-1.5 ml-auto">
                <Eye size={13} /> {post.viewCount.toLocaleString()} views
              </span>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-gray-600 text-base leading-relaxed mb-6 font-medium">
                {post.excerpt}
              </p>
            )}

            {/* Content */}
            <div
              className="prose prose-sm sm:prose max-w-none text-gray-700 prose-headings:text-gray-900 prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                <Tag size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* CTA */}
        <div className="mt-8 bg-brand-600 rounded-2xl p-6 text-white text-center">
          <h2 className="text-lg font-bold mb-2">Looking for jobs in UAE?</h2>
          <p className="text-brand-100 text-sm mb-4">
            Browse thousands of verified vacancies across Dubai, Abu Dhabi, Sharjah and all Emirates.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-brand-50 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}
