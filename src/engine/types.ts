export type ShapeId = 'SEGMENT_ARC';

/** Inputs for a single circular segment. All lengths are in millimetres (the canonical base unit). */
export interface SegmentInputs {
  /** Straight-line span between the two ends of the bar. */
  chord: number;
  /** Peak height (sagitta) measured from the chord up to the arc. */
  rise: number;
}

/** Fully solved geometry. Lengths in millimetres, angles in radians. */
export interface SegmentParams {
  chord: number;
  rise: number;
  /** Centre-to-centre bending radius, R. */
  radius: number;
  /** True developed length of the bar (cutting length), L = R·θ. */
  arcLength: number;
  /** Angle subtended at the centre by the chord, θ. */
  centralAngle: number;
  /** Perpendicular distance from the chord to the circle centre, d = R − rise. */
  centerOffset: number;
}

export type WarningCode = 'EFFECTIVELY_STRAIGHT' | 'SEMICIRCLE' | 'REFLEX_ARC';

export interface Warning {
  code: WarningCode;
  message: string;
}

/** Where to place measuring marks along the chord (one unit; no geometry yet). */
export interface StationLayout {
  /** Distances of each mark from the left end. */
  positions: number[];
  /** Running gaps including both ends: [endGap, interval, …, interval, endGap]. */
  gaps: number[];
  endLeft: number;
  endRight: number;
}

/** A single shop-floor check: a labelled mark and the height to read there. */
export interface QcMark {
  /** Sequential label, 'A', 'B', 'C', … left to right. */
  label: string;
  /** Distance of the mark from the left end (mm). */
  fromEnd: number;
  /** Distance from the previous mark — the end gap for the first mark (mm). */
  step: number;
  /** Signed horizontal distance from the chord midpoint (mm). */
  xFromCenter: number;
  /** Perpendicular height from the chord up to the arc at this mark (mm). */
  offset: number;
}

export interface QcLayout {
  marks: QcMark[];
  /** Running spacing across the whole chord, e.g. [250, 500, 500, 500, 500, 250]. */
  gaps: number[];
  intervalMm: number;
}

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Drawing geometry in SVG coordinates: origin at the chord midpoint, x to the right, y DOWN —
 * so the arc bulges towards negative y. Consumed directly by the diagram renderer.
 */
export interface ArcGeometry {
  chordStart: Point2D;
  chordEnd: Point2D;
  apex: Point2D;
  /** Sampled points along the arc, ready to join as a polyline. */
  polyline: Point2D[];
  /** Drop-lines for each QC mark: foot on the chord, head on the arc, with its label. */
  stations: { foot: Point2D; head: Point2D; label: string }[];
}

export interface SolveResult<P> {
  ok: boolean;
  params: P | null;
  warnings: Warning[];
  errors: string[];
}

/**
 * Contract every shape implements. New shapes (reverse curves, multi-radius arches, full rings,
 * standard shape codes…) plug into the registry by implementing this — nothing else changes.
 */
export interface ShapeSolver<I, P> {
  id: ShapeId;
  label: string;
  solve(inputs: I): SolveResult<P>;
  toGeometry(params: P, marks: QcMark[]): ArcGeometry;
}
