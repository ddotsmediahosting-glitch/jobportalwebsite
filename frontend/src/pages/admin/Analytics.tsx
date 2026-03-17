import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Users, Briefcase, FileText, MapPin } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/ui/EmptyState';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-AE', { month: 'short', day: 'numeric' });
}

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400">N/A</span>;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {Math.abs(pct)}%
    </span>
  );
}

// ── SVG Line Chart ────────────────────────────────────────────────────────────
function LineChart({ data, label, color }: { data: { day: string; count: number }[]; label: string; color: string }) {
  if (!data || data.length === 0) return (
    <EmptyState illustration="generic" title="No data available" className="py-8" />
  );

  const w = 600;
  const h = 160;
  const padL = 36;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const minVal = 0;

  const px = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const py = (v: number) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

  const pts = data.map((d, i) => `${px(i)},${py(d.count)}`).join(' ');
  const area = `${padL},${padT + chartH} ` + data.map((d, i) => `${px(i)},${py(d.count)}`).join(' ') + ` ${px(data.length - 1)},${padT + chartH}`;

  // Y-axis labels
  const yTicks = [0, Math.ceil(maxVal / 2), maxVal];

  // X-axis: show ~5 labels
  const xStep = Math.ceil(data.length / 5);
  const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      {/* Grid lines */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line x1={padL} y1={py(tick)} x2={padL + chartW} y2={py(tick)} stroke="#f3f4f6" strokeWidth="1" />
          <text x={padL - 4} y={py(tick) + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{tick}</text>
        </g>
      ))}

      {/* Area fill */}
      <defs>
        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${label})`} />

      {/* Line */}
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />

      {/* Dots */}
      {data.map((d, i) => (
        <circle key={i} cx={px(i)} cy={py(d.count)} r="3" fill={color} stroke="white" strokeWidth="1.5">
          <title>{fmtDay(d.day)}: {d.count}</title>
        </circle>
      ))}

      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const idx = data.indexOf(d);
        return (
          <text key={i} x={px(idx)} y={h - 4} textAnchor="middle" fontSize="9" fill="#9ca3af">{fmtDay(d.day)}</text>
        );
      })}
    </svg>
  );
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  if (!data || data.length === 0) return (
    <EmptyState illustration="generic" title="No data available" className="py-8" />
  );

  const w = 600;
  const h = 160;
  const padL = 80;
  const padR = 12;
  const padT = 8;
  const padB = 8;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const barH = chartH / data.length;
  const gap = barH * 0.25;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      {data.map((d, i) => {
        const barW = (d.count / maxVal) * chartW;
        const y = padT + i * barH + gap / 2;
        const bh = barH - gap;
        return (
          <g key={i}>
            <text x={padL - 6} y={y + bh / 2 + 4} textAnchor="end" fontSize="10" fill="#6b7280">
              {d.label.length > 12 ? d.label.slice(0, 12) + '…' : d.label}
            </text>
            <rect x={padL} y={y} width={Math.max(barW, 2)} height={bh} rx="3" fill={color} opacity="0.8" />
            <text x={padL + barW + 4} y={y + bh / 2 + 4} fontSize="10" fill="#374151" fontWeight="600">
              {d.count}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <EmptyState illustration="generic" title="No data available" className="py-8" />;

  const cx = 60;
  const cy = 60;
  const r = 50;
  const inner = 30;
  let angle = -Math.PI / 2;

  const slices = data.map((d) => {
    const sweep = (d.count / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const xi1 = cx + inner * Math.cos(angle);
    const yi1 = cy + inner * Math.sin(angle);
    const xi2 = cx + inner * Math.cos(angle - sweep);
    const yi2 = cy + inner * Math.sin(angle - sweep);
    const large = sweep > Math.PI ? 1 : 0;
    return { ...d, path: `M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${xi1},${yi1} A${inner},${inner} 0 ${large} 0 ${xi2},${yi2} Z` };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="w-32 h-32 flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="1">
            <title>{s.label}: {s.count}</title>
          </path>
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#6b7280">total</text>
      </svg>
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-600">{s.label}</span>
            <span className="font-semibold text-gray-900 ml-auto pl-4">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend card ────────────────────────────────────────────────────────────────
function TrendCard({ label, current, previous, pct, icon, color }: {
  label: string; current: number; previous: number; pct: number | null; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{current.toLocaleString()}</p>
      <div className="flex items-center gap-2 mt-1">
        <Trend pct={pct} />
        <span className="text-xs text-gray-400">vs prev period ({previous.toLocaleString()})</span>
      </div>
    </div>
  );
}

// ── Analytics skeleton ────────────────────────────────────────────────────────
function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Trend cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton h-4 rounded w-24" />
            </div>
            <div className="skeleton h-8 rounded w-20 mb-2" />
            <div className="skeleton h-3 rounded w-32" />
          </div>
        ))}
      </div>
      {/* Chart placeholders */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="skeleton h-4 rounded w-48 mb-4" />
        <div className="skeleton h-40 rounded-lg w-full" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="skeleton h-4 rounded w-32 mb-4" />
            <div className="skeleton h-40 rounded-lg w-full" />
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="skeleton h-4 rounded w-40 mb-4" />
            <div className="skeleton h-36 rounded-lg w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

const JOB_STATUS_COLORS: Record<string, string> = {
  PUBLISHED: '#16a34a',
  PENDING_APPROVAL: '#d97706',
  DRAFT: '#6b7280',
  REJECTED: '#dc2626',
  EXPIRED: '#9ca3af',
  CLOSED: '#374151',
};

export function AdminAnalytics() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics', days],
    queryFn: () => api.get(`/admin/analytics?days=${days}`).then((r) => r.data.data),
  });

  const statusData = (data?.jobStatusDistribution ?? []).map((d: any) => ({
    label: d.status.replace(/_/g, ' '),
    count: d.count,
    color: JOB_STATUS_COLORS[d.status] ?? '#6b7280',
  }));

  const emirateData = (data?.applicationsByEmirate ?? []).map((d: any) => ({
    label: d.location || 'Unknown',
    count: d.count,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform growth and activity trends</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                days === d ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading && <AnalyticsSkeleton />}

      {!isLoading && data && (
        <>
          {/* Trend summary cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <TrendCard
              label="New Users"
              current={data.trends.users.current}
              previous={data.trends.users.previous}
              pct={data.trends.users.pct}
              icon={<Users className="h-5 w-5 text-blue-600" />}
              color="bg-blue-50"
            />
            <TrendCard
              label="New Jobs"
              current={data.trends.jobs.current}
              previous={data.trends.jobs.previous}
              pct={data.trends.jobs.pct}
              icon={<Briefcase className="h-5 w-5 text-brand-600" />}
              color="bg-brand-50"
            />
            <TrendCard
              label="New Applications"
              current={data.trends.applications.current}
              previous={data.trends.applications.previous}
              pct={data.trends.applications.pct}
              icon={<FileText className="h-5 w-5 text-green-600" />}
              color="bg-green-50"
            />
          </div>

          {/* Line charts */}
          <div className="grid gap-6">
            {/* User growth */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">User Registrations (last {days} days)</h2>
              <LineChart data={data.dailyUsers} label="users" color="#3b82f6" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Job postings */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Job Postings</h2>
                <LineChart data={data.dailyJobs} label="jobs" color="#0891b2" />
              </div>

              {/* Applications */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Applications Submitted</h2>
                <LineChart data={data.dailyApplications} label="apps" color="#16a34a" />
              </div>
            </div>
          </div>

          {/* Distribution charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Job status donut */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Job Status Distribution</h2>
              <DonutChart data={statusData} />
            </div>

            {/* Applications by emirate */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" /> Applications by Location
              </h2>
              <BarChart data={emirateData} color="#7c3aed" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
