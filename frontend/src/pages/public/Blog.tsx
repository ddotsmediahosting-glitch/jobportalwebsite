import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Clock, Eye } from 'lucide-react';
import { api } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';

interface BlogPost {
  id: string; slug: string; title: string; excerpt?: string;
  coverImage?: string; author: string; category: string; tags: string[];
  readTime?: number; viewCount: number; publishedAt?: string; createdAt: string;
}

function BlogSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden space-y-3">
          <div className="skeleton w-full h-44" />
          <div className="p-4 space-y-2">
            <div className="skeleton h-4 rounded w-1/3" />
            <div className="skeleton h-4 rounded w-full" />
            <div className="skeleton h-3 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Blog() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['blog', page, search, activeCategory],
    queryFn: () => {
      const p = new URLSearchParams({ page: String(page), limit: '9' });
      if (search) p.set('q', search);
      if (activeCategory) p.set('category', activeCategory);
      return api.get(`/blog?${p}`).then(r => r.data.data);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api.get('/blog/categories').then(r => r.data.data),
  });

  const posts: BlogPost[] = data?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Blog & Articles</h1>
        <p className="text-gray-500 max-w-xl mx-auto">Career tips, industry insights, and UAE job market news to help you stay ahead.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 space-y-6">
          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Search Articles</p>
            <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex gap-2">
              <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <button type="submit" title="Search articles" aria-label="Search articles" className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"><Search size={15} /></button>
            </form>
          </div>

          {/* Categories */}
          {categories?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Categories</p>
              <div className="space-y-1">
                <button type="button" onClick={() => { setActiveCategory(''); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${!activeCategory ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  All Articles <span className="text-xs text-gray-400">{data?.total || ''}</span>
                </button>
                {categories.map((c: { name: string; count: number }) => (
                  <button type="button" key={c.name} onClick={() => { setActiveCategory(c.name); setPage(1); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between items-center ${activeCategory === c.name ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {c.name} <span className="text-xs text-gray-400">{c.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <BlogSkeleton />
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200">
              <EmptyState
                illustration="generic"
                title="No articles yet"
                description="Check back soon for career tips and industry insights."
              />
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                {posts.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-brand-200 transition-all group">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-44 bg-gradient-to-br from-brand-50 to-indigo-50 flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">{post.category}</span>
                      </div>
                      <h2 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">{post.title}</h2>
                      {post.excerpt && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1"><Calendar size={11} />{new Date(post.publishedAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        )}
                        {post.readTime && <span className="flex items-center gap-1"><Clock size={11} />{post.readTime} min read</span>}
                        <span className="flex items-center gap-1 ml-auto"><Eye size={11} />{post.viewCount}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {data?.totalPages > 1 && (
                <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={data.limit} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
