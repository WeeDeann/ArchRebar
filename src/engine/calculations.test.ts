import { describe, expect, it } from 'vitest';
import { segmentArcSolver } from './segmentArc';
import { planStations, qcMarks, stationLabel } from './stations';
import { solveSegment, type Knowns, type Quantity } from './solveSegment';
import { formatLength, toDisplay, toMillimetres } from '../units/units';

/** Reference segment with an exact chord (segmentArcSolver keeps the input chord verbatim). */
const ref = segmentArcSolver.solve({ chord: 3000, rise: 500 }).params!;

describe('shop-floor mark spacing (every interval, ends absorb the remainder)', () => {
  it('matches the 2500 mm example: 250, 500, 500, 500, 500, 250', () => {
    const p = planStations(2500, 500);
    expect(p.positions).toEqual([250, 750, 1250, 1750, 2250]);
    expect(p.gaps).toEqual([250, 500, 500, 500, 500, 250]);
  });

  it('matches the 2517 mm example: 259, 500, 500, 500, 500, 258', () => {
    const p = planStations(2517, 500);
    expect(p.gaps).toEqual([259, 500, 500, 500, 500, 258]);
    expect(p.positions).toEqual([259, 759, 1259, 1759, 2259]);
    expect(p.endLeft).toBe(259);
    expect(p.endRight).toBe(258);
  });

  it('centres a mark on the mid-span for even cases: 3000 mm → 500…2500', () => {
    const p = planStations(3000, 500);
    expect(p.positions).toEqual([500, 1000, 1500, 2000, 2500]);
    expect(p.gaps).toEqual([500, 500, 500, 500, 500, 500]);
  });

  it('always includes the mid-span so the rise can be measured', () => {
    for (const c of [1000, 2500, 2517, 3000, 4321, 8000]) {
      expect(planStations(c, 500).positions).toContain(Math.round(c / 2));
    }
  });

  it('every spacing sums to the chord, with interior gaps equal to the interval', () => {
    for (const c of [1000, 2500, 2517, 3000, 4321, 8000]) {
      const p = planStations(c, 500);
      expect(p.gaps.reduce((a, b) => a + b, 0)).toBe(c);
      expect(p.gaps.slice(1, -1).every((g) => g === 500)).toBe(true);
    }
  });

  it('falls back to a single mid-span mark when shorter than one interval', () => {
    expect(planStations(400, 500).positions).toEqual([200]);
  });
});

describe('station labels', () => {
  it('go A, B, …, Z, AA', () => {
    expect(stationLabel(0)).toBe('A');
    expect(stationLabel(25)).toBe('Z');
    expect(stationLabel(26)).toBe('AA');
  });
});

