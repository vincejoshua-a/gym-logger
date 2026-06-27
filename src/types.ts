// ---------------------------------------------------------------------------
// Data model
//
// Two halves, kept separate on purpose (see the build plan, §4):
//
//   1. PROGRAM  — what the coach prescribes. Read-only reference. Fetched from
//      the coach's Google Sheet (src/program/programSource.ts), cached locally,
//      with a hardcoded sample as the offline last-resort. Nothing mutates it.
//
//   2. SESSION LOG — what you actually did. Created/edited by you, persisted
//      locally (src/storage/sessionStore.ts). In Phase 4 these entries get
//      flushed back to the Sheet; the `synced` flag is the hook for that.
// ---------------------------------------------------------------------------

/**
 * What the coach prescribes for one exercise, mirroring the Sheet:
 * the working-sets string is free-form ("4x9-10", "5x10-12ea", "30min"), so we
 * keep the raw text AND a best-effort parse. Intensity lives in the coach's
 * note (RIR/tempo), not a clean RPE number.
 */
export interface Prescription {
  /** Exactly as the coach wrote it, e.g. "4x9-10". Always displayed. */
  raw: string;
  /** Parsed set count, or null when it can't be inferred (e.g. "30min"). */
  sets: number | null;
  /** The rep part of the prescription, e.g. "9-10", "12", "30min". */
  repRange: string;
  /** Coach's tempo / RIR / cue note for this exercise. May be empty. */
  coachNote: string;
}

export interface Exercise {
  id: string;
  name: string;
  /** Muscle tag from the Sheet (chest, delts, legs…). */
  muscle: string;
  prescription: Prescription;
}

/** Where a day's program came from (drives the UI source badge). */
export type ProgramSource = "sheet" | "cache" | "sample";

export interface WorkoutDay {
  /** Stable per date, used as the session-log key. */
  id: string;
  /** ISO date string, e.g. "2026-06-27". */
  date: string;
  /** Block tab name, e.g. "Prep 1-4". */
  block?: string;
  weekNumber?: number;
  weekLabel?: string;
  /** e.g. "DAY 2 (Tuesday)". */
  dayLabel?: string;
  /** Session focus, e.g. "Chest / Delts / Pullups / Abs". */
  focus?: string;
  /** True when there are no exercises scheduled (rest day / unmatched date). */
  restDay: boolean;
  exercises: Exercise[];
  source: ProgramSource;
  /** When restDay/unmatched: nearby training days the user can jump to. */
  availableDays?: AvailableDay[];
  /** Optional human message from the endpoint (e.g. "rest day?"). */
  message?: string;
}

export interface AvailableDay {
  date: string;
  weekNumber: number;
  dayLabel: string;
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
  /** One entry per set row; the count is user-adjustable (add/remove). */
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
   * Whether this log has been pushed to the Sheet. Always false today —
   * exists now so Phase 4 sync can flip it without a data migration.
   */
  synced: boolean;
}
