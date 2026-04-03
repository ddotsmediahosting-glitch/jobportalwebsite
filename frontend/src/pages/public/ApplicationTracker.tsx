import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Clock, CheckCircle, X, Eye, MessageCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { api } from '../../lib/api';

const STAGES = [
  { key: 'SUBMITTED', label: 'Applied', color: 'bg-blue-500', lightColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  { key: 'VIEWED', label: 'Viewed', color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-violet-500', lightColor: 'bg-violet-50', textColor: 'text-violet-700', borderColor: 'border-violet-200' },
  { key: 'INTERVIEW', label: 'Interview', color: 'bg-amber-500', lightColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
  { key: 'OFFER', label: 'Offer', color: 'bg-emerald-500', lightColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
  { key: 'HIRED', label: 'Hired', color: 'bg-green-600', lightColor: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' },
  { key: 'REJECTED', label: 'Not Selected', color: 'bg-red-400', lightColor: 'bg-red-50', textColor: 'text-red-600', borderColor: 'border-red-200' },
];

interface Application {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    slug: string;
    employer: { companyName: string; logoUrl: string | null; slug: string };
    emirate: string;
    workMode: string;
  };
  interviewSlots?: Array<{ id: string; scheduledAt: string; status: string; type: string }>;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function ApplicationTracker() {
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['my-applications-tracker'],
    queryFn: () => api.get('/seeker/applications?limit=100').then((r) => r.data.data),
  });

  const applications: Application[] = data?.items || [];

  const byStage: Record<string, Application[]> = {};
  for (const stage of STAGES) {
    byStage[stage.key] = applications.filter((a) => a.status === stage.key);
  }

  const filtered = filterStatus ? applications.filter((a) => a.status === filterStatus) : applications;

  const stats = {
    total: applications.length,
    active: applications.filter((a) => !['REJECTED', 'HIRED'].includes(a.status)).length,
    interviews: applications.filter((a) => a.status === 'INTERVIEW').length,
    offers: applications.filter((a) => a.status === 'OFFER').length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application Tracker</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track the status of all your job applications</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'list' ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'}`}
            >
              List
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Applied', value: stats.total, icon: Briefcase, color: 'text-brand-600' },
            { label: 'Active', value: stats.active, icon: Clock, color: 'text-amber-600' },
            { label: 'Interviews', value: stats.interviews, icon: Calendar, color: 'text-violet-600' },
            { label: 'Offers', value: stats.offers, icon: CheckCircle, color: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
              <s.icon size={22} className={s.color} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <Briefcase size={40} className="mx-auto text-gray-200 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-sm text-gray-400 mb-5">Start applying to jobs to track your progress here</p>
            <Link to="/jobs" className="bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700 transition-colors inline-block">
              Browse Jobs
            </Link>
          </div>
        ) : view === 'kanban' ? (
          // Kanban view — only active stages (exclude REJECTED/HIRED in compact columns)
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.filter((s) => s.key !== 'REJECTED').map((stage) => (
              <div key={stage.key} className="flex-shrink-0 w-64">
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${stage.lightColor} ${stage.borderColor} border mb-3`}>
                  <span className={`text-xs font-bold ${stage.textColor}`}>{stage.label}</span>
                  <span className={`text-xs font-bold bg-white/70 px-1.5 py-0.5 rounded-full ${stage.textColor}`}>
                    {byStage[stage.key]?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {byStage[stage.key]?.map((app) => (
                    <ApplicationCard key={app.id} app={app} stage={stage} />
                  ))}
                  {(byStage[stage.key]?.length || 0) === 0 && (
                    <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List view
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilterStatus('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${!filterStatus ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                All ({applications.length})
              </button>
              {STAGES.map((s) => byStage[s.key]?.length > 0 && (
                <button
                  key={s.key}
                  onClick={() => setFilterStatus(filterStatus === s.key ? '' : s.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${filterStatus === s.key ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200'}`}
                >
                  {s.label} ({byStage[s.key].length})
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {filtered.map((app) => {
                const stage = STAGES.find((s) => s.key === app.status) || STAGES[0];
                return (
                  <div key={app.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {app.job.employer.logoUrl ? (
                      <img loading="lazy" decoding="async" src={app.job.employer.logoUrl} alt="" className="h-10 w-10 rounded-xl object-contain border border-gray-100 flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                        {app.job.employer.companyName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link to={`/jobs/${app.job.slug}`} className="font-semibold text-gray-900 hover:text-brand-600 text-sm truncate block">
                        {app.job.title}
                      </Link>
                      <p className="text-xs text-gray-500">{app.job.employer.companyName}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${stage.lightColor} ${stage.textColor} ${stage.borderColor}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">{timeAgo(app.createdAt)}</span>
                    <Link to={`/jobs/${app.job.slug}`} className="text-gray-300 hover:text-brand-500 flex-shrink-0 transition-colors">
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({ app, stage }: { app: Application; stage: typeof STAGES[0] }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-2.5 mb-2.5">
        {app.job.employer.logoUrl ? (
          <img loading="lazy" decoding="async" src={app.job.employer.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain border border-gray-100 flex-shrink-0" />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-700 font-bold text-xs flex-shrink-0">
            {app.job.employer.companyName[0]}
          </div>
        )}
        <div className="min-w-0">
          <Link to={`/jobs/${app.job.slug}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600 line-clamp-1 transition-colors">
            {app.job.title}
          </Link>
          <p className="text-xs text-gray-500 truncate">{app.job.employer.companyName}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock size={10} /> {timeAgo(app.createdAt)}
        </span>
        <Link to={`/jobs/${app.job.slug}`} className="text-brand-600 hover:underline">View ↗</Link>
      </div>

      {app.interviewSlots?.filter((s) => s.status !== 'CANCELLED').map((slot) => (
        <div key={slot.id} className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
          <Calendar size={10} />
          Interview: {new Date(slot.scheduledAt).toLocaleDateString()} at {new Date(slot.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${slot.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
            {slot.status}
          </span>
        </div>
      ))}
    </div>
  );
}
