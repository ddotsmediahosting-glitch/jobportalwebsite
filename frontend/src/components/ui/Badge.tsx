import React from 'react';

type Color = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange' | 'teal' | 'indigo' | 'pink';

const colorClasses: Record<Color, string> = {
  blue:   'bg-blue-50 text-blue-700 border border-blue-100',
  green:  'bg-emerald-50 text-emerald-700 border border-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 border border-amber-100',
  red:    'bg-red-50 text-red-700 border border-red-100',
  gray:   'bg-gray-50 text-gray-600 border border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border border-purple-100',
  orange: 'bg-orange-50 text-orange-700 border border-orange-100',
  teal:   'bg-teal-50 text-teal-700 border border-teal-100',
  indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  pink:   'bg-pink-50 text-pink-700 border border-pink-100',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function Badge({ children, color = 'gray', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
        ${colorClasses[color]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Status badge mapping
export function ApplicationStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: Color; label: string }> = {
    SUBMITTED: { color: 'blue', label: 'Submitted' },
    VIEWED: { color: 'purple', label: 'Viewed' },
    SHORTLISTED: { color: 'yellow', label: 'Shortlisted' },
    INTERVIEW: { color: 'orange', label: 'Interview' },
    OFFER: { color: 'green', label: 'Offer' },
    HIRED: { color: 'green', label: 'Hired' },
    REJECTED: { color: 'red', label: 'Rejected' },
    WITHDRAWN: { color: 'gray', label: 'Withdrawn' },
  };

  const { color, label } = map[status] || { color: 'gray', label: status };
  return <Badge color={color}>{label}</Badge>;
}

export function JobStatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: Color; label: string }> = {
    DRAFT: { color: 'gray', label: 'Draft' },
    PENDING_APPROVAL: { color: 'yellow', label: 'Pending Review' },
    PUBLISHED: { color: 'green', label: 'Published' },
    PAUSED: { color: 'orange', label: 'Paused' },
    EXPIRED: { color: 'red', label: 'Expired' },
    CLOSED: { color: 'red', label: 'Closed' },
    REJECTED: { color: 'red', label: 'Rejected' },
  };

  const { color, label } = map[status] || { color: 'gray', label: status };
  return <Badge color={color}>{label}</Badge>;
}

export function VerificationBadge({ status }: { status: string }) {
  const map: Record<string, { color: Color; label: string }> = {
    PENDING: { color: 'yellow', label: 'Pending Verification' },
    APPROVED: { color: 'green', label: 'Verified' },
    REJECTED: { color: 'red', label: 'Rejected' },
  };

  const { color, label } = map[status] || { color: 'gray', label: status };
  return <Badge color={color}>{label}</Badge>;
}
