/**
 * Pure circular-segment geometry. No units, no I/O, no framework — the single source of
 * mathematical truth for the app. All lengths share one unit; angles are in radians.
 */

/** Radius of the circle from chord c and rise (sagitta) h. Requires h > 0. */
export function radiusFromChordRise(chord: number, rise: number): number {
  return (chord * chord + 4 * rise * rise) / (8 * rise);
}

/**
 * Central angle θ subtended by the chord. Uses atan2 so it stays correct and numerically stable
 * for every arc — shallow, the exact semicircle (d = 0), and reflex arcs (θ > π) — which a plain
 * `2·asin(c/2R)` does not.
 */
export function centralAngle(chord: number, radius: number, rise: number): number {
  return 2 * Math.atan2(chord / 2, radius - rise);
}

/** Arc (developed / cutting) length. */
export function arcLength(radius: number, angle: number): number {
  return radius * angle;
}

/**
 * Perpendicular offset from the chord baseline up to the arc at horizontal distance x from the
 * chord midpoint. offset(0) = rise; offset(±c/2) = 0. `centerOffset` is d = R − rise.
 */
export function offsetAt(x: number, radius: number, centerOffset: number): number {
  const inside = radius * radius - x * x;
  return Math.sqrt(Math.max(0, inside)) - centerOffset;
}

/* ── Inversions: "solve from any valid pair" (engine completeness) ──────────────────────── */

/** Rise of the minor segment from chord c and radius R. Requires R ≥ c/2. */
export function riseFromChordRadius(chord: number, radius: number): number {
  const half = chord / 2;
  return radius - Math.sqrt(Math.max(0, radius * radius - half * half));
}

/** Chord from rise h and radius R. Requires 0 < h ≤ 2R. */
export function chordFromRiseRadius(rise: number, radius: number): number {
  return 2 * Math.sqrt(Math.max(0, 2 * radius * rise - rise * rise));
}
