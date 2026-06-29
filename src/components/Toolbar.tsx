import { useCalcStore } from '../state/useCalcStore';

interface Props {
  jobSheetReady: boolean;
}

export function Toolbar({ jobSheetReady }: Props) {
  const { unitSystem, setUnitSystem, theme, toggleTheme } = useCalcStore();

  const print = () => {
    if (!jobSheetReady) return;
    window.print();
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
        <button type="button" className="icon-btn" onClick={print} disabled={!jobSheetReady}>
          Print
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
