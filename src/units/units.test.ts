import { describe, expect, it } from 'vitest';
import { formatLength, toDisplay, toMillimetres } from './units';

describe('unit conversion', () => {
  it('round-trips mm → inches → mm', () => {
    for (const mm of [0, 1, 25.4, 100, 3217.5]) {
      expect(toMillimetres(toDisplay(mm, 'imperial'), 'imperial')).toBeCloseTo(mm, 9);
    }
  });

  it('1 inch equals 25.4 mm', () => {
    expect(toMillimetres(1, 'imperial')).toBeCloseTo(25.4, 9);
    expect(toDisplay(25.4, 'imperial')).toBeCloseTo(1, 9);
  });

  it('formats with unit labels and rounding', () => {
    expect(formatLength(2500, 'metric', { step: 1, decimals: 0 })).toBe('2500 mm');
    expect(formatLength(25.4, 'imperial', { decimals: 2 })).toBe('1.00 in');
  });
});
