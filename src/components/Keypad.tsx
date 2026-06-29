import { useCalcStore } from '../state/useCalcStore';

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'back'];

export function Keypad() {
  const keypadInput = useCalcStore((s) => s.keypadInput);

  return (
    <div className="keypad">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          className={k === 'back' ? 'key key--back' : 'key'}
          onClick={() => keypadInput(k)}
          aria-label={k === 'back' ? 'Delete' : k}
        >
          {k === 'back' ? '⌫' : k}
        </button>
      ))}
      <button
        type="button"
        className="key key--clear"
        onClick={() => keypadInput('clear')}
        aria-label="Clear field"
      >
        Clear
      </button>
    </div>
  );
}
