export type UnitSystem = 'metric' | 'imperial';

const MM_PER_INCH = 25.4;

export function unitLabel(system: UnitSystem): string {
  return system === 'metric' ? 'mm' : 'in';
}

/** Convert a canonical millimetre value to the display unit. */
export function toDisplay(mm: number, system: UnitSystem): number {
  return system === 'metric' ? mm : mm / MM_PER_INCH;
}

/** Convert a value typed in the display unit back to canonical millimetres. */
export function toMillimetres(value: number, system: UnitSystem): number {
  return system === 'metric' ? value : value * MM_PER_INCH;
}

function roundTo(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export interface FormatOptions {
  /** Rounding step in the display unit (e.g. 1 mm, 0.25 in). */
  step?: number;
  /** Decimal places to show. */
  decimals?: number;
}

/** Format a canonical millimetre length for display, including the unit label. */
export function formatLength(mm: number, system: UnitSystem, opts: FormatOptions = {}): string {
  const decimals = opts.decimals ?? (system === 'metric' ? 0 : 2);
  const value = roundTo(toDisplay(mm, system), opts.step ?? 0);
  return `${value.toFixed(decimals)} ${unitLabel(system)}`;
}

export const ROUNDING_STEPS: Record<UnitSystem, number[]> = {
  metric: [1, 5, 10],
  imperial: [0.1, 0.25, 0.5],
};
