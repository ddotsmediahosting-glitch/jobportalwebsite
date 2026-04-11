import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Share2, Sparkles, Link2, BarChart2, Copy, Check, ExternalLink, TrendingUp,
  Linkedin, Twitter, Facebook, MessageCircle, RefreshCw, Loader2,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const BASE_URL = import.meta.env.VITE_FRONTEND_URL || 'https://jobs.ddotsmedia.com';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
  copy: <Link2 className="h-4 w-4" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-100 text-blue-700',
  twitter: 'bg-gray-100 text-gray-700',
  facebook: 'bg-blue-100 text-blue-600',
  whatsapp: 'bg-green-100 text-green-700',
  copy: 'bg-gray-100 text-gray-600',
  email: 'bg-purple-100 text-purple-700',
};

function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return <p className="text-center text-gray-400 text-sm py-8">No data yet</p>;

  let cumulative = 0;
  const slices = data.map((d) => {
    const pct = (d.count / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const r = 40;
  const cx = 60;
  const cy = 60;

  function polarToXY(pct: number) {
    const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {slices.map((s, i) => {
          const start = polarToXY(s.start);
          const end = polarToXY(s.start + s.pct);
          const large = s.pct > 50 ? 1 : 0;
          const path = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
          return <path key={i} d={path} fill={s.color} />;
        })}
        <circle cx={cx} cy={cy} r={22} fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#111">{total}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#888">shares</text>
      </svg>
      <div className="space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-600 capitalize">{s.label}</span>
            <span className="font-semibold text-gray-900 ml-auto pl-2">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const DONUT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

function SparkLine({ data }: { data: { date: string; count: number }[] }) {
  const vals = data.map((d) => d.count);
  const max = Math.max(...vals, 1);
  const w = 300;
  const h = 60;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - (v / max) * (h - 8) - 4}`).join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" points={pts} />
      {vals.map((v, i) => (
        <circle key={i} cx={(i / (vals.length - 1)) * w} cy={h - (v / max) * (h - 8) - 4} r="2.5" fill="#3b82f6" />
      ))}
    </svg>
  );
}

export function SocialMarketing() {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'linkedin' | 'twitter' | 'facebook' | 'whatsapp'>('linkedin');
  const [generatedPost, setGeneratedPost] = useState('');
  const [copiedPost, setCopiedPost] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'utm' | 'stats'>('generate');

  // UTM builder state
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('social');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [builtLink, setBuiltLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: jobsData } = useQuery({
    queryKey: ['employer-jobs-marketing'],
    queryFn: () => api.get('/employer/jobs').then((r) => r.data.data?.jobs || r.data.data || []),
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['employer-marketing-stats'],
    queryFn: () => api.get('/marketing/employer/stats').then((r) => r.data.data),
  });

  const { data: jobStats, isLoading: jobStatsLoading } = useQuery({
    queryKey: ['job-share-stats', selectedJobId],
    queryFn: () => api.get(`/marketing/job/${selectedJobId}/stats`).then((r) => r.data.data),
    enabled: !!selectedJobId && activeTab === 'stats',
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/marketing/generate-post', { jobId: selectedJobId, platform: selectedPlatform }).then((r) => r.data.data),
    onSuccess: (data) => { setGeneratedPost(data.post); toast.success('Post generated!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const jobs: { id: string; title: string; slug: string; status: string }[] = Array.isArray(jobsData) ? jobsData : [];
  const publishedJobs = jobs.filter((j) => j.status === 'PUBLISHED');

  const selectedJob = publishedJobs.find((j) => j.id === selectedJobId);
  const jobUrl = selectedJob ? `${BASE_URL}/job/${selectedJob.slug}` : '';

  function buildUtm() {
    if (!selectedJob || !utmSource || !utmMedium || !utmCampaign) {
      toast.error('Select a job and fill all UTM fields'); return;
    }
    try {
      const u = new URL(jobUrl);
      u.searchParams.set('utm_source', utmSource);
      u.searchParams.set('utm_medium', utmMedium);
      u.searchParams.set('utm_campaign', utmCampaign);
      if (utmContent) u.searchParams.set('utm_content', utmContent);
      setBuiltLink(u.toString());
    } catch {
      toast.error('Invalid URL');
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(builtLink);
    setCopiedLink(true);
    toast.success('Copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function copyPost() {
    await navigator.clipboard.writeText(generatedPost);
    setCopiedPost(true);
    toast.success('Post copied!');
    setTimeout(() => setCopiedPost(false), 2000);
  }

  const platformPreviewStyle: Record<string, string> = {
    linkedin: 'font-[Georgia] bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-800 leading-relaxed shadow-sm',
    twitter: 'font-[system-ui] bg-black text-white rounded-2xl p-4 text-sm leading-relaxed max-w-sm',
    facebook: 'font-[Helvetica] bg-white border border-gray-100 rounded-lg p-4 text-sm text-gray-900 leading-relaxed shadow',
    whatsapp: 'font-[system-ui] bg-[#dcf8c6] text-gray-900 rounded-xl p-3 text-sm leading-relaxed max-w-xs',
  };

  const byPlatform = statsData?.byPlatform || [];
  const donutData = byPlatform.map((p: { platform: string; count: number }, i: number) => ({
    label: p.platform,
    count: p.count,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-600" /> Social Marketing Toolkit
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate AI posts, build UTM links and track social shares</p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Shares', value: statsData?.total ?? '–', icon: Share2, color: 'text-brand-600 bg-brand-50' },
          { label: 'LinkedIn', value: byPlatform.find((p: { platform: string }) => p.platform === 'linkedin')?.count ?? 0, icon: Linkedin, color: 'text-blue-600 bg-blue-50' },
          { label: 'WhatsApp', value: byPlatform.find((p: { platform: string }) => p.platform === 'whatsapp')?.count ?? 0, icon: MessageCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Top Jobs', value: statsData?.topJobs?.length ?? '–', icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Job selector */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Job</label>
        {publishedJobs.length === 0 ? (
          <p className="text-sm text-gray-400">No published jobs found.</p>
        ) : (
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— choose a job —</option>
            {publishedJobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        )}
        {selectedJob && (
          <div className="mt-2 flex items-center gap-2">
            <a href={jobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:underline flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> {jobUrl}
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { id: 'generate', label: 'AI Post Generator', icon: Sparkles },
          { id: 'utm', label: 'UTM Link Builder', icon: Link2 },
          { id: 'stats', label: 'Share Stats', icon: BarChart2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab: AI Post Generator */}
      {activeTab === 'generate' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Platform</label>
            <div className="flex flex-wrap gap-2">
              {(['linkedin', 'twitter', 'facebook', 'whatsapp'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPlatform(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all capitalize ${
                    selectedPlatform === p
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {PLATFORM_ICONS[p]} {p === 'twitter' ? 'X / Twitter' : p}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!selectedJobId || generateMutation.isPending}
            loading={generateMutation.isPending}
            icon={<Sparkles className="h-4 w-4" />}
          >
            Generate Post with AI
          </Button>

          {generatedPost && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">Preview</p>
                <div className="flex gap-2">
                  <button
                    onClick={copyPost}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                  >
                    {copiedPost ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedPost ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => generateMutation.mutate()}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-600 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                  </button>
                </div>
              </div>
              <div className={platformPreviewStyle[selectedPlatform]}>
                <pre className="whitespace-pre-wrap text-inherit font-inherit">{generatedPost}</pre>
              </div>
              <textarea
                value={generatedPost}
                onChange={(e) => setGeneratedPost(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-500 resize-y"
                placeholder="Edit the generated post…"
              />
            </div>
          )}
        </div>
      )}

      {/* Tab: UTM Link Builder */}
      {activeTab === 'utm' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-sm text-gray-500">Build trackable UTM links to measure traffic from each campaign.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: 'UTM Source *', state: utmSource, setter: setUtmSource, placeholder: 'e.g. linkedin' },
              { label: 'UTM Medium *', state: utmMedium, setter: setUtmMedium, placeholder: 'e.g. social' },
              { label: 'UTM Campaign *', state: utmCampaign, setter: setUtmCampaign, placeholder: 'e.g. spring-hiring-2025' },
              { label: 'UTM Content (optional)', state: utmContent, setter: setUtmContent, placeholder: 'e.g. banner-cta' },
            ].map(({ label, state, setter, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                />
              </div>
            ))}
          </div>

          <Button onClick={buildUtm} disabled={!selectedJobId} icon={<Link2 className="h-4 w-4" />}>
            Build UTM Link
          </Button>

          {builtLink && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">Your trackable link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 break-all">{builtLink}</code>
                <button
                  onClick={copyLink}
                  className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-500" />}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { platform: 'LinkedIn', prefix: 'https://www.linkedin.com/sharing/share-offsite/?url=' },
                  { platform: 'Twitter', prefix: 'https://twitter.com/intent/tweet?url=' },
                  { platform: 'Facebook', prefix: 'https://www.facebook.com/sharer/sharer.php?u=' },
                ].map(({ platform, prefix }) => (
                  <a
                    key={platform}
                    href={prefix + encodeURIComponent(builtLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-brand-300 transition-colors text-gray-600"
                  >
                    <ExternalLink className="h-3 w-3" /> Share on {platform}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Share Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {/* Overall stats */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Shares by Platform (All Jobs)</h3>
            <DonutChart data={donutData} />
          </div>

          {/* Top shared jobs */}
          {statsData?.topJobs?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Shared Jobs</h3>
              <div className="space-y-2">
                {statsData.topJobs.map((t: { job: { title: string; slug: string }; count: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <a href={`/job/${t.job.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-800 hover:text-brand-600 truncate max-w-xs">
                      {t.job.title}
                    </a>
                    <span className="text-sm font-semibold text-gray-700 ml-2">{t.count} shares</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Per-job stats */}
          {selectedJobId && (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">
                Stats for: <span className="text-brand-600">{selectedJob?.title}</span>
              </h3>
              {jobStatsLoading ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              ) : jobStats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{jobStats.total}</p>
                      <p className="text-xs text-gray-500">Total Shares</p>
                    </div>
                    {jobStats.byPlatform.slice(0, 2).map((p: { platform: string; count: number }) => (
                      <div key={p.platform} className={`rounded-xl p-3 text-center ${PLATFORM_COLORS[p.platform] || 'bg-gray-50 text-gray-700'}`}>
                        <p className="text-2xl font-bold">{p.count}</p>
                        <p className="text-xs capitalize">{p.platform}</p>
                      </div>
                    ))}
                  </div>
                  {jobStats.daily?.length > 1 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Daily Shares (14 days)</p>
                      <SparkLine data={jobStats.daily} />
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{jobStats.daily[0]?.date}</span>
                        <span>{jobStats.daily[jobStats.daily.length - 1]?.date}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No share data for this job yet.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Platform best practices */}
      <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-xl p-5">
        <h3 className="font-semibold text-brand-900 text-sm mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" /> Platform Best Practices
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-brand-800">
          {[
            { icon: <Linkedin className="h-3.5 w-3.5" />, label: 'LinkedIn', tip: 'Post between 8–10am Tue–Thu. Use 3–5 hashtags. Tag company page for more reach.' },
            { icon: <Twitter className="h-3.5 w-3.5" />, label: 'X / Twitter', tip: 'Keep under 280 chars with link. Use 2 hashtags max. Post Mon/Wed/Fri mornings.' },
            { icon: <Facebook className="h-3.5 w-3.5" />, label: 'Facebook', tip: 'Add a compelling image. Post between 1–3pm weekdays. Boost post for extra reach.' },
            { icon: <MessageCircle className="h-3.5 w-3.5" />, label: 'WhatsApp', tip: 'Share in relevant professional groups. Keep message concise and include direct apply link.' },
          ].map(({ icon, label, tip }) => (
            <div key={label} className="flex gap-2">
              <span className="text-brand-600 flex-shrink-0 mt-0.5">{icon}</span>
              <div><p className="font-semibold">{label}</p><p className="text-brand-700 mt-0.5">{tip}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
