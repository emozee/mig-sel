import { describe, expect, it } from 'vitest';
import { normalizeBhutanLocation } from '@/lib/bhutan-locations';

describe('normalizeBhutanLocation', () => {
  it('normalizes geocoder suffixes and common aliases', () => {
    expect(normalizeBhutanLocation('Thimphu District')).toBe('Thimphu');
    expect(normalizeBhutanLocation('Pema Gatshel Dzongkhag')).toBe('Pemagatshel');
    expect(normalizeBhutanLocation('Chukha')).toBe('Chhukha');
  });
});
