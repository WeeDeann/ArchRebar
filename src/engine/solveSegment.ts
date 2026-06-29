import { deriveWarnings } from './segmentArc';
import type { SegmentParams, SolveResult } from './types';

export type Quantity = 'chord' | 'rise' | 'radius' | 'arc' | 'angle';

/** Canonical knowns: lengths in millimetres, angle in radians. Provide exactly two. */
export interface Knowns {
  chord?: number;
  rise?: number;
  radius?: number;
  arc?: number;
  angle?: number;
}

const TWO_PI = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function labelFor(q: Quantity): string {
  return { chord: 'Chord', rise: 'Rise', radius: 'Radius', arc: 'Arc length', angle: 'Angle' }[q];
}

/** Build the full parameter set from the canonical pair (radius, central angle). */
function paramsFromRadiusAngle(radius: number, angle: number): SegmentParams {
  const chord = 2 * radius * Math.sin(angle / 2);
  const rise = radius * (1 - Math.cos(angle / 2));
  return {
    chord,
    rise,
    radius,
    arcLength: radius * angle,
    centralAngle: angle,
    centerOffset: radius - rise,
  };
}

/** Bisection root-find for a function with a single sign change on [lo, hi]. */
function bisect(f: (t: number) => number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  let fa = f(a);
  for (let i = 0; i < 90; i++) {
    const m = (a + b) / 2;
    const fm = f(m);
    if (fa * fm <= 0) {
      b = m;
    } else {
      a = m;
      fa = fm;
    }
  }
  return (a + b) / 2;
}

/**
 * Solve a circular segment from any two of {chord, rise, radius, arc, angle}. Reduces the pair to
 * the canonical (radius, central angle), then derives the rest. Closed-form for most pairs;
 * chord+arc and rise+arc need a numeric root-find on the angle.
 */
export function solveSegment(known: Knowns): SolveResult<SegmentParams> {
  const order: Quantity[] = ['chord', 'rise', 'radius', 'arc', 'angle'];
  const present = order.filter((k) => known[k] !== undefined && Number.isFinite(known[k]));

  if (present.length < 2) {
    return {
      ok: false,
      params: null,
      warnings: [],
      errors: ['Enter any two values to calculate the rest.'],
    };
  }

  const errors: string[] = [];
  for (const k of present) {
    if ((known[k] as number) <= 0) errors.push(`${labelFor(k)} must be greater than zero.`);
  }
  if (errors.length > 0) return { ok: false, params: null, warnings: [], errors };

  const { chord: c, rise: h, radius: r, arc: L, angle: a } = known;
  let radius = NaN;
  let angle = NaN;

  if (a !== undefined) {
    angle = a;
    if (r !== undefined) radius = r;
    else if (L !== undefined) radius = L / a;
    else if (c !== undefined) radius = c / (2 * Math.sin(a / 2));
    else if (h !== undefined) radius = h / (1 - Math.cos(a / 2));
  } else if (r !== undefined) {
    radius = r;
    if (L !== undefined) {
      angle = L / r;
    } else if (c !== undefined) {
      if (c > 2 * r) errors.push('Chord cannot exceed twice the radius.');
      else angle = 2 * Math.asin(clamp(c / (2 * r), -1, 1));
    } else if (h !== undefined) {
      if (h > 2 * r) errors.push('Rise cannot exceed twice the radius.');
      else angle = 2 * Math.acos(clamp((r - h) / r, -1, 1));
    }
  } else if (c !== undefined && h !== undefined) {
    radius = (c * c + 4 * h * h) / (8 * h);
    angle = 2 * Math.atan2(c / 2, radius - h);
  } else if (c !== undefined && L !== undefined) {
    if (L <= c) errors.push('Arc length must be greater than the chord.');
    else {
      angle = bisect((t) => (c * t) / (2 * Math.sin(t / 2)) - L, 1e-6, TWO_PI - 1e-6);
      radius = c / (2 * Math.sin(angle / 2));
    }
  } else if (h !== undefined && L !== undefined) {
    if (L < h * Math.PI) errors.push('Arc length is too short for this rise.');
    else {
      angle = bisect((t) => (h * t) / (1 - Math.cos(t / 2)) - L, 1e-6, Math.PI);
      radius = h / (1 - Math.cos(angle / 2));
    }
  }

  if (errors.length > 0) return { ok: false, params: null, warnings: [], errors };
  if (!Number.isFinite(radius) || !Number.isFinite(angle) || radius <= 0 || angle <= 0 || angle >= TWO_PI) {
    return {
      ok: false,
      params: null,
      warnings: [],
      errors: ['These values do not form a valid arc.'],
    };
  }

  const params = paramsFromRadiusAngle(radius, angle);
  return { ok: true, params, warnings: deriveWarnings(params), errors: [] };
}
