import type {
  ComplaintCategory,
  ComplaintUrgency,
  ComplaintStatus,
} from '@/features/complaint/types';

export const URGENCY_ORDER: Record<ComplaintUrgency, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export const URGENCY_BADGE: Record<ComplaintUrgency, { bg: string; text: string }> = {
  high: { bg: '#fff7ed', text: '#f97316' },
  medium: { bg: '#eff6ff', text: '#3b82f6' },
  low: { bg: '#f0fdf4', text: '#22c55e' },
};

export const URGENCY_BADGE_WITH_HOVER: Record<
  ComplaintUrgency,
  { bg: string; text: string; hoverBg: string }
> = {
  high: { bg: '#fff7ed', text: '#f97316', hoverBg: '#ffedd5' },
  medium: { bg: '#eff6ff', text: '#3b82f6', hoverBg: '#dbeafe' },
  low: { bg: '#f0fdf4', text: '#22c55e', hoverBg: '#dcfce7' },
};

export const STATUS_BADGE: Record<ComplaintStatus, { bg: string; text: string }> = {
  pending: { bg: '#fff7ed', text: '#f97316' },
  'in-progress': { bg: '#eff6ff', text: '#3b82f6' },
  resolved: { bg: '#f0fdf4', text: '#22c55e' },
};

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  road: 'Road',
  garbage: 'Garbage',
  lighting: 'Lighting',
  drainage: 'Drainage',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<ComplaintCategory, string> = {
  road: '#78716c',
  garbage: '#0d9488',
  lighting: '#b45309',
  drainage: '#1d4ed8',
  other: '#6d28d9',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
};

export const URGENCY_LABELS: Record<ComplaintUrgency, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const STATUS_URGENCY_ORDER: ComplaintUrgency[] = ['low', 'medium', 'high'];

export const STATUS_ORDER: ComplaintStatus[] = ['pending', 'in-progress', 'resolved'];
