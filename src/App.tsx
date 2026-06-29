import { useEffect, useMemo } from 'react';
import { qcMarks, segmentArcSolver } from './engine';
import { formatLength } from './units/units';
import { buildJobSheetViewModel } from './export/jobSheet';
import { solveFromInputs, useCalcStore } from './state/useCalcStore';
import { Toolbar } from './components/Toolbar';
import { InputPanel } from './components/InputPanel';
import { Keypad } from './components/Keypad';
import { QcTable } from './components/QcTable';
import { ArchDiagram } from './components/ArchDiagram';
import { PrintSheet } from './components/PrintSheet';
import { Warnings } from './components/Warnings';

export default function App() {
  const inputs = useCalcStore((s) => s.inputs);
  const drivers = useCalcStore((s) => s.drivers);
  const unitSystem = useCalcStore((s) => s.unitSystem);
  const interval = useCalcStore((s) => s.interval);
  const barSize = useCalcStore((s) => s.barSize);
  const roundingStep = useCalcStore((s) => s.roundingStep);
  const theme = useCalcStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const model = useMemo(() => {
    const result = solveFromInputs(inputs, drivers, unitSystem);
    if (!result.ok || !result.params) {
      return { result, layout: null, geometry: null, params: null };
    }
    const layout = qcMarks(result.params, interval);
    const geometry = segmentArcSolver.toGeometry(result.params, layout.marks);
    return { result, layout, geometry, params: result.params };
  }, [inputs, drivers, unitSystem, interval]);

  const format = (mm: number) => formatLength(mm, unitSystem, { step: roundingStep });

  const jobSheet = useMemo(() => {
    if (!model.params || !model.layout || !model.geometry) return null;
    return buildJobSheetViewModel(
      {
        params: model.params,
        layout: model.layout,
        geometry: model.geometry,
        warnings: model.result.warnings,
        barSize,
        interval,
        unitSystem,
        format,
      },
      roundingStep,
    );
  }, [model, barSize, interval, unitSystem, roundingStep, format]);

  return (
    <>
      <div className="app">
        <Toolbar jobSheetReady={jobSheet !== null} />
        <main className="layout">
          <section className="inputs-panel">
            <InputPanel params={model.params} />
            <Keypad />
          </section>
          <section className="output-panel">
            <Warnings warnings={model.result.warnings} errors={model.result.errors} />
            {model.geometry && model.params && (
              <ArchDiagram
                geometry={model.geometry}
                params={model.params}
                barSize={barSize}
                format={format}
              />
            )}
            <QcTable layout={model.layout} />
          </section>
        </main>
        <footer className="footer">
          Works offline · Standard-agnostic geometry — always verify against your project
          specification and applicable code.
        </footer>
      </div>
      {jobSheet && <PrintSheet sheet={jobSheet} />}
    </>
  );
}
