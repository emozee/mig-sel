import { describe, expect, it } from 'vitest';
import {
  fromBhutanInput,
  normalizePhone,
  promotionOpen,
  rechargeAmount,
  toBhutanInput,
  validateRecharge,
} from '@/features/shop/utils';
import type { ShopCard, ShopSettings } from '@/features/shop/types';

const card: ShopCard = {
  id: 'card',
  title: 'Data',
  description: '',
  operator: 'tashicell',
  recharge_type: 'data',
  enabled: true,
  sort_order: 0,
  pricing_mode: 'rate',
  fixed_points: null,
  fixed_nu: null,
  package_amounts: [19, 49, 99, 777],
  min_nu: 1,
  max_nu: 10000,
  updated_at: '',
};

describe('recharge pricing and eligibility', () => {
  it('accepts the TashiCell 777 package and normalizes local numbers', () => {
    expect(normalizePhone('77 123 456')).toBe('+97577123456');
    expect(validateRecharge(777, '77123456', card, 1, 800)).toBeNull();
    expect(validateRecharge(777, '17123456', card, 1, 800)).toMatch(/operator/);
  });
  it('rejects fractional points, unsupported packages and overspending', () => {
    expect(validateRecharge(9.9, '77123456', card, 10, 100)).toMatch(/whole/);
    expect(validateRecharge(50, '77123456', card, 1, 100)).toMatch(/package/);
    expect(validateRecharge(99, '77123456', card, 1, 98)).toMatch(/enough/);
  });
  it('uses exact scaled rate arithmetic and does not round fractional rewards', () => {
    expect(rechargeAmount(190, card, 0.1)).toBe(19);
    expect(validateRecharge(190, '77123456', card, 0.1, 200)).toBeNull();
    expect(validateRecharge(191, '77123456', card, 0.1, 200)).toMatch(/whole Nu/);
  });
  it('keeps fixed-card pricing independent from the global rate', () => {
    const fixed = { ...card, pricing_mode: 'fixed' as const, fixed_points: 20, fixed_nu: 99 };
    expect(rechargeAmount(20, fixed, 5)).toBe(99);
    expect(validateRecharge(20, '77123456', fixed, 5, 20)).toBeNull();
    expect(validateRecharge(19, '77123456', fixed, 5, 20)).toMatch(/displayed/);
  });
  it('allows talk time independently of the last digit', () => {
    const talk = { ...card, recharge_type: 'talktime' as const };
    expect(validateRecharge(50, '77123456', talk, 1, 100)).toBeNull();
    expect(validateRecharge(49, '77123456', talk, 1, 100)).toBeNull();
  });
  it('uses Bhutan time regardless of the admin browser timezone', () => {
    expect(fromBhutanInput('2026-10-04T12:00')).toBe('2026-10-04T06:00:00.000Z');
    expect(toBhutanInput('2026-10-04T06:00:00Z')).toBe('2026-10-04T12:00');
  });
  it('closes at the exact end and respects pause', () => {
    const settings: ShopSettings = {
      id: true,
      enabled: true,
      starts_at: '2026-10-01T00:00:00Z',
      ends_at: '2026-11-01T00:00:00Z',
      nu_per_point: 1,
      delivery_message: '',
      updated_at: '',
    };
    expect(promotionOpen(settings, Date.parse(settings.starts_at!))).toBe(true);
    expect(promotionOpen(settings, Date.parse(settings.ends_at!))).toBe(false);
    expect(promotionOpen({ ...settings, enabled: false }, Date.parse(settings.starts_at!))).toBe(
      false,
    );
  });
});
