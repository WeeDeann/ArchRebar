import type { QcLayout } from '../engine';
import { formatLength, toDisplay, unitLabel } from '../units/units';
import { useCalcStore } from '../state/useCalcStore';

const INTERVALS = {
  metric: [
    { mm: 250, label: '250 mm' },
    { mm: 500, label: '500 mm' },
    { mm: 1000, label: '1 m' },
  ],
  imperial: [
    { mm: 152.4, label: '6 in' },
    { mm: 304.8, label: '12 in' },
    { mm: 609.6, label: '24 in' },
  ],
};

export function QcTable({ layout }: { layout: QcLayout | null }) {
  const { unitSystem, roundingStep, interval, setInterval } = useCalcStore();
  if (!layout || layout.marks.length === 0) return null;

  const fmt = (mm: number) => formatLength(mm, unitSystem, { step: roundingStep });
  const num = (mm: number) => {
    const disp = toDisplay(mm, unitSystem);
    const rounded = roundingStep > 0 ? Math.round(disp / roundingStep) * roundingStep : disp;
    return rounded.toFixed(unitSystem === 'metric' ? 0 : 2);
  };
  const pattern = `${layout.gaps.map(num).join('  +  ')}  ${unitLabel(unitSystem)}`;

  return (
    <div className="qc card">
      <div className="qc__head">
        <h2>Shop-floor checks</h2>
        <label className="qc__interval">
          Every
          <select value={interval} onChange={(e) => setInterval(Number(e.target.value))}>
            {INTERVALS[unitSystem].map((o) => (
              <option key={o.mm} value={o.mm}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="qc__hint">
        Lay a straightedge along the chord. Mark from one end using the spacing below, then measure
        each height above the straightedge.
      </p>
      <p className="qc__pattern">{pattern}</p>
      <table className="qc__table">
        <thead>
          <tr>
            <th>Point</th>
            <th>From end</th>
            <th>Height</th>
          </tr>
        </thead>
        <tbody>
          {layout.marks.map((m) => (
            <tr key={m.label}>
              <td>
                <span className="qc__pt">{m.label}</span>
              </td>
              <td>{fmt(m.fromEnd)}</td>
              <td className="qc__offset">{fmt(m.offset)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
