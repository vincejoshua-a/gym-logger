import type { Exercise, ExerciseLog, SetEntry } from "../types";
import { SetRow } from "./SetRow";

interface ExerciseCardProps {
  exercise: Exercise;
  log: ExerciseLog;
  /** Last week's logged sets for this exercise (numbers to beat). */
  lastWeekSets?: SetEntry[];
  onChange: (log: ExerciseLog) => void;
}

/** One exercise: prescribed targets up top, a row per set, then a note field. */
export function ExerciseCard({ exercise, log, lastWeekSets, onChange }: ExerciseCardProps) {
  const { prescription } = exercise;

  // Last week's sets that actually have data, formatted "100×9".
  const lastWeek = (lastWeekSets ?? [])
    .filter((s) => s.weight || s.reps)
    .map((s) => `${s.weight || "–"}×${s.reps || "–"}`);

  const updateSet = (index: number, entry: SetEntry) => {
    const sets = log.sets.map((s, i) => (i === index ? entry : s));
    onChange({ ...log, sets });
  };

  const addSet = () => onChange({ ...log, sets: [...log.sets, { weight: "", reps: "" }] });

  const removeSet = () => {
    if (log.sets.length <= 1) return;
    onChange({ ...log, sets: log.sets.slice(0, -1) });
  };

  const doneCount = log.sets.filter((s) => s.weight && s.reps).length;

  return (
    <section className="card">
      <header className="card__header">
        <div className="card__title-row">
          <h2 className="card__title">{exercise.name}</h2>
          {exercise.muscle && <span className="card__muscle">{exercise.muscle}</span>}
        </div>
        <p className="card__rx">
          <span className="card__rx-main">{prescription.raw || "—"}</span>
          {prescription.coachNote && (
            <span className="card__rx-note"> · {prescription.coachNote}</span>
          )}
        </p>
        <p className="card__progress">
          {doneCount}/{log.sets.length} sets logged
        </p>
        {lastWeek.length > 0 && (
          <p className="card__lastweek">
            <span className="card__lastweek-label">Last week</span> {lastWeek.join(" · ")}
          </p>
        )}
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

      <div className="card__setbtns">
        <button type="button" className="setbtn" onClick={removeSet} disabled={log.sets.length <= 1}>
          − Set
        </button>
        <button type="button" className="setbtn" onClick={addSet}>
          + Set
        </button>
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
