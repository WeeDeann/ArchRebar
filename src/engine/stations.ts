import { offsetAt } from './math';
import type { QcLayout, QcMark, SegmentParams, StationLayout } from './types';

/** Spreadsheet-style label: A, B, …, Z, AA, AB, … */
export function stationLabel(index: number): string {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/**
 * Choose measuring marks along a chord. Works *outward from the mid-span*: there is always a mark
 * at the centre (so the rise is measured directly), then marks every `interval` toward each end,
 * with the leftover absorbed by the two end gaps. Mirrors how it is done on the floor —
 * a 2500 mm chord at 500 mm → 250, 500, 500, 500, 500, 250; a 2517 mm chord → 259, 500×4, 258.
 */
export function planStations(chord: number, interval: number): StationLayout {
  const iv = interval > 0 ? interval : chord;
  const center = chord / 2;
  const kMax = Math.max(0, Math.floor((center - 1e-6) / iv));
  const positions: number[] = [];
  for (let k = -kMax; k <= kMax; k++) positions.push(Math.round(center + k * iv));

  const gaps = [positions[0]];
  for (let i = 1; i < positions.length; i++) gaps.push(positions[i] - positions[i - 1]);
  gaps.push(chord - positions[positions.length - 1]);

  return { positions, gaps, endLeft: gaps[0], endRight: gaps[gaps.length - 1] };
}

/** Build the labelled shop-floor checks for a solved segment at the given interval (mm). */
export function qcMarks(params: SegmentParams, intervalMm: number): QcLayout {
  const { chord, radius, centerOffset } = params;
  const layout = planStations(chord, intervalMm);
  const marks: QcMark[] = layout.positions.map((fromEnd, i) => {
    const xFromCenter = fromEnd - chord / 2;
    return {
      label: stationLabel(i),
      fromEnd,
      step: layout.gaps[i],
      xFromCenter,
      offset: offsetAt(xFromCenter, radius, centerOffset),
    };
  });
  return { marks, gaps: layout.gaps, intervalMm: intervalMm > 0 ? intervalMm : chord };
}
