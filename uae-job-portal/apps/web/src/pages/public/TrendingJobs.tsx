import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Zap, Users, MapPin, ArrowUpRight, Briefcase, Star, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { JobCard } from '../../components/JobCard';
import { EMIRATES_LABELS, Emirates } from '@uaejobs/shared';

const HOT_SKILLS = [
  'React', 'Python', 'Node.js', 'AWS', 'Machine Learning', 'Salesforce', 'Power BI',
  'SAP', 'Oracle', 'Kubernetes', 'Golang', 'Swift', 'Flutter', 'AI/ML', 'DevOps',
];

const HOT_ROLES = [
  { title: 'Full Stack Developer', growth: '+34%', category: 'Technology' },
  { title: 'AI/ML Engineer', growth: '+67%', category: 'Technology' },
  { title: 'Digital Marketing Manager', growth: '+28%', category: 'Marketing' },
  { title: 'Data Analyst', growth: '+41%', category: 'Analytics' },
  { title: 'Cloud Architect', growth: '+52%', category: 'Technology' },
  { title: 'Cyber Security Analyst', growth: '+58%', category: 'Technology' },
  { title: 'UX Designer', growth: '+31%', category: 'Design' },
  { title: 'Business Analyst', growth: '+22%', category: 'Business' },
  { title: 'Product Manager', growth: '+29%', category: 'Management' },
  { title: 'HR Business Partner', growth: '+18%', category: 'HR' },
];

const MARKET_INSIGHTS = [
  { label: 'Remote Jobs', value: '+45%', desc: 'Increase in remote roles YoY', color: 'from-emerald-500 to-teal-500' },
  { label: 'Tech Salaries', value: 'AED 22k', desc: 'Avg mid-level tech salary/mo', color: 'from-brand-500 to-indigo-500' },
  { label: 'Visa Sponsored', value: '72%', desc: 'Of jobs offer visa support', color: 'from-violet-500 to-purple-500' },
  { label: 'Time to Hire', value: '18 days', desc: 'Average in UAE market', color: 'from-amber-500 to-orange-500' },
];

export function TrendingJobs() {
  const [activeEmirate, setActiveEmirate] = useState('');
  const [activeSkill, setActiveSkill] = useState('');

  const { data: recentJobs, isLoading } = useQuery({
    queryKey: ['trending-jobs', activeEmirate, activeSkill],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '9', sortBy: 'publishedAt' });
      if (activeEmirate) params.set('emirate', activeEmirate);
      if (activeSkill) params.set('q', activeSkill);
      return api.get(`/jobs?${params}`).then((r) => r.data.data);
    },
  });

  const { data: urgentJobs } = useQuery({
    queryKey: ['urgent-jobs'],
    queryFn: () => api.get('/jobs?limit=4&sortBy=publishedAt').then((r) => r.data.data),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-5">
              <TrendingUp size={14} className="text-brand-300" />
              <span className="text-brand-100">Live UAE Job Market Data</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">Trending in the UAE</h1>
            <p className="text-brand-200/80 text-lg">In-demand roles, hot skills, and market insights</p>
          </div>

          {/* Market Insights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MARKET_INSIGHTS.map((item) => (
              <div key={item.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                <div className={`text-2xl font-extrabold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-1`}>
                  {item.value}
                </div>
                <div className="text-sm font-semibold text-white mb-0.5">{item.label}</div>
                <div className="text-xs text-gray-400">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-14">
        {/* Fastest Growing Roles */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-brand-600" />
            <h2 className="text-2xl font-bold text-gray-900">Fastest Growing Roles</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {HOT_ROLES.map((role) => (
              <Link
                key={role.title}
                to={`/jobs?q=${encodeURIComponent(role.title)}`}
                className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-brand-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{role.category}</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{role.growth}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700 transition-colors leading-tight">
                  {role.title}
                </p>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 mt-2 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* Hot Skills */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Zap size={20} className="text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900">In-Demand Skills</h2>
            <span className="text-sm text-gray-400 ml-1">— click to filter jobs</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HOT_SKILLS.map((skill) => (
              <button
                key={skill}
                onClick={() => setActiveSkill(activeSkill === skill ? '' : skill)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-150 ${
                  activeSkill === skill
                    ? 'bg-brand-600 text-white border-brand-600 shadow-glow-brand'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:text-brand-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </section>

        {/* Emirate Filter + Jobs */}
        <section>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <MapPin size={20} className="text-brand-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Latest Jobs{activeEmirate ? ` in ${EMIRATES_LABELS[activeEmirate as Emirates]}` : ''}
                {activeSkill ? ` — ${activeSkill}` : ''}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveEmirate('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  !activeEmirate ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                }`}
              >
                All
              </button>
              {Object.entries(EMIRATES_LABELS).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setActiveEmirate(activeEmirate === v ? '' : v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeEmirate === v ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                  <div className="skeleton h-12 w-12 rounded-xl" />
                  <div className="skeleton h-4 rounded w-3/4" />
                  <div className="skeleton h-3 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentJobs?.items?.map((job: Parameters<typeof JobCard>[0]['job']) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
              <div className="text-center mt-8">
                <Link
                  to={`/jobs${activeEmirate ? `?emirate=${activeEmirate}` : ''}${activeSkill ? `${activeEmirate ? '&' : '?'}q=${activeSkill}` : ''}`}
                  className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
                >
                  View All Jobs <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Urgent hiring */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Zap size={20} className="text-red-500 fill-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Urgent Hiring</h2>
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Apply Today</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {urgentJobs?.items?.slice(0, 4).map((job: Parameters<typeof JobCard>[0]['job']) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>

        {/* For Employers CTA */}
        <section className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Hiring? Post Your Job</h3>
          <p className="text-brand-100 mb-6">Reach thousands of qualified candidates across the UAE</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register?role=EMPLOYER" className="bg-white text-brand-700 px-6 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors">
              Post a Job Free
            </Link>
            <Link to="/companies" className="border border-white/30 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Browse Companies
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
