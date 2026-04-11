import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, TrendingUp, Globe, BarChart2, ExternalLink, Linkedin, Twitter, Facebook, MessageCircle, Link2 } from 'lucide-react';
import { api } from '../../lib/api';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  copy: <Link2 className="h-4 w-4" />,
  email: <Globe className="h-4 w-4" />,
};
const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0a66c2',
  twitter: '#000000',
  facebook: '#1877f2',
  whatsapp: '#25d366',
  copy: '#6b7280',
  email: '#7c3aed',
};
const BAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

function LineChart({ data, color = '#3b82f6' }: { data: { date: string; count: number }[]; color?: string }) {
  if (!data?.length) return null;
  const vals = data.map((d) => d.count);
  const max = Math.max(...vals, 1);
  const W = 500;
  const H = 100;
  const pad = 8;

  const pts = vals
    .map((v, i) => `${pad + (i / (vals.length - 1)) * (W - pad * 2)},${H - pad - (v / max) * (H - pad * 2)}`)
    .join(' ');

  const area = `M ${pad},${H - pad} ` +
    vals.map((v, i) => `L ${pad + (i / (vals.length - 1)) * (W - pad * 2)},${H - pad - (v / max) * (H - pad * 2)}`).join(' ') +
    ` L ${W - pad},${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineGrad)" />
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={pts} />
      {vals.map((v, i) => (
        <circle key={i} cx={pad + (i / (vals.length - 1)) * (W - pad * 2)} cy={H - pad - (v / max) * (H - pad * 2)} r="2.5" fill={color} />
      ))}
    </svg>
  );
}

function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-center text-gray-400 text-sm py-8">No data yet</p>;
  let cum = 0;
  const r = 50;
  const cx = 70;
  const cy = 70;

  function pol(pct: number) {
    const a = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  const slices = data.map((d) => {
    const pct = (d.count / total) * 100;
    const s = cum;
    cum += pct;
    return { ...d, pct, start: s };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={140} height={140} viewBox="0 0 140 140" className="flex-shrink-0">
        {slices.map((s, i) => {
          const start = pol(s.start);
          const end = pol(s.start + s.pct);
          const large = s.pct > 50 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
          return <path key={i} d={path} fill={s.color} />;
        })}
        <circle cx={cx} cy={cy} r={28} fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#111">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#888">total shares</text>
      </svg>
      <div className="space-y-2 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 text-sm">
            <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 capitalize flex-1">{s.label}</span>
            <span className="font-semibold text-gray-900">{s.count}</span>
            <span className="text-gray-400 text-xs w-10 text-right">{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HBar({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-28 truncate flex-shrink-0">{d.label || 'direct'}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{ width: `${(d.count / max) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-900 w-8 text-right">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminMarketing() {
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-marketing', days],
    queryFn: () => api.get(`/admin/marketing?days=${days}`).then((r) => r.data.data),
    refetchInterval: 60000,
  });

  const byPlatform: { platform: string; count: number }[] = data?.byPlatform || [];
  const donutData = byPlatform.map((p, i) => ({
    label: p.platform,
    count: p.count,
    color: PLATFORM_COLORS[p.platform] || BAR_COLORS[i % BAR_COLORS.length],
  }));

  const total = data?.total ?? 0;
  const topJobs: { job: { title: string; slug: string; employer?: { companyName: string } }; count: number }[] = data?.topJobs || [];
  const daily: { date: string; count: number }[] = data?.daily || [];
  const byCampaign: { campaign: string; count: number }[] = data?.byCampaign || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-600" /> Social Marketing & SEO
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track social shares, UTM campaigns and SEO metrics across the platform</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                days === d ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: `Total Shares (${days}d)`, value: total, icon: Share2, color: 'from-brand-500 to-brand-700' },
          { label: 'Platforms', value: byPlatform.length, icon: Globe, color: 'from-indigo-500 to-indigo-700' },
          { label: 'Jobs Shared', value: topJobs.length, icon: TrendingUp, color: 'from-emerald-500 to-emerald-700' },
          { label: 'Campaigns', value: byCampaign.length, icon: BarChart2, color: 'from-violet-500 to-violet-700' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            {isLoading ? (
              <div className="h-8 w-12 bg-gray-100 animate-pulse rounded mb-1" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            )}
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Share trend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand-600" /> Daily Share Trend
          </h3>
          {isLoading ? (
            <div className="h-20 bg-gray-50 animate-pulse rounded-lg" />
          ) : daily.length > 1 ? (
            <>
              <LineChart data={daily} color="#3b82f6" />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>{daily[0]?.date}</span>
                <span>{daily[daily.length - 1]?.date}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          )}
        </div>

        {/* Platform donut */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-brand-600" /> Shares by Platform
          </h3>
          {isLoading ? (
            <div className="h-32 bg-gray-50 animate-pulse rounded-lg" />
          ) : (
            <DonutChart data={donutData} />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top shared jobs */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" /> Most Shared Jobs
          </h3>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-50 animate-pulse rounded" />
            ))}</div>
          ) : topJobs.length === 0 ? (
            <p className="text-sm text-gray-400">No shares recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {topJobs.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">{t.job.title}</p>
                      {t.job.employer && <p className="text-xs text-gray-400 truncate">{t.job.employer.companyName}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-900">{t.count}</span>
                    <a
                      href={`/job/${t.job.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-brand-500 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UTM Campaigns */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-violet-600" /> Top UTM Campaigns
          </h3>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-50 animate-pulse rounded" />
            ))}</div>
          ) : byCampaign.length === 0 ? (
            <p className="text-sm text-gray-400">No UTM campaign data yet. Ask employers to use the Social Marketing Toolkit.</p>
          ) : (
            <HBar data={byCampaign.map((c) => ({ label: c.campaign, count: c.count }))} />
          )}
        </div>
      </div>

      {/* Platform breakdown table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Platform Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-semibold">Platform</th>
              <th className="text-right pb-2 font-semibold">Shares</th>
              <th className="text-right pb-2 font-semibold">% of Total</th>
            </tr>
          </thead>
          <tbody>
            {byPlatform.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-6 text-center text-gray-400 text-sm">No data yet</td>
              </tr>
            ) : (
              byPlatform.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span style={{ color: PLATFORM_COLORS[p.platform] || '#6b7280' }}>
                        {PLATFORM_ICONS[p.platform] || <Globe className="h-4 w-4" />}
                      </span>
                      <span className="font-medium capitalize text-gray-800">{p.platform}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-900">{p.count}</td>
                  <td className="py-2.5 text-right text-gray-500">{total ? ((p.count / total) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* SEO quick links */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-brand-400" /> SEO Tools & Resources
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'XML Sitemap', url: '/api/v1/seo/sitemap.xml', desc: 'Submit to Google Search Console' },
            { label: 'Robots.txt', url: '/robots.txt', desc: 'Crawler access rules' },
            { label: 'API Docs', url: '/api/docs', desc: 'Full API documentation' },
          ].map(({ label, url, desc }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-white/20 rounded-xl p-3 transition-colors flex items-start justify-between gap-2 group"
            >
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-gray-500 group-hover:text-white transition-colors flex-shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
