import React from 'react';

type Color = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'orange';

const colorClasses: Record<Color, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

interface BadgeProps {
  children: React.ReactNode;
  color?: Color;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, color = 'gray', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
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
