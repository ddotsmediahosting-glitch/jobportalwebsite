import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, TrendingUp, Users, Briefcase, ArrowRight, Star,
  Zap, Bot, DollarSign, Mic, ChevronRight, CheckCircle,
  Code2, HeartPulse, Building, BarChart3, ShoppingBag, Plane,
} from 'lucide-react';
import { api } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { EMIRATES_LABELS } from '@uaejobs/shared';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Technology': <Code2 size={18} />,
  'Healthcare': <HeartPulse size={18} />,
  'Construction': <Building size={18} />,
  'Finance': <BarChart3 size={18} />,
  'Retail': <ShoppingBag size={18} />,
  'Tourism': <Plane size={18} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Technology': 'from-blue-500 to-indigo-600',
  'Healthcare': 'from-rose-500 to-pink-600',
  'Construction': 'from-amber-500 to-orange-600',
  'Finance': 'from-emerald-500 to-teal-600',
  'Retail': 'from-violet-500 to-purple-600',
  'Tourism': 'from-cyan-500 to-sky-600',
};

function getCategoryColor(name: string): string {
  const key = Object.keys(CATEGORY_COLORS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return key ? CATEGORY_COLORS[key] : 'from-brand-500 to-brand-700';
}

function getCategoryIcon(name: string): React.ReactNode {
  const key = Object.keys(CATEGORY_ICONS).find((k) => name.toLowerCase().includes(k.toLowerCase()));
  return key ? CATEGORY_ICONS[key] : <Briefcase size={18} />;
}

function EmiratizationSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['jobs', 'emiratization'],
    queryFn: () => api.get('/jobs?isEmiratization=true&limit=6').then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

  if (!isLoading && !data?.items?.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 mt-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🇦🇪</span>
            <h2 className="text-xl font-bold text-gray-900">Emiratization Opportunities</h2>
          </div>
          <p className="text-sm text-gray-500">Roles open to UAE nationals under Emiratization programs</p>
        </div>
        <Link
          to="/jobs?isEmiratization=true"
          className="hidden sm:flex items-center gap-1.5 text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
              <div className="flex gap-3">
                <div className="skeleton h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 rounded w-3/4" />
                  <div className="skeleton h-3 rounded w-1/2" />
                </div>
              </div>
              <div className="skeleton h-3 rounded w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.items?.map((job: Parameters<typeof JobCard>[0]['job']) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <div className="text-center mt-6 sm:hidden">
        <Link to="/jobs?isEmiratization=true" className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors flex items-center gap-1 justify-center">
          View all Emiratization jobs <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}

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

  const popularSearches = ['Software Engineer', 'Nurse Dubai', 'Finance Manager', 'DevOps', 'Sales Executive', 'UI/UX Designer'];

  return (
    <div className="overflow-hidden">
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-300/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-brand-100 px-4 py-1.5 rounded-full text-sm font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              10,000+ active jobs across the UAE
            </span>
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-[1.1] tracking-tight text-balance">
              Find Your Dream Job<br />
              in the{' '}
              <span className="relative inline-block">
                <span className="text-gold-400">UAE</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 120 8" fill="none">
                  <path d="M2 6 Q60 1 118 6" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-brand-100/90 mb-10 max-w-xl mx-auto leading-relaxed">
              Thousands of opportunities across Abu Dhabi, Dubai, Sharjah and all seven Emirates
            </p>

            {/* Search box */}
            <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2.5 flex flex-col sm:flex-row gap-2 shadow-2xl ring-1 ring-white/20 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-3 px-4 py-1">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Job title, skills or company..."
                  className="w-full text-gray-900 text-sm focus:outline-none placeholder-gray-400 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-2 px-4 sm:border-l border-gray-100">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <select
                  value={searchEmirate}
                  onChange={(e) => setSearchEmirate(e.target.value)}
                  className="text-sm text-gray-600 focus:outline-none bg-transparent cursor-pointer py-1"
                >
                  <option value="">All Emirates</option>
                  {Object.entries(EMIRATES_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-brand-600 to-brand-500 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-brand-700 hover:to-brand-600 transition-all duration-150 flex-shrink-0 shadow-sm flex items-center gap-2"
              >
                <Search size={14} /> Search
              </button>
            </form>

            {/* Popular searches */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <span className="text-xs text-brand-200/70 self-center">Popular:</span>
              {popularSearches.map((term) => (
                <Link
                  key={term}
                  to={`/jobs?q=${encodeURIComponent(term)}`}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-brand-100 hover:text-white text-xs px-3 py-1.5 rounded-full transition-all duration-150"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Briefcase, stat: '10,000+', label: 'Active Jobs', color: 'text-brand-300' },
              { icon: Users, stat: '50,000+', label: 'Job Seekers', color: 'text-gold-300' },
              { icon: TrendingUp, stat: '2,000+', label: 'Companies', color: 'text-green-300' },
            ].map(({ icon: Icon, stat, label, color }) => (
              <div key={label} className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <Icon className={`h-4 w-4 ${color} hidden sm:block`} />
                <div>
                  <div className={`text-xl sm:text-2xl font-extrabold text-white`}>{stat}</div>
                  <div className="text-xs text-brand-200/70">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Tools Promo ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: Zap, label: 'ATS CV Analyzer', desc: 'Score your CV instantly', to: '/cv-analyzer', color: 'from-blue-500 to-indigo-500' },
              { icon: Bot, label: 'Career Advisor AI', desc: 'Get personalized career guidance', to: '/career-advisor', color: 'from-violet-500 to-purple-500' },
              { icon: DollarSign, label: 'Salary Insights', desc: 'Know your market worth', to: '/salary-insights', color: 'from-emerald-500 to-teal-500' },
              { icon: Mic, label: 'Interview Prep', desc: 'Practice with AI coaching', to: '/interview-prep', color: 'from-pink-500 to-rose-500' },
            ].map(({ icon: Icon, label, desc, to, color }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-200"
              >
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-purple-300 truncate">{desc}</p>
                </div>
                <ChevronRight size={14} className="text-white/30 group-hover:text-white/60 ml-auto flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Browse by Category ──────────────────────────────────────────── */}
      {featuredCategories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
              <p className="text-sm text-gray-500 mt-1">Explore opportunities across every sector</p>
            </div>
            <Link to="/jobs" className="hidden sm:flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium group">
              View all jobs
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featuredCategories.map((cat: { id: string; slug: string; name: string; _count?: { jobs: number }; children?: { id: string; name: string; slug: string }[] }) => {
              const gradient = getCategoryColor(cat.name);
              const icon = getCategoryIcon(cat.name);
              return (
                <Link
                  key={cat.id}
                  to={`/jobs?categoryId=${cat.id}`}
                  className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
                >
                  {/* Gradient bg on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
                  </div>

                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                    {icon}
                  </div>
                  <div className="font-semibold text-gray-900 group-hover:text-brand-700 text-sm mb-1 transition-colors">
                    {cat.name}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">{cat._count?.jobs || 0} open positions</div>
                  {cat.children && cat.children.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cat.children.slice(0, 2).map((child) => (
                        <span key={child.id} className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-md truncate">{child.name}</span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link to="/jobs" className="text-sm text-brand-600 font-medium">
              View all categories →
            </Link>
          </div>
        </section>
      )}

      {/* ─── Featured Jobs ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-gold-400 fill-gold-400" />
              Featured Jobs
            </h2>
            <p className="text-sm text-gray-500 mt-1">Hand-picked opportunities from top employers</p>
          </div>
          <Link to="/jobs?isFeatured=true" className="hidden sm:flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium group">
            See all featured
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex gap-3">
                  <div className="skeleton h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 rounded w-3/4" />
                    <div className="skeleton h-3 rounded w-1/2" />
                  </div>
                </div>
                <div className="skeleton h-3 rounded w-full" />
                <div className="skeleton h-3 rounded w-2/3" />
              </div>
            ))}
          </div>
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
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:from-brand-700 hover:to-brand-600 transition-all duration-150 shadow-sm hover:shadow-glow-brand"
          >
            Browse All Jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Emiratization Jobs ─────────────────────────────────────────── */}
      <EmiratizationSection />

      {/* ─── How it works ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 py-20 px-4 mt-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Land Your Next Job in 3 Steps</h2>
            <p className="text-brand-200/70 text-sm max-w-md mx-auto">Simple, fast, and designed for the UAE job market</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Search & Discover',
                desc: 'Browse thousands of roles across every emirate and industry. Filter by salary, work mode, and more.',
                color: 'from-brand-400 to-brand-600',
              },
              {
                step: '02',
                icon: Zap,
                title: 'Optimize Your CV',
                desc: 'Use our AI-powered ATS analyzer to score and improve your CV before applying.',
                color: 'from-violet-400 to-purple-600',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Apply & Succeed',
                desc: 'Apply in one click, track your applications, and prepare for interviews with AI coaching.',
                color: 'from-emerald-400 to-teal-600',
              },
            ].map(({ step, icon: Icon, title, desc, color }) => (
              <div key={step} className="relative text-center">
                {/* Connector line */}
                <div className="hidden sm:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-white/20 to-transparent last:hidden" />

                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="text-xs font-bold text-brand-400/60 mb-1 tracking-widest">{step}</div>
                <h3 className="text-white font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
            >
              Get Started for Free <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
