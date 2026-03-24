import { Emirate, WorkMode, EmploymentType } from '../types';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://ddotsmediajobs.com/api/v1';

export const APP_URL =
  process.env.EXPO_PUBLIC_APP_URL ?? 'https://ddotsmediajobs.com';

// ── Brand colours (match web Tailwind config) ─────────────────────────────────
export const COLORS = {
  brand: {
    50:  '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#1a56db',
    700: '#1e40af',
  },
  gold: '#fbbf24',
  gray: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
  white: '#ffffff',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

// ── Label maps ────────────────────────────────────────────────────────────────
export const EMIRATE_LABELS: Record<Emirate, string> = {
  ABU_DHABI:     'Abu Dhabi',
  DUBAI:         'Dubai',
  SHARJAH:       'Sharjah',
  AJMAN:         'Ajman',
  UMM_AL_QUWAIN: 'Umm Al Quwain',
  RAS_AL_KHAIMAH:'Ras Al Khaimah',
  FUJAIRAH:      'Fujairah',
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  ONSITE: 'On-site',
  HYBRID: 'Hybrid',
  REMOTE: 'Remote',
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME:   'Full Time',
  PART_TIME:   'Part Time',
  CONTRACT:    'Contract',
  TEMPORARY:   'Temporary',
  INTERNSHIP:  'Internship',
  FREELANCE:   'Freelance',
};

// ── Query keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  jobs:          'jobs',
  jobDetail:     'job-detail',
  categories:    'categories',
  savedJobs:     'saved-jobs',
  applications:  'applications',
  profile:       'seeker-profile',
  notifications: 'notifications',
  companies:     'companies',
  companyDetail: 'company-detail',
} as const;
