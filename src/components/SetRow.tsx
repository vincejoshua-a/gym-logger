import type { SetEntry } from "../types";

interface SetRowProps {
  setNumber: number;
  entry: SetEntry;
  onChange: (entry: SetEntry) => void;
}

/**
 * One prescribed set: big, tap-friendly weight + reps fields.
 *
 * Mobile keypad notes:
 *  - type="text" + inputMode avoids the up/down spinners that type="number"
 *    shows and that fat-finger easily.
 *  - inputMode="decimal" on weight surfaces a keypad with a decimal point
 *    (for plate math / kg fractions); reps uses "numeric" (whole numbers).
 *  - font-size is 16px+ in CSS so iOS Safari doesn't auto-zoom on focus.
 */
export function SetRow({ setNumber, entry, onChange }: SetRowProps) {
  return (
    <div className="set-row">
      <span className="set-row__label" aria-hidden="true">
        {setNumber}
      </span>

      <div className="set-row__field">
        <input
          className="set-row__input"
          type="text"
          inputMode="decimal"
          enterKeyHint="next"
          placeholder="0"
          value={entry.weight}
          aria-label={`Set ${setNumber} weight in kg`}
          onChange={(e) => onChange({ ...entry, weight: sanitize(e.target.value) })}
        />
      </div>

      <div className="set-row__field">
        <input
          className="set-row__input"
          type="text"
          inputMode="numeric"
          enterKeyHint="next"
          placeholder="0"
          value={entry.reps}
          aria-label={`Set ${setNumber} reps`}
          onChange={(e) => onChange({ ...entry, reps: sanitizeInt(e.target.value) })}
        />
      </div>
    </div>
  );
}

/** Allow digits and a single decimal point only. */
function sanitize(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  return parts.length <= 2 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
}

/** Digits only. */
function sanitizeInt(value: string): string {
  return value.replace(/\D/g, "");
}
