import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  arcLength,
  centralAngle,
  chordFromRiseRadius,
  offsetAt,
  radiusFromChordRise,
  riseFromChordRadius,
} from './math';

describe('circular-segment geometry', () => {
  it('matches the canonical worked example (c=3000, h=500)', () => {
    const R = radiusFromChordRise(3000, 500);
    expect(R).toBeCloseTo(2500, 6);
    const theta = centralAngle(3000, R, 500);
    expect(theta).toBeCloseTo(1.287002, 5);
    expect(arcLength(R, theta)).toBeCloseTo(3217.506, 2);
    expect(offsetAt(750, R, R - 500)).toBeCloseTo(384.848, 2);
  });

  it('offset equals the rise at the apex and zero at the ends', () => {
    const c = 4200;
    const h = 900;
    const R = radiusFromChordRise(c, h);
    const d = R - h;
    expect(offsetAt(0, R, d)).toBeCloseTo(h, 6);
    expect(offsetAt(c / 2, R, d)).toBeCloseTo(0, 6);
    expect(offsetAt(-c / 2, R, d)).toBeCloseTo(0, 6);
  });

  it('handles an exact semicircle (rise = radius)', () => {
    const c = 2000;
    const h = 1000;
    const R = radiusFromChordRise(c, h);
    expect(R).toBeCloseTo(1000, 6);
    expect(centralAngle(c, R, h)).toBeCloseTo(Math.PI, 6);
  });

  it('detects a reflex arc (rise > radius gives θ > π)', () => {
    const c = 2000;
    const h = 1500;
    const R = radiusFromChordRise(c, h);
    expect(h).toBeGreaterThan(R);
    expect(centralAngle(c, R, h)).toBeGreaterThan(Math.PI);
  });

  it('round-trips chord ⇄ radius for minor segments (property)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 10000, noNaN: true }),
        fc.double({ min: 0.02, max: 0.5, noNaN: true }),
        (chord, ratio) => {
          const rise = chord * ratio; // ratio ≤ 0.5 keeps R ≥ rise (minor segment)
          const R = radiusFromChordRise(chord, rise);
          // Relative tolerances: the inverse riseFromChordRadius is naturally ill-conditioned
          // near the semicircle (R²−(c/2)² → 0), so an absolute tolerance is inappropriate here.
          expect(Math.abs(chordFromRiseRadius(rise, R) - chord)).toBeLessThan(1e-6 * chord + 1e-7);
          expect(Math.abs(riseFromChordRadius(chord, R) - rise)).toBeLessThan(1e-5 * rise + 1e-7);
        },
      ),
    );
  });
});
