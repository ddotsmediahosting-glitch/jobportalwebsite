import React from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface ATSScoreCardProps {
  atsScore: number;
  keywordMatchScore: number;
  formatScore: number;
  contentScore: number;
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="45" y="50" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-xs text-gray-500 font-medium text-center">{label}</span>
    </div>
  );
}

function getScoreColor(score: number) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getScoreLabel(score: number) {
  if (score >= 80) return { label: 'Excellent', icon: <CheckCircle className="text-green-500" size={20} /> };
  if (score >= 60) return { label: 'Good', icon: <TrendingUp className="text-amber-500" size={20} /> };
  if (score >= 40) return { label: 'Fair', icon: <AlertCircle className="text-orange-500" size={20} /> };
  return { label: 'Needs Work', icon: <XCircle className="text-red-500" size={20} /> };
}

export function ATSScoreCard({ atsScore, keywordMatchScore, formatScore, contentScore }: ATSScoreCardProps) {
  const { label, icon } = getScoreLabel(atsScore);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="text-lg font-bold text-gray-900">ATS Score: {label}</h3>
      </div>

      {/* Overall score — big ring */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="55" fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle
              cx="65" cy="65" r="55"
              fill="none"
              stroke={getScoreColor(atsScore)}
              strokeWidth="12"
              strokeDasharray={2 * Math.PI * 55}
              strokeDashoffset={2 * Math.PI * 55 - (atsScore / 100) * 2 * Math.PI * 55}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 1.2s ease' }}
            />
            <text x="65" y="60" textAnchor="middle" fontSize="32" fontWeight="bold" fill={getScoreColor(atsScore)}>
              {atsScore}
            </text>
            <text x="65" y="80" textAnchor="middle" fontSize="13" fill="#6b7280">
              Overall
            </text>
          </svg>
        </div>
      </div>

      {/* Sub scores */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreRing score={keywordMatchScore} label="Keywords" color={getScoreColor(keywordMatchScore)} />
        <ScoreRing score={contentScore} label="Content" color={getScoreColor(contentScore)} />
        <ScoreRing score={formatScore} label="Format" color={getScoreColor(formatScore)} />
      </div>

      {/* Score bar */}
      <div className="mt-6">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>0</span>
          <span>Poor</span>
          <span>Fair</span>
          <span>Good</span>
          <span>Excellent</span>
          <span>100</span>
        </div>
        <div className="h-3 bg-gradient-to-r from-red-400 via-yellow-400 to-green-500 rounded-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 rounded-full shadow"
            style={{ left: `calc(${atsScore}% - 10px)`, borderColor: getScoreColor(atsScore), transition: 'left 1s ease' }}
          />
        </div>
      </div>
    </div>
  );
}

interface KeywordsSectionProps {
  matched: string[];
  missing: string[];
}

export function KeywordsSection({ matched, missing }: KeywordsSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Keyword Analysis</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-green-500" size={16} />
            <span className="text-sm font-semibold text-green-700">Matched ({matched.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {matched.map((kw) => (
              <span key={kw} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                {kw}
              </span>
            ))}
            {matched.length === 0 && <span className="text-xs text-gray-400">None found</span>}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="text-red-500" size={16} />
            <span className="text-sm font-semibold text-red-700">Missing ({missing.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {missing.map((kw) => (
              <span key={kw} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-full border border-red-200">
                {kw}
              </span>
            ))}
            {missing.length === 0 && <span className="text-xs text-gray-400">None missing</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SuggestionsListProps {
  suggestions: Array<{ category: string; priority: 'high' | 'medium' | 'low'; suggestion: string }>;
  strengths: string[];
  weaknesses: string[];
}

const priorityStyles = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function SuggestionsList({ suggestions, strengths, weaknesses }: SuggestionsListProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">AI Suggestions</h3>
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className={`p-3 rounded-xl border text-sm ${priorityStyles[s.priority]}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-xs uppercase tracking-wide">{s.category}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  s.priority === 'high' ? 'bg-red-200' : s.priority === 'medium' ? 'bg-amber-200' : 'bg-blue-200'
                }`}>{s.priority}</span>
              </div>
              <p>{s.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-base font-bold text-green-700 mb-3 flex items-center gap-2">
            <CheckCircle size={16} /> Strengths
          </h3>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-base font-bold text-red-700 mb-3 flex items-center gap-2">
            <XCircle size={16} /> Areas to Improve
          </h3>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span> {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
