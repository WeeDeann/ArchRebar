import type { JobSheetViewModel } from '../export/jobSheet';
import { ArchDiagram } from './ArchDiagram';
import { QcSheet } from './QcSheet';

interface Props {
  sheet: JobSheetViewModel;
}

export function PrintSheet({ sheet }: Props) {
  const { params, geometry, layout, warnings, barSize, format, spacingPattern, printedAt } = sheet;
  const angleDeg = ((params.centralAngle * 180) / Math.PI).toFixed(1);
  const markCount = layout.marks.length;
  const splitQc = markCount > 10;
  const mid = Math.ceil(markCount / 2);
  const qcLeft = splitQc ? layout.marks.slice(0, mid) : layout.marks;
  const qcRight = splitQc ? layout.marks.slice(mid) : [];

  const density =
    markCount > 14 ? 'print-sheet--dense' : markCount > 10 ? 'print-sheet--compact' : '';

  const noteLines = 8;

  return (
    <div className={`print-sheet ${density}`.trim()}>
      <header className="print-header">
        <span className="print-header__brand">ArchRebar</span>
        <dl className="print-specs">
          <div>
            <dt>Bar</dt>
            <dd>⌀ {barSize} mm</dd>
          </div>
          <div>
            <dt>Chord</dt>
            <dd>{format(params.chord)}</dd>
          </div>
          <div>
            <dt>Rise</dt>
            <dd>{format(params.rise)}</dd>
          </div>
          <div>
            <dt>Arc</dt>
            <dd>{format(params.arcLength)}</dd>
          </div>
          <div>
            <dt>R</dt>
            <dd>{format(params.radius)}</dd>
          </div>
          <div>
            <dt>R in / out</dt>
            <dd>
              {format(params.radius - barSize / 2)} / {format(params.radius + barSize / 2)}
            </dd>
          </div>
          <div>
            <dt>Angle</dt>
            <dd>{angleDeg}°</dd>
          </div>
        </dl>
        <time className="print-header__date" dateTime={printedAt}>
          {printedAt}
        </time>
      </header>

      <div className="print-main">
        <div className="print-main__diagram">
          <ArchDiagram geometry={geometry} params={params} barSize={barSize} format={format} />
        </div>
        <div className={`print-main__qc print-qc-panel${splitQc ? ' print-qc-panel--split' : ''}`}>
          <div className="print-qc-panel__head">
            <div className="print-qc-panel__title-row">
              <h2 className="qc-sheet__title">Shop-floor checks</h2>
            </div>
            <div className="print-qc-panel__meta">
              <div className="print-qc-panel__field">
                <span className="print-qc-panel__label">Job</span>
                <span className="print-qc-panel__line" aria-hidden="true" />
              </div>
              <div className="print-qc-panel__field">
                <span className="print-qc-panel__label">BM</span>
                <span className="print-qc-panel__line" aria-hidden="true" />
              </div>
            </div>
          </div>

          <p className="print-qc-panel__method">
            Lay a straightedge along the chord. Mark from one end using the spacing below, then
            measure each height above the straightedge.
          </p>

          <div className="print-qc-panel__body">
            {splitQc ? (
              <div className="print-qc-cols">
                <div className="print-qc-col">
                  <p className="print-qc-panel__spacing-label">Spacing along chord</p>
                  <QcSheet
                    layout={layout}
                    spacingPattern={spacingPattern}
                    format={format}
                    marks={qcLeft}
                    stretchRows
                  />
                </div>
                <div className="print-qc-col">
                  <p className="print-qc-panel__spacing-label print-qc-panel__spacing-label--cont">
                    &nbsp;
                  </p>
                  <QcSheet
                    layout={layout}
                    spacingPattern=""
                    format={format}
                    marks={qcRight}
                    showPattern={false}
                    stretchRows
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="print-qc-panel__spacing-label">Spacing along chord</p>
                <QcSheet layout={layout} spacingPattern={spacingPattern} format={format} stretchRows />
              </>
            )}
          </div>

          <section className="print-notes" aria-label="Production notes">
            <h3 className="print-notes__title">Notes</h3>
            <div className="print-notes__ruled" aria-hidden="true">
              {Array.from({ length: noteLines }, (_, i) => (
                <div key={i} className="print-notes__line" />
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="print-footer">
        <p className="print-footer__disclaimer">
          Verify against project specification and applicable code.
          {warnings.length > 0 && (
            <span className="print-footer__warn"> · {warnings.map((w) => w.message).join(' · ')}</span>
          )}
        </p>
      </footer>
    </div>
  );
}
