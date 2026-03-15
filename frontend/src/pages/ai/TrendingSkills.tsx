import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Sparkles, BookOpen, BarChart3, Clock } from 'lucide-react';
import { api } from '../../lib/api';

interface TrendingSkill {
  skill: string;
  demandCount: number;
  trend: 'rising' | 'stable' | 'declining';
  averageSalaryPremium: string;
  topIndustries: string[];
  relatedSkills: string[];
  learningDifficulty: 'beginner' | 'intermediate' | 'advanced';
  whyTrending: string;
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'rising') return <TrendingUp size={14} className="text-emerald-500" />;
  if (trend === 'declining') return <TrendingDown size={14} className="text-red-500" />;
  return <Minus size={14} className="text-gray-400" />;
}

function DifficultyBadge({ level }: { level: string }) {
  const styles = (
    level === 'beginner' ? 'bg-green-100 text-green-700' :
    level === 'intermediate' ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  );

  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles} capitalize`}>
      {level}
    </span>
  );
}

export function TrendingSkills() {
  const [filter, setFilter] = useState<'all' | 'rising' | 'stable'>('all');

  const { data: skills, isLoading } = useQuery<TrendingSkill[]>({
    queryKey: ['trending-skills'],
    queryFn: () => api.get('/ai/trending-skills').then((r) => r.data.data),
    staleTime: 6 * 60 * 60_000,
  });

  const filtered = skills?.filter((s) => filter === 'all' || s.trend === filter) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-purple-800/50 text-purple-200 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-purple-700/50">
            <Sparkles size={14} /> AI-Powered Market Intelligence
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Trending Skills in UAE 2025
          </h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Real-time analysis of the most in-demand skills across thousands of UAE job postings
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter tabs */}
        <div className="flex items-center gap-3 mb-8">
          {(['all', 'rising', 'stable'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {f === 'all' ? 'All Skills' : f === 'rising' ? 'Rising' : 'Stable'}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400 flex items-center gap-1">
            <Clock size={13} /> Updated every 6 hours
          </span>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <BarChart3 size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">No skill data available yet. Check back when more jobs are posted.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((skill, index) => (
              <div
                key={skill.skill}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-purple-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-gray-200">#{index + 1}</span>
                    <div>
                      <h3 className="font-bold text-gray-900">{skill.skill}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <TrendIcon trend={skill.trend} />
                        <span className={`text-xs font-medium capitalize ${
                          skill.trend === 'rising' ? 'text-emerald-600' :
                          skill.trend === 'declining' ? 'text-red-500' : 'text-gray-500'
                        }`}>{skill.trend}</span>
                      </div>
                    </div>
                  </div>
                  <DifficultyBadge level={skill.learningDifficulty} />
                </div>

                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{skill.whyTrending}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400">Salary premium:</span>
                    <span className="font-semibold text-emerald-700">{skill.averageSalaryPremium}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400">Demand:</span>
                    <span className="font-medium text-gray-700">{skill.demandCount} active jobs</span>
                  </div>
                  {skill.topIndustries.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {skill.topIndustries.slice(0, 2).map((ind) => (
                        <span key={ind} className="text-[10px] bg-gray-50 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                  {skill.relatedSkills.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      <BookOpen size={10} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400">Learn also:</span>
                      {skill.relatedSkills.slice(0, 2).map((s) => (
                        <span key={s} className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
