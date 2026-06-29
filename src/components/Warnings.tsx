import type { Warning } from '../engine';

export function Warnings({ warnings, errors }: { warnings: Warning[]; errors: string[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="messages">
      {errors.map((e, i) => (
        <p key={`e${i}`} className="msg msg--error">
          {e}
        </p>
      ))}
      {warnings.map((w) => (
        <p key={w.code} className="msg msg--warn">
          {w.message}
        </p>
      ))}
    </div>
  );
}
