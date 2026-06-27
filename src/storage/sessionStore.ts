import type { SessionLog, WorkoutDay } from "../types";

// ---------------------------------------------------------------------------
// Persistence layer (Phase 1: localStorage).
//
// Every read/write of a SessionLog goes through here. Components never touch
// localStorage directly. That isolation is deliberate: Phase 2 can swap this
// implementation for IndexedDB, and Phase 4 can add a "pending sync" queue,
// without changing a single component.
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = "gymlog:session:";

/** Stable key for one workout on one date. */
function keyFor(dayId: string, date: string): string {
  return `${STORAGE_PREFIX}${date}:${dayId}`;
}

/** Today's date as an ISO "YYYY-MM-DD" string in the user's local timezone. */
export function todayISO(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

/** Build a blank log whose shape matches the given day's prescription. */
export function createEmptySession(day: WorkoutDay, date: string): SessionLog {
  const exercises: SessionLog["exercises"] = {};
  for (const ex of day.exercises) {
    exercises[ex.id] = {
      sets: Array.from({ length: ex.prescription.sets }, () => ({
        weight: "",
        reps: "",
      })),
      note: "",
    };
  }
  return {
    dayId: day.id,
    date,
    exercises,
    updatedAt: new Date().toISOString(),
    synced: false,
  };
}

/** Load a saved log, or null if none exists yet. */
export function loadSession(dayId: string, date: string): SessionLog | null {
  try {
    const raw = localStorage.getItem(keyFor(dayId, date));
    return raw ? (JSON.parse(raw) as SessionLog) : null;
  } catch (err) {
    console.warn("Failed to load session from localStorage:", err);
    return null;
  }
}

/**
 * Load the saved log for this day/date, or create a fresh empty one.
 *
 * If a saved log exists but the program changed (e.g. an exercise was added or
 * a set count differs), we reconcile against the current day so the UI always
 * matches the prescription while preserving any values you already typed.
 */
export function loadOrCreateSession(day: WorkoutDay, date: string): SessionLog {
  const saved = loadSession(day.id, date);
  if (!saved) return createEmptySession(day, date);

  const empty = createEmptySession(day, date);
  for (const ex of day.exercises) {
    const savedEx = saved.exercises[ex.id];
    if (!savedEx) continue;
    const target = empty.exercises[ex.id];
    target.note = savedEx.note ?? "";
    // Copy across as many saved sets as the current prescription allows.
    for (let i = 0; i < target.sets.length; i++) {
      if (savedEx.sets[i]) target.sets[i] = savedEx.sets[i];
    }
  }
  // Preserve sync status from the saved copy.
  empty.synced = saved.synced ?? false;
  return empty;
}

/** Persist a log. Stamps updatedAt and marks it unsynced (local edit). */
export function saveSession(session: SessionLog): void {
  try {
    const toStore: SessionLog = {
      ...session,
      updatedAt: new Date().toISOString(),
      synced: false,
    };
    localStorage.setItem(keyFor(session.dayId, session.date), JSON.stringify(toStore));
  } catch (err) {
    console.error("Failed to save session to localStorage:", err);
  }
}
