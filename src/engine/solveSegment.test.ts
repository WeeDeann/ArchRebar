import { describe, expect, it } from 'vitest';
import { solveSegment } from './solveSegment';

const C = 3000;
const H = 500;
const R = 2500;
const L = 3217.5055;
const A = 1.2870022; // radians

describe('solveSegment — any two values give the same segment', () => {
  const expectCanonical = (params: { chord: number; rise: number; radius: number; arcLength: number }) => {
    expect(params.chord).toBeCloseTo(C, 2);
    expect(params.rise).toBeCloseTo(H, 2);
    expect(params.radius).toBeCloseTo(R, 2);
    expect(params.arcLength).toBeCloseTo(L, 1);
  };

  it('chord + rise', () => {
    const res = solveSegment({ chord: C, rise: H });
    expect(res.ok).toBe(true);
    expectCanonical(res.params!);
  });

  it('radius + chord → rise (the requested flow)', () => {
    const res = solveSegment({ radius: R, chord: C });
    expect(res.ok).toBe(true);
    expect(res.params!.rise).toBeCloseTo(H, 2);
  });

  it('radius + rise', () => {
    expectCanonical(solveSegment({ radius: R, rise: H }).params!);
  });

  it('radius + arc', () => {
    expectCanonical(solveSegment({ radius: R, arc: L }).params!);
  });

  it('angle + radius', () => {
    expectCanonical(solveSegment({ angle: A, radius: R }).params!);
  });

  it('chord + arc (numeric)', () => {
    expectCanonical(solveSegment({ chord: C, arc: L }).params!);
  });

  it('rise + arc (numeric)', () => {
    expectCanonical(solveSegment({ rise: H, arc: L }).params!);
  });
});

describe('solveSegment — validation', () => {
  it('needs at least two values', () => {
    const res = solveSegment({ chord: 3000 });
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('rejects chord greater than twice the radius', () => {
    const res = solveSegment({ radius: 1000, chord: 3000 });
    expect(res.ok).toBe(false);
  });

  it('rejects non-positive values', () => {
    const res = solveSegment({ chord: -1, rise: 500 });
    expect(res.ok).toBe(false);
  });
});
