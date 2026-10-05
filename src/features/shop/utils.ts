import type { ShopCard, ShopSettings } from './types';

export const operatorName = (operator: ShopCard['operator']) =>
  operator === 'bmobile' ? 'B-Mobile' : 'TashiCell';

export function normalizePhone(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  return `+${digits.startsWith('975') ? digits : `975${digits}`}`;
}

export function promotionOpen(settings: ShopSettings, now = Date.now()) {
  return (
    settings.enabled &&
    !!settings.starts_at &&
    !!settings.ends_at &&
    now >= Date.parse(settings.starts_at) &&
    now < Date.parse(settings.ends_at)
  );
}

// The database uses NUMERIC; integer-scaled arithmetic mirrors its 4-decimal rate.
export function rechargeAmount(points: number, card: ShopCard, rate: number) {
  return card.pricing_mode === 'fixed'
    ? (card.fixed_nu ?? 0)
    : (points * Math.round(rate * 10000)) / 10000;
}

export function validateRecharge(
  points: number,
  phone: string,
  card: ShopCard,
  rate: number,
  balance: number,
) {
  if (!Number.isSafeInteger(points) || points <= 0 || points > 2147483647)
    return 'Enter a positive whole number of points.';
  if (points > balance) return 'Not enough redeemable points.';
  if (card.pricing_mode === 'fixed' && points !== card.fixed_points)
    return 'Use this card’s displayed point price.';
  const pattern = card.operator === 'bmobile' ? /^\+975(17|16)\d{6}$/ : /^\+975(77|78)\d{6}$/;
  if (!pattern.test(normalizePhone(phone)))
    return 'Enter an eight-digit mobile number for this operator.';
  const amount = rechargeAmount(points, card, rate);
  if (!Number.isInteger(amount) || amount < card.min_nu || amount > card.max_nu) {
    return `Choose points worth a whole Nu. amount between ${card.min_nu} and ${card.max_nu}.`;
  }
  if (card.recharge_type === 'data' && !card.package_amounts.includes(amount))
    return 'Choose an available data package amount.';
  return null;
}

export const bhutanDate = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Thimphu',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function toBhutanInput(value: string | null) {
  return value ? new Date(Date.parse(value) + 6 * 3600000).toISOString().slice(0, 16) : '';
}

export const fromBhutanInput = (value: string) =>
  value ? new Date(`${value}:00+06:00`).toISOString() : null;
