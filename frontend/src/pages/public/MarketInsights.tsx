import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Briefcase, Users, Zap, MapPin, BarChart2,
  Search, ArrowRight, RefreshCw, AlertCircle, Clock,
  ChevronRight, Target, Star, Flame, Activity,
  DollarSign, Award, CheckCircle, Loader2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SEOHead } from '../../components/SEOHead';

// ── Types ──────────────────────────────────────────────────────────────────────

interface MarketPulse {
  totalActiveJobs: number;
  newJobsThisWeek: number;
  totalSeekers: number;
  totalApplicationsThisWeek: number;
  avgSalaryAED: number;
  urgentJobsCount: number;
  emiratizationJobsCount: number;
  topHiringIndustries: Array<{ industry: string; count: number }>;
  topHiringEmirates: Array<{ emirate: string; count: number }>;
  topSkillsInDemand: Array<{ skill: string; count: number }>;
  topJobTitles: Array<{ title: string; count: number }>;
  salaryByEmirate: Array<{ emirate: string; avgMin: number; avgMax: number; count: number }>;
  applicationCompetition: number;
  narrative: {
    headline: string;
    marketMood: 'hot' | 'active' | 'steady' | 'slow';
    summary: string;
    topOpportunities: Array<{ title: string; insight: string }>;
    seekerAdvice: string;
    employerAdvice: string;
    weeklyOutlook: string;
  } | null;
  generatedAt: string;
}

interface TopRole {
  title: string;
  count: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  topEmirate: string;
}

