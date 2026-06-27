import type { Exercise, ExerciseLog, SetEntry } from "../types";
import { SetRow } from "./SetRow";

interface ExerciseCardProps {
  exercise: Exercise;
  log: ExerciseLog;
  onChange: (log: ExerciseLog) => void;
}

/** One exercise: prescribed targets up top, a row per set, then a note field. */
export function ExerciseCard({ exercise, log, onChange }: ExerciseCardProps) {
  const { prescription } = exercise;

  const updateSet = (index: number, entry: SetEntry) => {
    const sets = log.sets.map((s, i) => (i === index ? entry : s));
    onChange({ ...log, sets });
  };

  const doneCount = log.sets.filter((s) => s.weight && s.reps).length;

  return (
    <section className="card">
      <header className="card__header">
        <h2 className="card__title">{exercise.name}</h2>
        <p className="card__rx">
          <span className="card__rx-main">
            {prescription.sets} × {prescription.targetReps}
          </span>
          {prescription.targetRpe !== undefined && (
            <span className="card__rx-rpe"> @ RPE {prescription.targetRpe}</span>
          )}
        </p>
        <p className="card__progress">
          {doneCount}/{prescription.sets} sets logged
        </p>
      </header>

      <div className="card__sets">
        <div className="set-row set-row--head" aria-hidden="true">
          <span className="set-row__label">Set</span>
          <span className="set-row__field-label">Weight (kg)</span>
          <span className="set-row__field-label">Reps</span>
        </div>
        {log.sets.map((entry, i) => (
          <SetRow
            key={i}
            setNumber={i + 1}
            entry={entry}
            onChange={(e) => updateSet(i, e)}
          />
        ))}
      </div>

      <label className="card__note">
        <span className="card__note-label">Note</span>
        <textarea
          className="card__note-input"
          rows={2}
          placeholder="How did it feel? Form cues, pain, tempo…"
          value={log.note}
          onChange={(e) => onChange({ ...log, note: e.target.value })}
        />
      </label>
    </section>
  );
}
