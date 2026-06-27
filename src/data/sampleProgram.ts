import type { Exercise, WorkoutDay } from "../types";

// ---------------------------------------------------------------------------
// Hardcoded sample day — now only the OFFLINE LAST-RESORT fallback, used when
// the coach's Sheet can't be reached and there's no cached copy. The live
// program comes from src/program/programSource.ts.
// ---------------------------------------------------------------------------

function ex(
  id: string,
  name: string,
  muscle: string,
  raw: string,
  sets: number | null,
  repRange: string,
  coachNote = "",
): Exercise {
  return { id, name, muscle, prescription: { raw, sets, repRange, coachNote } };
}

const sampleExercises: Exercise[] = [
  ex("1-back-squat", "Back Squat", "legs", "4x5", 4, "5", "S3&4 RIR1"),
  ex("2-romanian-deadlift", "Romanian Deadlift", "legs", "3x8-10", 3, "8-10", "2sec @ stretch"),
  ex("3-leg-press", "Leg Press", "legs", "3x10-12", 3, "10-12"),
  ex("4-seated-leg-curl", "Seated Leg Curl", "legs", "3x12-15", 3, "12-15"),
  ex("5-standing-calf-raise", "Standing Calf Raise", "calves", "4x12", 4, "12"),
];

/** Build a sample day stamped for a given date (offline fallback only). */
export function sampleDayFor(date: string): WorkoutDay {
  return {
    id: date,
    date,
    block: "Sample (offline)",
    dayLabel: "Sample Lower Body",
    focus: "Legs",
    restDay: false,
    exercises: sampleExercises,
    source: "sample",
  };
}
