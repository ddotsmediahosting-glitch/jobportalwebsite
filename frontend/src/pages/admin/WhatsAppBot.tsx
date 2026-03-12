import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MessageCircle, Send, Users, BarChart2, Settings, Copy, Check,
  RefreshCw, Loader2, TrendingUp, ArrowUpDown, Wifi, WifiOff,
  ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';
import { Button } from '../../components/ui/Button';

// ── Mini bar chart ──────────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { date: string; inbound: number; outbound: number }[] }) {
  const max = Math.max(...data.flatMap((d) => [d.inbound, d.outbound]), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.date}: ${d.inbound} in / ${d.outbound} out`}>
          <div className="w-full flex flex-col justify-end gap-px" style={{ height: 52 }}>
            <div className="w-full rounded-sm bg-green-400" style={{ height: `${(d.outbound / max) * 50}px` }} />
            <div className="w-full rounded-sm bg-blue-400" style={{ height: `${(d.inbound / max) * 50}px` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Conversation bubble ─────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: { body: string; direction: string; from: string; createdAt: string } }) {
  const isOut = msg.direction === 'outbound';
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
        isOut ? 'bg-green-100 text-green-900 rounded-br-sm' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
      }`}>
        {msg.body}
        <p className={`text-[10px] mt-1 ${isOut ? 'text-green-600' : 'text-gray-400'}`}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export function AdminWhatsAppBot() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'messages' | 'test' | 'setup'>('overview');
  const [testTo, setTestTo] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['wa-stats'],
    queryFn: () => api.get('/whatsapp/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['wa-sessions'],
    queryFn: () => api.get('/whatsapp/sessions').then((r) => r.data.data),
    enabled: activeTab === 'sessions',
  });

  const { data: messagesData } = useQuery({
    queryKey: ['wa-messages'],
    queryFn: () => api.get('/whatsapp/messages').then((r) => r.data.data),
    enabled: activeTab === 'messages',
  });

  // ── Send test message ───────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: () => api.post('/whatsapp/send', { to: testTo, message: testMsg }),
    onSuccess: () => { toast.success('Message sent!'); setTestMsg(''); qc.invalidateQueries({ queryKey: ['wa-stats'] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  // ── Clear session ────────────────────────────────────────────────────────────
  const clearSessionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/whatsapp/sessions/${id}`),
    onSuccess: () => { toast.success('Session cleared'); qc.invalidateQueries({ queryKey: ['wa-sessions'] }); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const stats = statsData;
  const isConfigured: boolean = stats?.isConfigured ?? false;
  const webhookUrl: string = stats?.webhookUrl ?? '';

  async function copyWebhook() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success('Webhook URL copied!');
    setTimeout(() => setCopiedWebhook(false), 2000);
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'sessions', label: 'Sessions', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'test', label: 'Test Bot', icon: Send },
    { id: 'setup', label: 'Setup Guide', icon: Settings },
  ] as const;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-green-500 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            WhatsApp Chatbot
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">AI-powered job search assistant via WhatsApp (Twilio)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
            isConfigured ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {isConfigured ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {isConfigured ? 'Connected' : 'Not Configured'}
          </span>
          <button onClick={() => refetchStats()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-brand-600 transition-all">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === id ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Sessions', value: stats?.totalSessions, color: 'bg-blue-50 text-blue-700', icon: Users },
              { label: 'Active (24h)', value: stats?.activeSessions, color: 'bg-green-50 text-green-700', icon: TrendingUp },
              { label: 'Messages In', value: stats?.inbound, color: 'bg-violet-50 text-violet-700', icon: ArrowUpDown },
              { label: 'Messages Out', value: stats?.outbound, color: 'bg-amber-50 text-amber-700', icon: Send },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center mb-2`}>
                  <Icon className="h-4 w-4" />
                </div>
                {statsLoading ? (
                  <div className="h-7 w-10 bg-gray-100 animate-pulse rounded mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{value ?? '–'}</p>
                )}
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>

          {/* 7-day chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">7-Day Message Activity</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-400" /> Inbound</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-400" /> Outbound</span>
              </div>
            </div>
            {stats?.daily?.length ? (
              <>
                <MiniBarChart data={stats.daily} />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>{stats.daily[0]?.date}</span>
                  <span>{stats.daily[stats.daily.length - 1]?.date}</span>
                </div>
              </>
            ) : (
              <div className="h-16 flex items-center justify-center text-sm text-gray-400">No message data yet</div>
            )}
          </div>

          {/* State distribution + recent messages side by side */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Session States</h3>
              {stats?.stateDistribution?.length ? (
                <div className="space-y-2">
                  {stats.stateDistribution.map((s: { state: string; count: number }) => (
                    <div key={s.state} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 capitalize">{s.state}</span>
                      <span className="text-sm font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400">No sessions yet</p>}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Recent Messages</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {stats?.recentMessages?.length ? (
                  stats.recentMessages.slice(0, 8).map((m: { body: string; direction: string; from: string; createdAt: string }, i: number) => (
                    <div key={i} className={`text-xs p-2 rounded-lg ${m.direction === 'inbound' ? 'bg-blue-50 text-blue-800' : 'bg-green-50 text-green-800'}`}>
                      <span className="font-semibold">{m.direction === 'inbound' ? '← ' : '→ '}</span>
                      {m.body.slice(0, 80)}{m.body.length > 80 ? '…' : ''}
                    </div>
                  ))
                ) : <p className="text-sm text-gray-400">No messages yet</p>}
              </div>
            </div>
          </div>

          {/* Sandbox info */}
          <div className="bg-green-950 text-white rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-400" /> Twilio Sandbox Number
            </h3>
            <p className="text-2xl font-bold text-green-300 mb-1">{stats?.sandboxNumber || '+1 415 523 8886'}</p>
            <p className="text-xs text-green-600">Users must send <span className="text-green-300 font-mono">"join [your-sandbox-keyword]"</span> to this number first to opt in to the sandbox.</p>
          </div>
        </div>
      )}

      {/* ── SESSIONS ─────────────────────────────────────────────────────────── */}
      {activeTab === 'sessions' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Active Sessions ({sessionsData?.total ?? '…'})</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {!sessionsData ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-gray-300 mx-auto" /></div>
            ) : sessionsData.sessions.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No sessions yet.</div>
            ) : (
              sessionsData.sessions.map((s: {
                id: string; phoneNumber: string; profileName?: string;
                state: string; optedOut: boolean; lastActiveAt: string; createdAt: string;
              }) => (
                <div key={s.id}>
                  <div className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                      {s.profileName?.[0]?.toUpperCase() || s.phoneNumber.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{s.profileName || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">{s.phoneNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        s.optedOut ? 'bg-red-100 text-red-600' :
                        s.state === 'idle' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                      }`}>{s.optedOut ? 'opted-out' : s.state}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(s.lastActiveAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                      >
                        {expandedSession === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => clearSessionMutation.mutate(s.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                        title="Reset session state"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {expandedSession === s.id && (
                    <div className="px-5 pb-3 bg-gray-50 text-xs text-gray-500 space-y-1">
                      <p>Phone: <span className="font-mono text-gray-700">{s.phoneNumber}</span></p>
                      <p>State: <span className="font-semibold text-gray-700 capitalize">{s.state}</span></p>
                      <p>Created: {new Date(s.createdAt).toLocaleString()}</p>
                      <p>Last Active: {new Date(s.lastActiveAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── MESSAGES ─────────────────────────────────────────────────────────── */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Message Log ({messagesData?.total ?? '…'})</h3>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {!messagesData ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-gray-300 mx-auto" /></div>
            ) : messagesData.messages.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No messages yet.</div>
            ) : (
              messagesData.messages.map((m: {
                id: string; from: string; to: string; body: string;
                direction: string; status: string; createdAt: string;
              }) => (
                <div key={m.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                      m.direction === 'inbound' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {m.direction === 'inbound' ? '← IN' : '→ OUT'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">
                        {m.direction === 'inbound' ? m.from.replace('whatsapp:', '') : m.to.replace('whatsapp:', '')}
                        <span className="mx-1 text-gray-300">·</span>
                        {new Date(m.createdAt).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.body.slice(0, 200)}{m.body.length > 200 ? '…' : ''}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TEST BOT ─────────────────────────────────────────────────────────── */}
      {activeTab === 'test' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Send Test Message</h3>
            {!isConfigured && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                ⚠️ Twilio is not configured. Set <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">TWILIO_ACCOUNT_SID</code>, <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">TWILIO_AUTH_TOKEN</code> and <code className="font-mono text-xs bg-amber-100 px-1 py-0.5 rounded">TWILIO_WHATSAPP_FROM</code> in your <code className="font-mono text-xs">.env</code> file.
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Recipient (E.164 format)</label>
              <input
                type="text"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="+971501234567"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
              <textarea
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                rows={4}
                placeholder="Hello from DdotsmediaJobs!"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 resize-y"
              />
            </div>
            <Button
              onClick={() => sendMutation.mutate()}
              loading={sendMutation.isPending}
              disabled={!testTo || !testMsg || !isConfigured}
              className="bg-green-600 hover:bg-green-700"
              icon={<Send className="h-4 w-4" />}
            >
              Send WhatsApp Message
            </Button>
          </div>

          {/* Chatbot command reference */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Chatbot Commands Reference</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-xs">
              {[
                { cmd: 'hi / hello / start', desc: 'Show main menu' },
                { cmd: '1 / search jobs', desc: 'Enter job search mode' },
                { cmd: '2 / browse by emirate', desc: 'Filter jobs by location' },
                { cmd: '3 / salary', desc: 'Enter salary insights mode' },
                { cmd: '4 / companies', desc: 'Show top hiring companies' },
                { cmd: '5 / career advice', desc: 'AI career advisor mode' },
                { cmd: 'jobs [keyword]', desc: 'Direct keyword job search' },
                { cmd: 'salary [role]', desc: 'Salary data for a role' },
                { cmd: 'company [name]', desc: 'Company profile lookup' },
                { cmd: 'alert [keyword]', desc: 'Set up job alert (links to site)' },
                { cmd: 'menu', desc: 'Return to main menu' },
                { cmd: 'help', desc: 'Show all commands' },
                { cmd: 'stop', desc: 'Opt-out from chatbot' },
              ].map(({ cmd, desc }) => (
                <div key={cmd} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                  <code className="font-mono text-green-700 font-bold flex-shrink-0">{cmd}</code>
                  <span className="text-gray-500">→ {desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SETUP GUIDE ──────────────────────────────────────────────────────── */}
      {activeTab === 'setup' && (
        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">1</span>
              Create a Twilio Account
            </h3>
            <p className="text-sm text-gray-600 mb-3">Sign up at <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">twilio.com</a> and activate the WhatsApp Sandbox from the Twilio Console.</p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <p>Console → Messaging → Try it out → Send a WhatsApp message</p>
              <p>Note your <strong>Account SID</strong> and <strong>Auth Token</strong> from the dashboard.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              Add Environment Variables
            </h3>
            <p className="text-sm text-gray-600 mb-3">Add these to your <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">.env</code> file:</p>
            <pre className="bg-gray-900 text-green-300 text-xs rounded-xl p-4 overflow-x-auto font-mono leading-relaxed">
{`TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://your-domain.com/api/v1/whatsapp/webhook`}
            </pre>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              Configure Webhook URL in Twilio
            </h3>
            <p className="text-sm text-gray-600 mb-3">In Twilio Console → Messaging → Sandbox → <strong>"When a message comes in"</strong>:</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <code className="flex-1 text-xs font-mono text-brand-700 break-all">{webhookUrl || 'https://your-api-domain.com/api/v1/whatsapp/webhook'}</code>
              <button onClick={copyWebhook} className="flex-shrink-0 p-1.5 rounded-lg border border-gray-200 hover:border-brand-300 transition-all">
                {copiedWebhook ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Method: <strong>HTTP POST</strong></p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">4</span>
              Test the Sandbox
            </h3>
            <p className="text-sm text-gray-600 mb-2">Send this WhatsApp message to <strong>{stats?.sandboxNumber || '+1 415 523 8886'}</strong>:</p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 font-mono text-sm text-green-800">
              join &lt;your-sandbox-keyword&gt;
            </div>
            <p className="text-xs text-gray-400 mt-2">After joining, send <strong>"hi"</strong> to start chatting with the bot.</p>
          </div>

          {/* Step 5 – Production */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">5</span>
              Going to Production
            </h3>
            <ul className="text-sm text-gray-300 space-y-1.5 list-disc pl-4">
              <li>Apply for a <strong className="text-white">WhatsApp Business API</strong> phone number in Twilio</li>
              <li>Complete Meta's WhatsApp Business verification</li>
              <li>Update <code className="font-mono text-xs bg-white/10 px-1 rounded">TWILIO_WHATSAPP_FROM</code> with your approved number</li>
              <li>Signature validation is enforced automatically in production</li>
              <li>Consider adding Redis caching for high-volume session lookups</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
