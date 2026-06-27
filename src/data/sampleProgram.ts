import type { WorkoutDay } from "../types";

// ---------------------------------------------------------------------------
// Hardcoded sample workout day (Phase 1 placeholder).
//
// Replace this with real data pulled from your coach's Google Sheet in Phase 3.
// The rest of the app only depends on the WorkoutDay shape, not on these
// specific values, so swapping the source later changes nothing downstream.
// ---------------------------------------------------------------------------

export const sampleDay: WorkoutDay = {
  id: "day-a-lower",
  name: "Day A — Lower Body",
  exercises: [
    {
      id: "back-squat",
      name: "Back Squat",
      prescription: { sets: 4, targetReps: "5", targetRpe: 8 },
    },
    {
      id: "romanian-deadlift",
      name: "Romanian Deadlift",
      prescription: { sets: 3, targetReps: "8-10", targetRpe: 8 },
    },
    {
      id: "leg-press",
      name: "Leg Press",
      prescription: { sets: 3, targetReps: "10-12", targetRpe: 9 },
    },
    {
      id: "seated-leg-curl",
      name: "Seated Leg Curl",
      prescription: { sets: 3, targetReps: "12-15", targetRpe: 9 },
    },
    {
      id: "standing-calf-raise",
      name: "Standing Calf Raise",
      prescription: { sets: 4, targetReps: "12", targetRpe: 9 },
    },
  ],
};
