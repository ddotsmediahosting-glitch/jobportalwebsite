import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, MapPin, Users, Briefcase, Search, Globe, ChevronRight } from 'lucide-react';
import { api } from '../../lib/api';
import { Pagination } from '../../components/Pagination';
import { PageSpinner } from '../../components/ui/Spinner';

const INDUSTRIES = [
  '', 'Technology', 'Finance & Banking', 'Healthcare', 'Construction & Real Estate',
  'Retail & E-commerce', 'Tourism & Hospitality', 'Education', 'Energy & Oil & Gas',
  'Logistics & Transportation', 'Media & Advertising', 'Manufacturing', 'Consulting',
];

const EMIRATE_LABELS: Record<string, string> = {
  ABU_DHABI: 'Abu Dhabi', DUBAI: 'Dubai', SHARJAH: 'Sharjah',
  AJMAN: 'Ajman', UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH: 'Ras Al Khaimah', FUJAIRAH: 'Fujairah',
};

interface Employer {
  id: string;
  companyName: string;
  slug: string;
  industry?: string;
  companySize?: string;
  description?: string;
  logoUrl?: string;
  emirate?: string;
  location?: string;
  website?: string;
  foundedYear?: number;
  _count: { jobs: number };
}

function CompanyCard({ employer }: { employer: Employer }) {
  return (
    <Link
      to={`/companies/${employer.slug}`}
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-brand-300 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
          {employer.logoUrl ? (
            <img src={employer.logoUrl} alt={employer.companyName} className="w-full h-full object-contain p-1" />
          ) : (
            <Building2 className="h-7 w-7 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
            {employer.companyName}
          </h3>
          {employer.industry && (
            <p className="text-xs text-brand-600 font-medium mt-0.5">{employer.industry}</p>
          )}
          {employer.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{employer.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            {employer.emirate && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {EMIRATE_LABELS[employer.emirate] || employer.emirate}
              </span>
            )}
            {employer.companySize && (
              <span className="flex items-center gap-1">
                <Users size={11} />
                {employer.companySize}
              </span>
            )}
            <span className="flex items-center gap-1 text-brand-600 font-medium">
              <Briefcase size={11} />
              {employer._count.jobs} open {employer._count.jobs === 1 ? 'job' : 'jobs'}
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1" />
      </div>
    </Link>
  );
}

export function Companies() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employers', page, search, industry],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (search) params.set('search', search);
      if (industry) params.set('industry', industry);
      return api.get(`/employers?${params}`).then((r) => r.data.data);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-indigo-800 text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-3">Top UAE Employers</h1>
          <p className="text-brand-200 text-lg max-w-2xl mx-auto mb-8">
            Discover verified companies hiring in the UAE. Explore company profiles, culture, and open positions.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search companies..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button type="submit" className="bg-white text-brand-700 font-semibold px-5 py-3 rounded-xl hover:bg-brand-50 transition-colors text-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm font-medium text-gray-600">Filter by industry:</span>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind}
                onClick={() => { setIndustry(ind); setPage(1); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  industry === ind
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-600'
                }`}
              >
                {ind || 'All Industries'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        {data && (
          <p className="text-sm text-gray-500 mb-5">
            Showing {data.items?.length || 0} of {data.total || 0} verified companies
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <PageSpinner />
        ) : data?.items?.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No companies found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {data?.items?.map((emp: Employer) => (
              <CompanyCard key={emp.id} employer={emp} />
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={data?.totalPages}
          total={data?.total}
          limit={12}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
