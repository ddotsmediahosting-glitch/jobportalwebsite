import { formatDistanceToNow, parseISO } from 'date-fns';
import { EMIRATE_LABELS, WORK_MODE_LABELS, EMPLOYMENT_TYPE_LABELS } from '../constants';
import { Emirate, WorkMode, EmploymentType } from '../types';

export function formatSalary(min?: number | null, max?: number | null, currency = 'AED'): string {
  if (!min && !max) return 'Salary not disclosed';
  const fmt = (n: number) =>
    n >= 1000 ? `${currency} ${(n / 1000).toFixed(0)}K` : `${currency} ${n}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}/mo`;
  if (min) return `From ${fmt(min)}/mo`;
  return `Up to ${fmt(max!)}/mo`;
}

export function formatEmirate(emirate: Emirate): string {
  return EMIRATE_LABELS[emirate] ?? emirate;
}

export function formatWorkMode(mode: WorkMode): string {
  return WORK_MODE_LABELS[mode] ?? mode;
}

export function formatEmploymentType(type: EmploymentType): string {
  return EMPLOYMENT_TYPE_LABELS[type] ?? type;
}

export function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
