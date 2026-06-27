import type { AvailableDay, Exercise, WorkoutDay } from "../types";
import { sampleDayFor } from "../data/sampleProgram";

// ---------------------------------------------------------------------------
// Program source: fetch the prescribed workout from the coach's Google Sheet
// (via the Apps Script read endpoint), cache it locally, and fall back to the
// cache or the hardcoded sample when offline. This is the ONLY place that knows
// the endpoint exists — the rest of the app just consumes WorkoutDay objects.
// ---------------------------------------------------------------------------

const ENDPOINT = import.meta.env.VITE_SHEET_ENDPOINT;
const TOKEN = import.meta.env.VITE_SHEET_TOKEN;
const CACHE_PREFIX = "gymlog:program:";

/** Shape returned by the Apps Script endpoint. */
interface SheetExercise {
  order: number;
  muscle: string;
  name: string;
  prescription: string;
  sets: number | null;
  repRange: string;
  note: string;
}
interface SheetResponse {
  found: boolean;
  date: string;
  block?: string;
  weekNumber?: number;
  weekLabel?: string;
  dayLabel?: string;
  focus?: string;
  restDay?: boolean;
  exercises?: SheetExercise[];
  availableDays?: AvailableDay[];
  message?: string;
  error?: string;
}

export function isConfigured(): boolean {
  return Boolean(ENDPOINT && TOKEN);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function mapResponse(r: SheetResponse): WorkoutDay {
  const exercises: Exercise[] = (r.exercises ?? []).map((e) => ({
    // Order-prefixed so repeated names within a day stay unique and stable.
    id: `${e.order}-${slug(e.name)}`,
    name: e.name,
    muscle: e.muscle,
    prescription: {
      raw: e.prescription,
      sets: e.sets,
      repRange: e.repRange,
      coachNote: e.note,
    },
  }));
  return {
    id: r.date,
    date: r.date,
    block: r.block,
    weekNumber: r.weekNumber,
    weekLabel: r.weekLabel,
    dayLabel: r.dayLabel,
    focus: r.focus,
    restDay: r.restDay ?? exercises.length === 0,
    exercises,
    source: "sheet",
    availableDays: r.availableDays,
    message: r.message,
  };
}

function cacheKey(date: string): string {
  return `${CACHE_PREFIX}${date}`;
}

function cacheProgram(day: WorkoutDay): void {
  try {
    localStorage.setItem(cacheKey(day.date), JSON.stringify(day));
  } catch {
    /* storage full / disabled — ignore, it's only a cache */
  }
}

export function loadCachedProgram(date: string): WorkoutDay | null {
  try {
    const raw = localStorage.getItem(cacheKey(date));
    if (!raw) return null;
    const day = JSON.parse(raw) as WorkoutDay;
    return { ...day, source: "cache" };
  } catch {
    return null;
  }
}

/**
 * Get the workout for a date. Tries the live Sheet first; on any failure
 * (offline, error) falls back to the cached copy, then the hardcoded sample.
 * Always resolves — never throws — so the UI always has something to show.
 */
export async function getWorkout(date: string): Promise<WorkoutDay> {
  if (ENDPOINT && TOKEN) {
    try {
      const url =
        `${ENDPOINT}?token=${encodeURIComponent(TOKEN)}` +
        `&date=${encodeURIComponent(date)}`;
      // Simple GET, no custom headers → no CORS preflight.
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as SheetResponse;
      if (data.error) throw new Error(data.error);
      const day = mapResponse(data);
      cacheProgram(day);
      return day;
    } catch (err) {
      console.warn("Sheet fetch failed, using cache/sample:", err);
    }
  }
  return loadCachedProgram(date) ?? sampleDayFor(date);
}
