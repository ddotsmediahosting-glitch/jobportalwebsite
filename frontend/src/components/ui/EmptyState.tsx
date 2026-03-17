import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  illustration?: 'search' | 'saved' | 'applications' | 'jobs' | 'messages' | 'generic';
  title: string;
  description?: string;
  action?: { label: string; to: string };
  className?: string;
}

const illustrations: Record<string, React.ReactNode> = {
  search: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      <ellipse cx="100" cy="148" rx="70" ry="8" fill="#f3f4f6" />
      <circle cx="88" cy="72" r="44" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
      <circle cx="88" cy="72" r="30" fill="#dbeafe" />
      <path d="M72 72a16 16 0 0 1 16-16" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
      <path d="M122 110 l24 24" stroke="#6b7280" strokeWidth="4" strokeLinecap="round" />
      <circle cx="122" cy="110" r="4" fill="#9ca3af" />
    </svg>
  ),
  saved: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      <ellipse cx="100" cy="148" rx="70" ry="8" fill="#f3f4f6" />
      <rect x="50" y="30" width="100" height="110" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
      <rect x="65" y="50" width="70" height="6" rx="3" fill="#bfdbfe" />
      <rect x="65" y="65" width="50" height="5" rx="2.5" fill="#dbeafe" />
      <path d="M80 95 L100 112 L120 95 L120 78 Q120 75 117 75 L83 75 Q80 75 80 78 Z" fill="#3b82f6" opacity="0.8" />
    </svg>
  ),
  applications: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      <ellipse cx="100" cy="148" rx="70" ry="8" fill="#f3f4f6" />
      <rect x="40" y="40" width="120" height="90" rx="10" fill="#f5f3ff" stroke="#ddd6fe" strokeWidth="2" />
      <rect x="55" y="60" width="90" height="7" rx="3.5" fill="#ddd6fe" />
      <rect x="55" y="77" width="60" height="5" rx="2.5" fill="#ede9fe" />
      <rect x="55" y="92" width="75" height="5" rx="2.5" fill="#ede9fe" />
      <circle cx="148" cy="42" r="16" fill="#8b5cf6" />
      <path d="M140 42 l5 5 9-10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  jobs: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      <ellipse cx="100" cy="148" rx="70" ry="8" fill="#f3f4f6" />
      <rect x="45" y="35" width="110" height="95" rx="10" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
      <rect x="60" y="55" width="80" height="7" rx="3.5" fill="#bbf7d0" />
      <rect x="60" y="72" width="55" height="5" rx="2.5" fill="#dcfce7" />
      <rect x="60" y="87" width="65" height="5" rx="2.5" fill="#dcfce7" />
      <circle cx="100" cy="118" r="8" fill="#22c55e" />
      <path d="M96 118 l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      <ellipse cx="100" cy="148" rx="70" ry="8" fill="#f3f4f6" />
      <rect x="30" y="40" width="130" height="80" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="2" />
      <path d="M60 140 L72 120 H138 Q150 120 150 108 V52 Q150 40 138 40 H62 Q50 40 50 52 V108 Q50 120 60 120 Z" fill="#fff7ed" stroke="#fed7aa" strokeWidth="2" />
      <rect x="68" y="68" width="64" height="5" rx="2.5" fill="#fed7aa" />
      <rect x="68" y="83" width="44" height="5" rx="2.5" fill="#ffedd5" />
    </svg>
  ),
  generic: (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-40 h-32">
      <ellipse cx="100" cy="148" rx="70" ry="8" fill="#f3f4f6" />
      <circle cx="100" cy="75" r="45" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="2" />
      <path d="M85 75 h30 M100 60 v30" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({ illustration = 'generic', title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="mb-4 opacity-90">{illustrations[illustration]}</div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs mb-4">{description}</p>}
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
