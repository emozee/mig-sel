export type ShopSettings = {
  id: boolean;
  enabled: boolean;
  starts_at: string | null;
  ends_at: string | null;
  nu_per_point: number;
  delivery_message: string;
  updated_at: string;
};

export type ShopCard = {
  id: string;
  title: string;
  description: string;
  operator: 'bmobile' | 'tashicell';
  recharge_type: 'data' | 'talktime';
  enabled: boolean;
  sort_order: number;
  pricing_mode: 'rate' | 'fixed';
  fixed_points: number | null;
  fixed_nu: number | null;
  package_amounts: number[];
  min_nu: number;
  max_nu: number;
  updated_at: string;
};

export type Redemption = {
  id: string;
  user_id: string;
  card_title: string;
  operator: ShopCard['operator'];
  recharge_type: ShopCard['recharge_type'];
  phone: string;
  points: number;
  amount_nu: number;
  status: 'pending' | 'processing' | 'delivered' | 'refunded';
  created_at: string;
  note: string;
  bank_reference: string | null;
};

export type Delivery = {
  masked_phone?: string;
  recipient_label?: string;
  operator?: ShopCard['operator'];
  recharge_type?: ShopCard['recharge_type'];
  amount_nu?: number;
  delivered_at: string;
  /** Future non-recharge rewards can supply their own public-facing description. */
  reward_label?: string;
};
