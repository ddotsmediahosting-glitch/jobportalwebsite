import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, CheckCircle, AlertCircle, XCircle, ArrowRight,
  User, TrendingUp, Target, Zap
} from 'lucide-react';
import { api } from '../../lib/api';

interface CoachResult {
  completionScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  strengths: string[];
  improvements: Array<{
    section: string;
    priority: 'critical' | 'high' | 'medium';
    suggestion: string;
    impact: string;
  }>;
  missingCritical: string[];
  nextSteps: string[];
  profileSummary: string;
}

function GradeCircle({ grade, score }: { grade: string; score: number }) {
  const colors = (
    grade === 'A' ? 'from-emerald-500 to-teal-500' :
    grade === 'B' ? 'from-blue-500 to-indigo-500' :
    grade === 'C' ? 'from-amber-500 to-orange-500' :
    'from-red-500 to-rose-600'
  );

  return (
    <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${colors} flex flex-col items-center justify-center shadow-xl`}>
      <span className="text-4xl font-black text-white">{grade}</span>
      <span className="text-sm font-bold text-white/80">{score}%</span>
    </div>
  );
}

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === 'critical') return <XCircle size={16} className="text-red-500 flex-shrink-0" />;
  if (priority === 'high') return <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />;
  return <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />;
}

export function ProfileCoach() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<CoachResult>({
    queryKey: ['profile-coach'],
    queryFn: () => api.get('/ai/profile-coach').then((r) => r.data.data),
    staleTime: 10 * 60_000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles size={14} /> AI Profile Coach
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            How Strong Is Your Profile?
          </h1>
          <p className="text-purple-200 max-w-xl mx-auto">
            Get a personalized AI analysis of your profile with actionable steps to get hired faster
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Sparkles size={40} className="text-purple-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 font-medium">Analyzing your profile...</p>
            <p className="text-sm text-gray-400 mt-1">This takes just a moment</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
            <p className="text-red-500">Could not load profile analysis. Please try again.</p>
          </div>
        ) : data ? (
          <>
            {/* Score card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-6">
                <GradeCircle grade={data.grade} score={data.completionScore} />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Profile Score: {data.completionScore}/100</h2>
                  <p className="text-gray-500 text-sm mb-3">{data.profileSummary}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all bg-gradient-to-r ${
                        data.completionScore >= 90 ? 'from-emerald-500 to-teal-500' :
                        data.completionScore >= 75 ? 'from-blue-500 to-indigo-500' :
                        data.completionScore >= 50 ? 'from-amber-500 to-orange-500' :
                        'from-red-500 to-rose-600'
                      }`}
                      style={{ width: `${data.completionScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {data.strengths.length > 0 && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2 mb-3">
                  <TrendingUp size={16} /> Strengths
                </h3>
                <ul className="space-y-1.5">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                      <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical missing items */}
            {data.missingCritical.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
                <h3 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                  <XCircle size={16} /> Critical Missing Elements
                </h3>
                <ul className="space-y-1.5">
                  {data.missingCritical.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <XCircle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {data.improvements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <Target size={16} className="text-purple-500" /> Improvement Roadmap
                </h3>
                <div className="space-y-3">
                  {data.improvements.map((item, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <PriorityIcon priority={item.priority} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800">{item.section}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            item.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{item.priority}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{item.suggestion}</p>
                        <p className="text-xs text-gray-400 mt-1 italic">Impact: {item.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next steps */}
            {data.nextSteps.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100 p-5">
                <h3 className="font-bold text-purple-800 flex items-center gap-2 mb-3">
                  <Zap size={16} /> Your Next Steps
                </h3>
                <ol className="space-y-2">
                  {data.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-purple-700">
                      <span className="w-5 h-5 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
              >
                <User size={16} /> Update My Profile
              </button>
              <button
                onClick={() => navigate('/cv-builder')}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:border-purple-300 hover:text-purple-700 transition-all flex items-center justify-center gap-2"
              >
                Build AI Resume <ArrowRight size={16} />
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
