import { describe, expect, it } from 'vitest';
import { segmentArcSolver } from './segmentArc';
import { qcMarks } from './stations';

describe('segmentArcSolver', () => {
  it('solves the canonical example end to end', () => {
    const res = segmentArcSolver.solve({ chord: 3000, rise: 500 });
    expect(res.ok).toBe(true);
    expect(res.params?.radius).toBeCloseTo(2500, 6);
    expect(res.params?.arcLength).toBeCloseTo(3217.506, 2);
  });

  it('rejects non-positive inputs', () => {
    const res = segmentArcSolver.solve({ chord: 0, rise: 100 });
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(0);
  });

  it('flags a very shallow bar as effectively straight', () => {
    const res = segmentArcSolver.solve({ chord: 5000, rise: 5 });
    expect(res.warnings.some((w) => w.code === 'EFFECTIVELY_STRAIGHT')).toBe(true);
  });

  it('builds geometry whose apex matches the rise and joins the chord ends', () => {
    const res = segmentArcSolver.solve({ chord: 3000, rise: 500 });
    const { marks } = qcMarks(res.params!, 500);
    const geo = segmentArcSolver.toGeometry(res.params!, marks);
    expect(geo.apex.y).toBeCloseTo(-500, 6);
    expect(geo.polyline[0].x).toBeCloseTo(-1500, 6);
    expect(geo.stations.length).toBe(marks.length);
    expect(geo.stations[0].label).toBe('A');
    const mid = geo.polyline[Math.floor(geo.polyline.length / 2)];
    expect(mid.x).toBeCloseTo(0, 6);
    expect(mid.y).toBeCloseTo(-500, 6);
  });
});
