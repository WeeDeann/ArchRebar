import { useState } from 'react';
import { qcMarks } from '../engine';
import { formatLength } from '../units/units';
import { solveFromInputs, useCalcStore } from '../state/useCalcStore';

export function Toolbar() {
  const { inputs, drivers, unitSystem, setUnitSystem, theme, toggleTheme, roundingStep, interval, barSize } =
    useCalcStore();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const res = solveFromInputs(inputs, drivers, unitSystem);
    if (!res.ok || !res.params) return;
    const p = res.params;
    const fmt = (mm: number) => formatLength(mm, unitSystem, { step: roundingStep });
    const stations = qcMarks(p, interval).marks.map(
      (m) => `  (${m.label}) ${fmt(m.fromEnd)} from end -> ${fmt(m.offset)}`,
    );
    const lines = [
      'ArchRebar — circular arch',
      `Bar: ⌀ ${barSize} mm`,
      `Chord: ${fmt(p.chord)}`,
      `Rise: ${fmt(p.rise)}`,
      `Radius (centre-line): ${fmt(p.radius)}`,
      `Radius (inside / outside): ${fmt(p.radius - barSize / 2)} / ${fmt(p.radius + barSize / 2)}`,
      `Cutting length: ${fmt(p.arcLength)}`,
      `Included angle: ${((p.centralAngle * 180) / Math.PI).toFixed(1)}°`,
      '',
      'Shop-floor checks (height above chord):',
      ...stations,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand__mark" aria-hidden>
          ◠
        </span>
        <span className="brand__name">ArchRebar</span>
      </div>
      <div className="toolbar__actions">
        <div className="seg" role="group" aria-label="Units">
          <button
            type="button"
            className={unitSystem === 'metric' ? 'seg__btn seg__btn--on' : 'seg__btn'}
            aria-pressed={unitSystem === 'metric'}
            onClick={() => setUnitSystem('metric')}
          >
            mm
          </button>
          <button
            type="button"
            className={unitSystem === 'imperial' ? 'seg__btn seg__btn--on' : 'seg__btn'}
            aria-pressed={unitSystem === 'imperial'}
            onClick={() => setUnitSystem('imperial')}
          >
            in
          </button>
        </div>
        <button type="button" className="icon-btn" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle light or dark theme"
        >
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </div>
    </header>
  );
}