interface RoleReport {
  role: string;
  jobCount: number;
  applicationCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  topSkills: string[];
  topEmirates: string[];
  topIndustries: string[];
  recentJobs: number;
  intelligence: {
    demandLevel: 'very high' | 'high' | 'medium' | 'low';
    demandTrend: 'rising' | 'stable' | 'declining';
    salaryRange: { min: number; max: number; median: number; currency: string };
    competitionScore: number;
    topSkillsRequired: string[];
    topEmiratesHiring: string[];
    careerPath: string[];
    tipsToStandOut: string[];
    marketSummary: string;
  } | null;
  sampleJobs: Array<{
    id: string; title: string; companyName: string;
    emirate: string; salaryMin: number | null; salaryMax: number | null; slug: string;
  }>;
  generatedAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MOOD_CONFIG = {
  hot:    { label: 'Market is HOT', color: 'text-red-600 bg-red-50 border-red-200', dot: 'bg-red-500', icon: Flame },
  active: { label: 'Market is ACTIVE', color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-500', icon: TrendingUp },
  steady: { label: 'Market is STEADY', color: 'text-blue-600 bg-blue-50 border-blue-200', dot: 'bg-blue-500', icon: Activity },
  slow:   { label: 'Market is SLOW', color: 'text-gray-600 bg-gray-50 border-gray-200', dot: 'bg-gray-400', icon: BarChart2 },
};

const DEMAND_COLOR = {
  'very high': 'text-red-600 bg-red-50',
  'high': 'text-orange-600 bg-orange-50',
  'medium': 'text-blue-600 bg-blue-50',
  'low': 'text-gray-600 bg-gray-50',
};

const TREND_CONFIG = {
  rising:   { label: '↑ Rising', color: 'text-green-600' },
  stable:   { label: '→ Stable', color: 'text-blue-600' },
  declining: { label: '↓ Declining', color: 'text-red-500' },
};

function formatAED(n: number) {
  if (!n) return '—';
  return `AED ${n.toLocaleString()}`;
}

function StatCard({ icon: Icon, label, value, sub, color = 'brand' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`h-10 w-10 rounded-xl ${colors[color] ?? colors.brand} flex items-center justify-center mb-3`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-extrabold text-gray-900 mb-0.5">{value}</div>
      <div className="text-sm text-gray-600 font-medium">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, color = 'bg-brand-500' }: {
  label: string; value: number; max: number; color?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-36 truncate flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

// ── Role Search Panel ──────────────────────────────────────────────────────────

function RoleSearchPanel() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading, error } = useQuery<RoleReport>({
    queryKey: ['market-role', query],
    queryFn: () => api.get(`/market/role?title=${encodeURIComponent(query)}`).then((r) => r.data.data),
    enabled: query.length >= 2,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length >= 2) setQuery(input.trim());
  };

  const intel = data?.intelligence;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <Search size={18} className="text-violet-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Role Intelligence</h3>
          <p className="text-xs text-gray-500">AI deep-dive on any job title in the UAE market</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Social Media Manager, UX Designer, Content Creator…"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={input.trim().length < 2}
          className="inline-flex items-center gap-1.5 bg-violet-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Analyse
        </button>
      </form>

      {isLoading && (
        <div className="flex items-center gap-3 py-8 justify-center text-gray-500 text-sm">
          <Loader2 size={18} className="animate-spin text-violet-500" />
          Generating AI intelligence report…
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-4">
          <AlertCircle size={15} /> No data found for this role. Try a different title.
        </div>
      )}

      {data && !isLoading && (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-lg font-bold text-gray-900">{data.role}</h4>
            {intel && (
              <>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${DEMAND_COLOR[intel.demandLevel]}`}>
                  {intel.demandLevel.toUpperCase()} DEMAND
                </span>
                <span className={`text-xs font-semibold ${TREND_CONFIG[intel.demandTrend].color}`}>
                  {TREND_CONFIG[intel.demandTrend].label}
                </span>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Active Jobs', value: data.jobCount, color: 'bg-brand-50 text-brand-600' },
              { label: 'Total Applications', value: data.applicationCount, color: 'bg-orange-50 text-orange-600' },
              { label: 'Posted (30 days)', value: data.recentJobs, color: 'bg-green-50 text-green-600' },
              { label: 'Competition', value: intel ? `${intel.competitionScore}/100` : '—', color: intel && intel.competitionScore > 70 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`rounded-xl p-3 ${color} text-center`}>
                <div className="text-lg font-extrabold">{value}</div>
                <div className="text-xs font-medium opacity-80">{label}</div>
              </div>
            ))}
          </div>

          {/* Salary */}
          {intel && intel.salaryRange.median > 0 && (
            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-green-800">Salary Range (UAE)</span>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <div className="text-xs text-green-600 mb-0.5">Min</div>
                  <div className="font-bold text-green-800">{formatAED(intel.salaryRange.min)}</div>
                </div>
                <div className="text-green-400 mb-0.5">—</div>
                <div>
                  <div className="text-xs text-green-600 mb-0.5">Median</div>
                  <div className="text-xl font-extrabold text-green-700">{formatAED(intel.salaryRange.median)}</div>
                </div>
                <div className="text-green-400 mb-0.5">—</div>
                <div>
                  <div className="text-xs text-green-600 mb-0.5">Max</div>
                  <div className="font-bold text-green-800">{formatAED(intel.salaryRange.max)}</div>
                </div>
                <div className="text-xs text-green-500 ml-1 mb-0.5">/month</div>
              </div>
            </div>
          )}

          {intel && (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Top skills */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Top Skills Required</h5>
                <div className="flex flex-wrap gap-1.5">
                  {intel.topSkillsRequired.map((s) => (
                    <span key={s} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              {/* Career path */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Career Progression</h5>
                <div className="space-y-1">
                  {intel.careerPath.map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="h-4 w-4 rounded-full bg-brand-100 text-brand-600 font-bold flex items-center justify-center flex-shrink-0" style={{ fontSize: 9 }}>{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tips */}
          {intel && intel.tipsToStandOut.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <h5 className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                <Star size={12} /> Tips to Stand Out
              </h5>
              <ul className="space-y-1.5">
                {intel.tipsToStandOut.map((t, i) => (
                  <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                    <CheckCircle size={11} className="text-amber-500 flex-shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* AI Summary */}
          {intel && (
            <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
              <p className="text-sm text-violet-800 leading-relaxed">{intel.marketSummary}</p>
            </div>
          )}

          {/* Sample live jobs */}
          {data.sampleJobs.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Live Openings</h5>
              <div className="space-y-2">
                {data.sampleJobs.map((j) => (
                  <Link
                    key={j.id}
                    to={`/job/${j.slug}`}
                    className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-brand-200 hover:bg-brand-50 transition-all group"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{j.title}</div>
                      <div className="text-xs text-gray-500">{j.companyName} · {j.emirate}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {j.salaryMin && j.salaryMin > 0 && (
                        <span className="text-xs text-green-600 font-medium">{formatAED(j.salaryMin)}</span>
                      )}
                      <ChevronRight size={14} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
              <Link to={`/jobs?search=${encodeURIComponent(data.role)}`} className="inline-flex items-center gap-1 mt-2 text-xs text-brand-600 hover:underline font-medium">
                View all {data.jobCount} {data.role} jobs <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function MarketInsights() {
  const { data: pulse, isLoading: pulseLoading } = useQuery<MarketPulse>({
    queryKey: ['market-pulse'],
    queryFn: () => api.get('/market/pulse').then((r) => r.data.data),
    staleTime: 60 * 60 * 1000,
  });

  const { data: topRoles, isLoading: rolesLoading } = useQuery<TopRole[]>({
    queryKey: ['market-top-roles'],
    queryFn: () => api.get('/market/top-roles').then((r) => r.data.data),
    staleTime: 60 * 60 * 1000,
  });

  const narrative = pulse?.narrative;
  const mood = narrative?.marketMood ?? 'steady';
  const MoodIcon = MOOD_CONFIG[mood].icon;
  const maxIndustry = pulse?.topHiringIndustries[0]?.count ?? 1;
  const maxSkill = pulse?.topSkillsInDemand[0]?.count ?? 1;
  const maxEmirate = pulse?.topHiringEmirates[0]?.count ?? 1;

  return (
    <>
      <SEOHead
        title="UAE Job Market Intelligence | DdotsmediaJobs"
        description="Live UAE job market data — hiring trends, in-demand skills, salary benchmarks by emirate, and AI-powered role intelligence for media, creative, and marketing professionals."
        canonical="https://ddotsmediajobs.com/market-insights"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 text-white py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Activity size={13} /> Live Market Intelligence
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            UAE Job Market{' '}
            <span className="text-yellow-400">Intelligence Engine</span>
          </h1>
          <p className="text-lg text-brand-100/80 max-w-2xl mx-auto mb-6">
            Real-time data from thousands of UAE job listings — powered by AI to give you the edge whether you're hiring or job hunting.
          </p>
          {narrative && (
            <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-semibold ${MOOD_CONFIG[mood].color}`}>
              <span className={`h-2 w-2 rounded-full animate-pulse ${MOOD_CONFIG[mood].dot}`} />
              <MoodIcon size={14} />
              {MOOD_CONFIG[mood].label}
            </div>
          )}
          {pulse && (
            <p className="mt-2 text-xs text-brand-300/60 flex items-center justify-center gap-1">
              <Clock size={10} /> Updated {new Date(pulse.generatedAt).toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })} GST
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* AI Narrative Banner */}
        {narrative && (
          <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Zap size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-200 mb-1">AI Market Briefing</p>
                <h2 className="text-xl font-extrabold mb-2">{narrative.headline}</h2>
                <p className="text-brand-100/90 text-sm leading-relaxed mb-4">{narrative.summary}</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 bg-white/10 rounded-xl p-3">
                    <p className="text-xs font-semibold text-brand-200 mb-1">For Job Seekers</p>
                    <p className="text-xs text-white/90 leading-relaxed">{narrative.seekerAdvice}</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-xl p-3">
                    <p className="text-xs font-semibold text-brand-200 mb-1">For Employers</p>
                    <p className="text-xs text-white/90 leading-relaxed">{narrative.employerAdvice}</p>
                  </div>
                </div>
                {narrative.weeklyOutlook && (
                  <p className="mt-3 text-xs text-brand-100/70 flex items-start gap-1.5">
                    <TrendingUp size={12} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Outlook:</strong> {narrative.weeklyOutlook}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats grid */}
        {pulseLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm animate-pulse">
                <div className="h-10 w-10 bg-gray-100 rounded-xl mb-3" />
                <div className="h-6 bg-gray-100 rounded w-16 mb-1" />
                <div className="h-4 bg-gray-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : pulse && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Briefcase} label="Active Job Listings" value={pulse.totalActiveJobs.toLocaleString()} color="brand" />
            <StatCard icon={Zap} label="New Jobs This Week" value={`+${pulse.newJobsThisWeek}`} sub="fresh openings" color="green" />
            <StatCard icon={Users} label="Registered Job Seekers" value={pulse.totalSeekers.toLocaleString()} color="violet" />
            <StatCard icon={Activity} label="Applications This Week" value={pulse.totalApplicationsThisWeek.toLocaleString()} color="orange" />
            <StatCard icon={DollarSign} label="Avg Salary Offered" value={formatAED(pulse.avgSalaryAED)} sub="per month" color="green" />
            <StatCard icon={Flame} label="Urgent Roles Open" value={pulse.urgentJobsCount} sub="hire immediately" color="rose" />
            <StatCard icon={Award} label="Emiratization Roles" value={pulse.emiratizationJobsCount} sub="UAE nationals" color="blue" />
            <StatCard icon={Target} label="Avg Competition" value={`${pulse.applicationCompetition}x`} sub="applicants per role" color="orange" />
          </div>
        )}

        {/* Top Opportunities */}
        {narrative?.topOpportunities && narrative.topOpportunities.length > 0 && (
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <Star size={18} className="text-yellow-500" /> Top Opportunities Right Now
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {narrative.topOpportunities.map((opp, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center mb-3">
                    <span className="text-yellow-600 font-extrabold text-sm">{i + 1}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-sm">{opp.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{opp.insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts: Industries + Skills + Emirates */}
        {pulse && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Industries */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <BarChart2 size={15} className="text-brand-500" /> Top Hiring Industries
              </h3>
              <div className="space-y-3">
                {pulse.topHiringIndustries.slice(0, 8).map((ind) => (
                  <BarRow key={ind.industry} label={ind.industry} value={ind.count} max={maxIndustry} color="bg-brand-500" />
                ))}
              </div>
            </div>

            {/* Top Skills */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <Zap size={15} className="text-violet-500" /> In-Demand Skills
              </h3>
              <div className="space-y-3">
                {pulse.topSkillsInDemand.slice(0, 10).map((s, i) => (
                  <BarRow key={s.skill} label={s.skill} value={s.count} max={maxSkill}
                    color={i < 3 ? 'bg-violet-500' : i < 6 ? 'bg-violet-400' : 'bg-violet-300'} />
                ))}
              </div>
            </div>

            {/* Emirates */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <MapPin size={15} className="text-emerald-500" /> Jobs by Emirate
              </h3>
              <div className="space-y-3 mb-4">
                {pulse.topHiringEmirates.map((e) => (
                  <BarRow key={e.emirate} label={e.emirate} value={e.count} max={maxEmirate} color="bg-emerald-500" />
                ))}
              </div>
              {/* Salary by Emirate */}
              {pulse.salaryByEmirate.length > 0 && (
                <>
                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Avg Salary by Emirate</h4>
                    <div className="space-y-2">
                      {pulse.salaryByEmirate.map((e) => (
                        <div key={e.emirate} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">{e.emirate}</span>
                          <span className="text-xs font-semibold text-gray-800">
                            {formatAED(e.avgMin)} – {formatAED(e.avgMax)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Top Roles Table */}
        {!rolesLoading && topRoles && topRoles.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-500" /> Most In-Demand Roles
              </h2>
              <span className="text-xs text-gray-400">{topRoles.length} roles tracked</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Open Jobs</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Salary Range</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Top Emirate</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {topRoles.slice(0, 20).map((role, i) => (
                    <tr key={role.title} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">{String(i + 1).padStart(2, '0')}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">{role.title}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 text-brand-600 font-semibold text-xs bg-brand-50 px-2 py-0.5 rounded-full">
                          <Briefcase size={10} /> {role.count}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">
                        {role.avgSalaryMin > 0
                          ? `${formatAED(role.avgSalaryMin)} – ${formatAED(role.avgSalaryMax)}`
                          : <span className="text-gray-300">Not disclosed</span>}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs flex items-center gap-1">
                        <MapPin size={10} /> {role.topEmirate || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link to={`/jobs?search=${encodeURIComponent(role.title)}`}
                          className="text-xs text-brand-600 hover:underline font-medium inline-flex items-center gap-1">
                          Browse <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role Intelligence Search */}
        <RoleSearchPanel />

        {/* Refresh note */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-4">
          <RefreshCw size={11} /> Market data refreshes every hour from live job listings
        </div>
      </div>
    </>
  );
}
