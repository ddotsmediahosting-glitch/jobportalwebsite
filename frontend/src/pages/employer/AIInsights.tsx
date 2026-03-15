import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, TrendingUp, Users, Target, Zap, BarChart3,
  CheckCircle, AlertTriangle, RefreshCcw
} from 'lucide-react';
import { api } from '../../lib/api';

interface HiringInsights {
  overallScore: number;
  insights: Array<{
    category: string;
    finding: string;
    recommendation: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  topPerformingJobTypes: string[];
  candidateQualityTrends: string;
  hiringVelocityTip: string;
  salaryCompetitiveness: string;
  suggestedImprovements: string[];
}

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-emerald-500' :
    score >= 60 ? 'text-blue-500' :
    score >= 40 ? 'text-amber-500' : 'text-red-500';

  const label =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Needs Work' : 'Critical';

  return (
    <div className="text-center">
      <div className={`text-6xl font-black ${color}`}>{score}</div>
      <div className="text-sm font-semibold text-gray-500 mt-1">{label} Hiring Effectiveness</div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: string }) {
  const styles = (
    impact === 'high' ? 'bg-red-100 text-red-700' :
    impact === 'medium' ? 'bg-amber-100 text-amber-700' :
    'bg-gray-100 text-gray-600'
  );
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${styles}`}>{impact}</span>;
}

export function EmployerAIInsights() {
  const { data, isLoading, error, refetch, isFetching } = useQuery<HiringInsights>({
    queryKey: ['hiring-insights'],
    queryFn: () => api.get('/ai/hiring-insights').then((r) => r.data.data),
    staleTime: 60 * 60_000,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={22} className="text-purple-500" />
            AI Hiring Insights
          </h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered analysis of your hiring performance and recommendations</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-purple-300 hover:text-purple-700 transition-all disabled:opacity-50"
        >
          <RefreshCcw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Sparkles size={48} className="text-purple-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 font-medium">Analyzing your hiring data...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-8 text-center">
          <AlertTriangle size={40} className="text-red-300 mx-auto mb-3" />
          <p className="text-red-600">Could not load insights. Make sure you have posted jobs.</p>
        </div>
      ) : data ? (
        <>
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-8">
            <ScoreGauge score={data.overallScore} />
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                style={{ width: `${data.overallScore}%` }}
              />
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <BarChart3 size={18} className="text-purple-500" /> Key Insights
            </h2>
            <div className="space-y-4">
              {data.insights.map((insight, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50 hover:bg-purple-50/30 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                      {insight.category}
                    </span>
                    <ImpactBadge impact={insight.impact} />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">{insight.finding}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold text-purple-700">&#8594; </span>
                    {insight.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <Zap size={20} className="text-amber-500 mb-2" />
              <h3 className="font-bold text-gray-800 text-sm mb-1">Speed Tip</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{data.hiringVelocityTip}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <TrendingUp size={20} className="text-emerald-500 mb-2" />
              <h3 className="font-bold text-gray-800 text-sm mb-1">Salary Position</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{data.salaryCompetitiveness}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <Users size={20} className="text-blue-500 mb-2" />
              <h3 className="font-bold text-gray-800 text-sm mb-1">Candidate Trends</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{data.candidateQualityTrends}</p>
            </div>
          </div>

          {/* Improvements */}
          {data.suggestedImprovements.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Target size={18} className="text-blue-500" /> Recommended Actions
              </h2>
              <ol className="space-y-3">
                {data.suggestedImprovements.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Top Job Types */}
          {data.topPerformingJobTypes.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5">
              <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
                <CheckCircle size={16} /> Top Performing Job Types for Your Company
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.topPerformingJobTypes.map((type) => (
                  <span key={type} className="bg-white border border-emerald-200 text-emerald-700 text-sm font-semibold px-3 py-1.5 rounded-xl">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
