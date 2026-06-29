import type { ArcGeometry, QcLayout, SegmentParams, Warning } from '../engine';
import { toDisplay, unitLabel, type UnitSystem } from '../units/units';

export type FormatLength = (mm: number) => string;

export interface JobSheetInput {
  params: SegmentParams;
  layout: QcLayout;
  geometry: ArcGeometry;
  warnings: Warning[];
  barSize: number;
  interval: number;
  unitSystem: UnitSystem;
  format: FormatLength;
}

export interface JobSheetViewModel {
  params: SegmentParams;
  layout: QcLayout;
  geometry: ArcGeometry;
  warnings: Warning[];
  barSize: number;
  intervalLabel: string;
  spacingPattern: string;
  printedAt: string;
  format: FormatLength;
}

const INTERVAL_LABELS: Record<UnitSystem, { mm: number; label: string }[]> = {
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

export function intervalLabel(intervalMm: number, unitSystem: UnitSystem): string {
  const match = INTERVAL_LABELS[unitSystem].find((o) => o.mm === intervalMm);
  return match?.label ?? formatIntervalFallback(intervalMm, unitSystem);
}

function formatIntervalFallback(intervalMm: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'metric') return `${intervalMm} mm`;
  const inches = toDisplay(intervalMm, 'imperial');
  return `${inches.toFixed(1)} in`;
}

export function buildSpacingPattern(
  layout: QcLayout,
  unitSystem: UnitSystem,
  roundingStep: number,
): string {
  const num = (mm: number) => {
    const disp = toDisplay(mm, unitSystem);
    const rounded = roundingStep > 0 ? Math.round(disp / roundingStep) * roundingStep : disp;
    return rounded.toFixed(unitSystem === 'metric' ? 0 : 2);
  };
  return `${layout.gaps.map(num).join('  +  ')}  ${unitLabel(unitSystem)}`;
}

export function buildJobSheetViewModel(
  input: JobSheetInput,
  roundingStep: number,
): JobSheetViewModel {
  return {
    params: input.params,
    layout: input.layout,
    geometry: input.geometry,
    warnings: input.warnings,
    barSize: input.barSize,
    intervalLabel: intervalLabel(input.interval, input.unitSystem),
    spacingPattern: buildSpacingPattern(input.layout, input.unitSystem, roundingStep),
    printedAt: new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    format: input.format,
  };
}
