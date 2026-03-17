import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  viewAllTo?: string;
  viewAllLabel?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, viewAllTo, viewAllLabel = 'View all' }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="hidden sm:flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium group flex-shrink-0"
        >
          {viewAllLabel}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