describe('qcMarks — heights at each mark (centred on the apex)', () => {
  const { marks } = qcMarks(ref, 500); // chord 3000 → 500, 1000, 1500, 2000, 2500

  it('labels marks left to right with a mark on the mid-span', () => {
    expect(marks.map((m) => m.label)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(marks[0].fromEnd).toBe(500);
    expect(marks[2].fromEnd).toBe(1500); // mid-span
    expect(marks[marks.length - 1].fromEnd).toBe(2500);
  });

  it('reads the rise at the centre mark and stays symmetric', () => {
    const d = ref.radius - ref.rise;
    for (const m of marks) {
      expect(m.offset).toBeCloseTo(Math.sqrt(ref.radius * ref.radius - m.xFromCenter ** 2) - d, 6);
    }
    expect(marks[2].offset).toBeCloseTo(ref.rise, 6); // centre mark = rise
    expect(marks[0].offset).toBeCloseTo(marks[4].offset, 9); // A vs E
    expect(marks[1].offset).toBeCloseTo(marks[3].offset, 9); // B vs D
  });
});

describe('toGeometry produces a correct drawing model', () => {
  const { marks } = qcMarks(ref, 500);
  const geo = segmentArcSolver.toGeometry(ref, marks);

  it('starts and ends exactly at the chord endpoints', () => {
    expect(geo.polyline[0].x).toBeCloseTo(-1500, 6);
    expect(geo.polyline[0].y).toBeCloseTo(0, 6);
    expect(geo.polyline[geo.polyline.length - 1].x).toBeCloseTo(1500, 6);
  });

  it('places the apex at the rise height', () => {
    expect(geo.apex.x).toBe(0);
    expect(geo.apex.y).toBeCloseTo(-500, 6);
  });

  it('puts each station foot on the chord and head at the arc offset, carrying the label', () => {
    geo.stations.forEach((st, i) => {
      expect(st.foot.y).toBe(0);
      expect(st.head.y).toBeCloseTo(-marks[i].offset, 6);
      expect(st.label).toBe(marks[i].label);
    });
  });
});

describe('solveSegment — angle-based pairs', () => {
  it('angle + chord', () => {
    expect(solveSegment({ angle: ref.centralAngle, chord: 3000 }).params!.rise).toBeCloseTo(500, 4);
  });
  it('angle + rise', () => {
    expect(solveSegment({ angle: ref.centralAngle, rise: 500 }).params!.chord).toBeCloseTo(3000, 4);
  });
  it('angle + arc', () => {
    expect(
      solveSegment({ angle: ref.centralAngle, arc: ref.arcLength }).params!.radius,
    ).toBeCloseTo(2500, 4);
  });
});

describe('solveSegment — every input pair describes the same segment', () => {
  const all: Record<Quantity, number> = {
    chord: ref.chord,
    rise: ref.rise,
    radius: ref.radius,
    arc: ref.arcLength,
    angle: ref.centralAngle,
  };
  const keys: Quantity[] = ['chord', 'rise', 'radius', 'arc', 'angle'];

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const b = keys[j];
      it(`${a} + ${b}`, () => {
        const known: Knowns = { [a]: all[a], [b]: all[b] };
        const res = solveSegment(known);
        expect(res.ok).toBe(true);
        const p = res.params!;
        expect(p.chord).toBeCloseTo(ref.chord, 3);
        expect(p.rise).toBeCloseTo(ref.rise, 3);
        expect(p.radius).toBeCloseTo(ref.radius, 3);
        expect(p.arcLength).toBeCloseTo(ref.arcLength, 3);
        expect(p.centralAngle).toBeCloseTo(ref.centralAngle, 6);
      });
    }
  }
});

describe('imperial input pipeline (inches → mm → solve → inches)', () => {
  it('solves a segment given in inches and reports the radius back in inches', () => {
    // 100 in chord, 20 in rise  ⇒  R = (100² + 4·20²)/(8·20) = 72.5 in
    const res = solveSegment({
      chord: toMillimetres(100, 'imperial'),
      rise: toMillimetres(20, 'imperial'),
    });
    expect(res.ok).toBe(true);
    expect(res.params!.radius).toBeCloseTo(72.5 * 25.4, 3); // mm
    expect(toDisplay(res.params!.radius, 'imperial')).toBeCloseTo(72.5, 6); // in
  });
});

describe('formatLength rounding steps', () => {
  it('rounds to the nearest step', () => {
    expect(formatLength(232.572, 'metric', { step: 5, decimals: 0 })).toBe('235 mm');
    expect(formatLength(232.572, 'metric', { step: 10, decimals: 0 })).toBe('230 mm');
    expect(formatLength(471.715, 'metric', { step: 1, decimals: 0 })).toBe('472 mm');
  });
});

describe('arc length increases monotonically with rise (fixed chord)', () => {
  it('holds across a sweep of rises', () => {
    let prev = 0;
    for (let h = 10; h <= 2000; h += 10) {
      const l = solveSegment({ chord: 3000, rise: h }).params!.arcLength;
      expect(l).toBeGreaterThan(prev);
      prev = l;
    }
  });
});
