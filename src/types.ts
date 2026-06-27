// ---------------------------------------------------------------------------
// Data model
//
// Two halves, kept separate on purpose (see the build plan, §4):
//
//   1. PROGRAM  — what the coach prescribes. Read-only reference. In Phase 1
//      this is hardcoded (src/data/sampleProgram.ts). In Phase 3 it will be
//      fetched from the Google Sheet. Nothing in the app mutates it.
//
//   2. SESSION LOG — what you actually did. Created/edited by you, persisted
//      locally (src/storage/sessionStore.ts). In Phase 4 these entries get
//      flushed to the Sheet; the `synced` flag is the hook for that and is
//      already here so the shape never has to change.
// ---------------------------------------------------------------------------

/** What the coach prescribes for one exercise. */
export interface Prescription {
  /** Number of work sets, e.g. 4. */
  sets: number;
  /** Target reps as written by the coach: "5", "8-10", "AMRAP", etc. */
  targetReps: string;
  /** Target RPE (rate of perceived exertion), e.g. 8. Optional. */
  targetRpe?: number;
}

export interface Exercise {
  id: string;
  name: string;
  prescription: Prescription;
}

export interface WorkoutDay {
  id: string;
  name: string;
  exercises: Exercise[];
}

// --- Session log (your actuals) --------------------------------------------

/** One performed set: the weight and reps you actually hit. */
export interface SetEntry {
  /** Kept as raw strings so partial input ("12", "12.") is never lost. */
  weight: string;
  reps: string;
}

/** Your log for a single exercise within a session. */
export interface ExerciseLog {
  /** One entry per prescribed set; index 0 == set 1. */
  sets: SetEntry[];
  note: string;
}

/** Everything you logged for one workout on one date. */
export interface SessionLog {
  /** Which WorkoutDay this log belongs to. */
  dayId: string;
  /** ISO date string, e.g. "2026-06-27". */
  date: string;
  /** Keyed by Exercise.id. */
  exercises: Record<string, ExerciseLog>;
  /** Last local save time (ISO). */
  updatedAt: string;
  /**
   * Whether this log has been pushed to the Sheet. Always false in Phase 1 —
   * exists now so Phase 4 sync can flip it without a data migration.
   */
  synced: boolean;
}
