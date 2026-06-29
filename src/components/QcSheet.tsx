import type { CSSProperties } from 'react';
import type { QcLayout, QcMark } from '../engine';
import type { FormatLength } from '../export/jobSheet';

interface Props {
  layout: QcLayout;
  spacingPattern: string;
  format: FormatLength;
  /** Optional subset of marks (e.g. split columns on print). */
  marks?: QcMark[];
  showPattern?: boolean;
  /** Stretch table rows to fill available height (print layout). */
  stretchRows?: boolean;
}

/** Read-only QC pattern + table for print and on-screen output panel. */
export function QcSheet({
  layout,
  spacingPattern,
  format,
  marks,
  showPattern = true,
  stretchRows = false,
}: Props) {
  const rows = marks ?? layout.marks;

  const table = (
    <table
      className="qc__table qc-sheet__table"
      style={stretchRows ? ({ '--qc-rows': rows.length } as CSSProperties) : undefined}
    >
      <thead>
        <tr>
          <th>Point</th>
          <th>From end</th>
          <th>Height</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.label}>
            <td>
              <span className="qc__pt qc-sheet__pt">{m.label}</span>
            </td>
            <td>{format(m.fromEnd)}</td>
            <td className="qc__offset qc-sheet__offset">{format(m.offset)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      {showPattern && <p className="qc__pattern qc-sheet__pattern">{spacingPattern}</p>}
      {stretchRows ? <div className="qc-sheet__table-wrap">{table}</div> : table}
    </>
  );
}
