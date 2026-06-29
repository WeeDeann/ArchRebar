import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { solveSegment, type Knowns, type Quantity, type SegmentParams, type SolveResult } from '../engine';
import { toDisplay, toMillimetres, type UnitSystem } from '../units/units';

/** Quantities the user can set / read. Angle is derived-only for now. */
export const EDITABLE: Quantity[] = ['chord', 'rise', 'radius', 'arc'];

/** Map a quantity to its key on SegmentParams. */
const PARAM_KEY: Record<Quantity, keyof SegmentParams> = {
  chord: 'chord',
  rise: 'rise',
  radius: 'radius',
  arc: 'arcLength',
  angle: 'centralAngle',
};

interface CalcState {
  /** Raw typed strings for the active driver fields (display units). */
  inputs: Partial<Record<Quantity, string>>;
  /** The (up to two) quantities currently acting as inputs, oldest first. */
  drivers: Quantity[];
  activeField: Quantity;
  unitSystem: UnitSystem;
  /** Spacing of shop-floor checks, in millimetres (canonical). */
  interval: number;
  /** Nominal bar diameter, mm (8, 10, 12, 16, 20, 25, 32, 40). */
  barSize: number;
  roundingStep: number;
  theme: 'light' | 'dark';

  selectField: (q: Quantity) => void;
  keypadInput: (key: string) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setInterval: (mm: number) => void;
  setBarSize: (mm: number) => void;
  toggleTheme: () => void;
}

/** Apply one keypad press to a numeric string, keeping it a valid decimal. */
function applyKey(current: string, key: string): string {
  if (key === 'back') return current.slice(0, -1);
  if (key === 'clear') return '';
  if (key === '.') {
    if (current.includes('.')) return current;
    return current === '' ? '0.' : current + '.';
  }
  if (current === '0') return key;
  if (current.replace('.', '').length >= 7) return current;
  return current + key;
}

/** Pure: solve the segment from the current driver strings. Used by the UI and for seeding. */
export function solveFromInputs(
  inputs: Partial<Record<Quantity, string>>,
  drivers: Quantity[],
  unitSystem: UnitSystem,
): SolveResult<SegmentParams> {
  const known: Knowns = {};
  for (const q of drivers) {
    const raw = inputs[q];
    if (raw === undefined || raw === '') continue;
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n)) continue;
    known[q] = q === 'angle' ? (n * Math.PI) / 180 : toMillimetres(n, unitSystem);
  }
  return solveSegment(known);
}

/** Produce a clean plain-number string for a quantity from solved params (no unit label). */
function seedValue(
  q: Quantity,
  params: SegmentParams,
  unitSystem: UnitSystem,
  step: number,
): string {
  if (q === 'angle') return ((params.centralAngle * 180) / Math.PI).toFixed(1);
  const disp = toDisplay(params[PARAM_KEY[q]], unitSystem);
  const rounded = step > 0 ? Math.round(disp / step) * step : disp;
  return String(Number.parseFloat(rounded.toFixed(3)));
}

export const useCalcStore = create<CalcState>()(
  persist(
    (set) => ({
      inputs: { chord: '3000', rise: '500' },
      drivers: ['chord', 'rise'],
      activeField: 'chord',
      unitSystem: 'metric',
      interval: 500,
      barSize: 16,
      roundingStep: 1,
      theme: 'light',

      selectField: (q) =>
        set((state) => {
          if (state.drivers.includes(q)) return { activeField: q };
          // Promote q to the newest driver; the rest recompute around it.
          const drivers = [...state.drivers, q].slice(-2);
          const res = solveFromInputs(state.inputs, state.drivers, state.unitSystem);
          const inputs: Partial<Record<Quantity, string>> = {};
          for (const d of drivers) inputs[d] = state.inputs[d] ?? '';
          inputs[q] =
            res.ok && res.params
              ? seedValue(q, res.params, state.unitSystem, state.roundingStep)
              : '';
          return { drivers, inputs, activeField: q };
        }),

      keypadInput: (key) =>
        set((state) => ({
          inputs: { ...state.inputs, [state.activeField]: applyKey(state.inputs[state.activeField] ?? '', key) },
        })),

      setUnitSystem: (next) =>
        set((state) => {
          if (next === state.unitSystem) return {};
          const decimals = next === 'metric' ? 1 : 3;
          const factor = 10 ** decimals;
          const inputs = { ...state.inputs };
          for (const q of state.drivers) {
            if (q === 'angle') continue;
            const raw = inputs[q];
            if (raw === undefined || raw === '') continue;
            const n = Number.parseFloat(raw);
            if (!Number.isFinite(n)) continue;
            const disp = toDisplay(toMillimetres(n, state.unitSystem), next);
            inputs[q] = String(Math.round(disp * factor) / factor);
          }
          return {
            unitSystem: next,
            roundingStep: next === 'metric' ? 1 : 0.25,
            interval: next === 'metric' ? 500 : 304.8, // 500 mm / 12 in
            inputs,
          };
        }),

      setInterval: (interval) => set({ interval }),
      setBarSize: (barSize) => set({ barSize }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'archrebar-v3' },
  ),
);
