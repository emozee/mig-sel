export type WasteCategory =
  | 'organic-food'
  | 'paper-cardboard'
  | 'plastic-soft-packaging'
  | 'plastic-pet-hdpe'
  | 'textile'
  | 'glass'
  | 'metal-aluminum'
  | 'e-waste'
  | 'infectious-waste'
  | 'leather-rubber'
  | 'wood'
  | 'sanitary-waste'
  | 'green-plant-materials'
  | 'construction-demolition';

export type WasteRecord = {
  id: string;
  category: WasteCategory;
  quantity: number;
  unit: string;
  reportedAt: string;
  collectedAt: string | null;
  deletedAt: string | null;
  deletionReason: string | null;
  editCount: number;
  notes: string | null;
};
