import type { WasteCategory } from '@/features/waste/types';

export const CATEGORIES: { value: WasteCategory; label: string; color: string }[] = [
  { value: 'organic-food', label: 'Organic/Food waste', color: '#16a34a' },
  { value: 'paper-cardboard', label: 'Paper & Cardboard', color: '#2563eb' },
  { value: 'plastic-soft-packaging', label: 'Plastic soft packaging', color: '#d97706' },
  { value: 'plastic-pet-hdpe', label: 'Plastic (PET&HDPE)', color: '#dc2626' },
  { value: 'textile', label: 'Textile', color: '#9333ea' },
  { value: 'glass', label: 'Glass', color: '#0891b2' },
  { value: 'metal-aluminum', label: 'Metal, Aluminum', color: '#4f46e5' },
  { value: 'e-waste', label: 'E-waste', color: '#ea580c' },
  { value: 'infectious-waste', label: 'Infectious waste', color: '#be123c' },
  { value: 'leather-rubber', label: 'Leather, Rubber', color: '#78716c' },
  { value: 'wood', label: 'Wood', color: '#a16207' },
  { value: 'sanitary-waste', label: 'Sanitary waste', color: '#64748b' },
  { value: 'green-plant-materials', label: 'Green plant materials', color: '#15803d' },
  { value: 'construction-demolition', label: 'Construction & Demolition wastes', color: '#92400e' },
];

export const CATEGORY_LABELS: Record<WasteCategory, string> = {
  'organic-food': 'Organic/Food waste',
  'paper-cardboard': 'Paper & Cardboard',
  'plastic-soft-packaging': 'Plastic soft packaging',
  'plastic-pet-hdpe': 'Plastic (PET&HDPE)',
  textile: 'Textile',
  glass: 'Glass',
  'metal-aluminum': 'Metal, Aluminum',
  'e-waste': 'E-waste',
  'infectious-waste': 'Infectious waste',
  'leather-rubber': 'Leather, Rubber',
  wood: 'Wood',
  'sanitary-waste': 'Sanitary waste',
  'green-plant-materials': 'Green plant materials',
  'construction-demolition': 'Construction & Demolition wastes',
};

export const CATEGORY_COLORS: Record<WasteCategory, string> = {
  'organic-food': '#16a34a',
  'paper-cardboard': '#2563eb',
  'plastic-soft-packaging': '#d97706',
  'plastic-pet-hdpe': '#dc2626',
  textile: '#9333ea',
  glass: '#0891b2',
  'metal-aluminum': '#4f46e5',
  'e-waste': '#ea580c',
  'infectious-waste': '#be123c',
  'leather-rubber': '#78716c',
  wood: '#a16207',
  'sanitary-waste': '#64748b',
  'green-plant-materials': '#15803d',
  'construction-demolition': '#92400e',
};
