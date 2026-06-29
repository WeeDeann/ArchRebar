import type { Quantity, SegmentParams } from '../engine';
import { toDisplay, unitLabel } from '../units/units';
import { EDITABLE, useCalcStore } from '../state/useCalcStore';

const BAR_SIZES = [8, 10, 12, 16, 20, 25, 32, 40];

const META: Record<Quantity, { label: string; hint: string; machine?: boolean }> = {
  chord: { label: 'Chord', hint: 'Straight-line span, end to end' },
  rise: { label: 'Rise', hint: 'Peak height above the chord' },
  radius: { label: 'Radius', hint: 'Centre-line bend radius', machine: true },
  arc: { label: 'Arc length', hint: 'True cutting length', machine: true },
  angle: { label: 'Included angle', hint: '' },
};

const PARAM_KEY: Record<Quantity, keyof SegmentParams> = {
  chord: 'chord',
  rise: 'rise',
  radius: 'radius',
  arc: 'arcLength',
  angle: 'centralAngle',
};

export function InputPanel({ params }: { params: SegmentParams | null }) {
  const { inputs, drivers, activeField, unitSystem, roundingStep, barSize, selectField, setBarSize } =
    useCalcStore();

  const computed = (q: Quantity): string => {
    if (!params) return '–';
    const disp = toDisplay(params[PARAM_KEY[q]], unitSystem);
    const rounded = roundingStep > 0 ? Math.round(disp / roundingStep) * roundingStep : disp;
    return rounded.toFixed(unitSystem === 'metric' ? 0 : 2);
  };

  return (
    <div className="values card">
      <div className="values__bar">
        <span className="values__bar-label">Bar diameter</span>
        <select value={barSize} onChange={(e) => setBarSize(Number(e.target.value))}>
          {BAR_SIZES.map((s) => (
            <option key={s} value={s}>
              ⌀ {s} mm
            </option>
          ))}
        </select>
      </div>
      <p className="values__hint">Tap any two values to set them — the rest calculate.</p>
      {EDITABLE.map((q) => {
        const isDriver = drivers.includes(q);
        const isActive = activeField === q;
        const raw = inputs[q] ?? '';
        const cls = [
          'vrow',
          isDriver ? 'vrow--set' : 'vrow--calc',
          isActive ? 'vrow--active' : '',
          META[q].machine ? 'vrow--machine' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return (
          <button
            key={q}
            type="button"
            className={cls}
            aria-pressed={isDriver}
            onClick={() => selectField(q)}
          >
            <span className="vrow__tag">{isDriver ? 'SET' : 'CALC'}</span>
            <span className="vrow__label">
              {META[q].label}
              <span className="vrow__hint">{META[q].hint}</span>
            </span>
            <span className="vrow__value">
              {isDriver ? raw || <span className="vrow__ph">–</span> : computed(q)}
              {isActive && <span className="caret" aria-hidden />}
              <span className="vrow__unit">{unitLabel(unitSystem)}</span>
            </span>
          </button>
        );
      })}
      <div className="vrow vrow--readonly">
        <span className="vrow__label">{META.angle.label}</span>
        <span className="vrow__value">
          {params ? ((params.centralAngle * 180) / Math.PI).toFixed(1) : '–'}
          <span className="vrow__unit">°</span>
        </span>
      </div>
    </div>
  );
}
