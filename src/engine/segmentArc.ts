import { arcLength, centralAngle, radiusFromChordRise } from './math';
import type {
  ArcGeometry,
  Point2D,
  QcMark,
  SegmentInputs,
  SegmentParams,
  ShapeSolver,
  SolveResult,
  Warning,
} from './types';

/** Below this rise/chord ratio the bar is, for practical purposes, straight. */
const STRAIGHT_RISE_RATIO = 0.005;
const ANGLE_EPS = 1e-4;
const ARC_SAMPLES = 96;

/** Warnings derived purely from a solved segment — shared by every entry point. */
export function deriveWarnings(params: SegmentParams): Warning[] {
  const warnings: Warning[] = [];
  if (params.rise / params.chord < STRAIGHT_RISE_RATIO) {
    warnings.push({
      code: 'EFFECTIVELY_STRAIGHT',
      message:
        'Very shallow curve — the radius is large. This bar may be supplied straight and sprung to shape on site.',
    });
  }
  if (Math.abs(params.centralAngle - Math.PI) < ANGLE_EPS) {
    warnings.push({ code: 'SEMICIRCLE', message: 'This bar is a half-circle (semicircle).' });
  } else if (params.centralAngle > Math.PI) {
    warnings.push({
      code: 'REFLEX_ARC',
      message: 'Rise exceeds the radius — this arc is more than a semicircle.',
    });
  }
  return warnings;
}

function solve(inputs: SegmentInputs): SolveResult<SegmentParams> {
  const { chord, rise } = inputs;
  const errors: string[] = [];

  if (!Number.isFinite(chord) || chord <= 0) errors.push('Chord must be greater than zero.');
  if (!Number.isFinite(rise) || rise <= 0) errors.push('Rise must be greater than zero.');
  if (errors.length > 0) return { ok: false, params: null, warnings: [], errors };

  const radius = radiusFromChordRise(chord, rise);
  const angle = centralAngle(chord, radius, rise);
  const params: SegmentParams = {
    chord,
    rise,
    radius,
    arcLength: arcLength(radius, angle),
    centralAngle: angle,
    centerOffset: radius - rise,
  };

  return { ok: true, params, warnings: deriveWarnings(params), errors: [] };
}

function toGeometry(params: SegmentParams, marks: QcMark[]): ArcGeometry {
  const { chord, rise, radius, centralAngle: angle, centerOffset } = params;
  const half = chord / 2;

  // SVG coordinates (y DOWN). Circle centre sits at (0, centerOffset). A point at angular offset
  // s from the apex direction is (R·sin s, centerOffset − R·cos s), for s ∈ [−θ/2, θ/2]. This
  // parametrisation passes through the apex by construction, so it is robust for every arc.
  const polyline: Point2D[] = [];
  for (let i = 0; i <= ARC_SAMPLES; i++) {
    const s = -angle / 2 + (i / ARC_SAMPLES) * angle;
    polyline.push({ x: radius * Math.sin(s), y: centerOffset - radius * Math.cos(s) });
  }

  return {
    chordStart: { x: -half, y: 0 },
    chordEnd: { x: half, y: 0 },
    apex: { x: 0, y: -rise },
    polyline,
    stations: marks.map((m) => ({
      foot: { x: m.xFromCenter, y: 0 },
      head: { x: m.xFromCenter, y: -m.offset },
      label: m.label,
    })),
  };
}

export const segmentArcSolver: ShapeSolver<SegmentInputs, SegmentParams> = {
  id: 'SEGMENT_ARC',
  label: 'Circular arch (segment)',
  solve,
  toGeometry,
};
