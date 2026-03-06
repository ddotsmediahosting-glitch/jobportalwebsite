import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, TrendingUp, Users, Briefcase, ArrowRight, Star } from 'lucide-react';
import { api } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { EMIRATES_LABELS } from '@uaejobs/shared';
import { PageSpinner } from '../../components/ui/Spinner';

export function Home() {
  const navigate = useNavigate();
  const [searchQ, setSearchQ] = useState('');
  const [searchEmirate, setSearchEmirate] = useState('');

  const { data: featuredCategories } = useQuery({
    queryKey: ['categories', 'featured'],
    queryFn: () => api.get('/categories/featured').then((r) => r.data.data),
  });

  const { data: featuredJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', 'featured'],
    queryFn: () => api.get('/jobs?isFeatured=true&limit=6').then((r) => r.data.data),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQ) params.set('q', searchQ);
    if (searchEmirate) params.set('emirate', searchEmirate);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Find Your Dream Job in the <span className="text-gold-400">UAE</span>
            </h1>
            <p className="text-xl text-brand-100 mb-10">
              Thousands of jobs across Abu Dhabi, Dubai, Sharjah and all seven Emirates
            </p>

            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Job title, skills, company..."
                  className="w-full text-gray-900 text-sm focus:outline-none placeholder-gray-400"
                />
              </div>
              <div className="flex items-center gap-2 px-3 border-l border-gray-100">
                <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <select
                  value={searchEmirate}
                  onChange={(e) => setSearchEmirate(e.target.value)}
                  className="text-sm text-gray-700 focus:outline-none bg-transparent"
                >
                  <option value="">All Emirates</option>
                  {Object.entries(EMIRATES_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-brand-700 transition-colors flex-shrink-0"
              >
                Search Jobs
              </button>
            </form>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {['React Developer', 'Nurse Dubai', 'Finance Manager', 'DevOps Engineer', 'Sales Executive'].map((term) => (
                <Link
                  key={term}
                  to={`/jobs?q=${encodeURIComponent(term)}`}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-white/10 bg-black/10">
          <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Briefcase, stat: '10,000+', label: 'Active Jobs' },
              { icon: Users, stat: '50,000+', label: 'Job Seekers' },
              { icon: TrendingUp, stat: '2,000+', label: 'Companies' },
            ].map(({ icon: Icon, stat, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{stat}</div>
                <div className="text-xs text-brand-200">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {featuredCategories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            <Link to="/jobs" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredCategories.map((cat: { id: string; slug: string; name: string; _count?: { jobs: number }; children?: { id: string; name: string; slug: string }[] }) => (
              <Link
                key={cat.id}
                to={`/c/${cat.slug}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-brand-300 hover:shadow-md transition-all group"
              >
                <div className="font-semibold text-gray-900 group-hover:text-brand-600 text-sm mb-1 transition-colors">
                  {cat.name}
                </div>
                <div className="text-xs text-gray-500">{cat._count?.jobs || 0} jobs</div>
                {cat.children?.slice(0, 2).map((child) => (
                  <div key={child.id} className="text-xs text-gray-400 mt-0.5 truncate">{child.name}</div>
                ))}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Jobs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            <Star className="inline h-5 w-5 text-yellow-400 mr-1 -mt-0.5" />
            Featured Jobs
          </h2>
          <Link to="/jobs?isFeatured=true" className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            See all featured <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {jobsLoading ? (
          <PageSpinner />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredJobs?.items.map((job: Parameters<typeof JobCard>[0]['job']) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Browse All Jobs <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
