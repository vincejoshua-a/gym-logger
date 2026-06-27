import type { SessionLog, WorkoutDay } from "../types";

// ---------------------------------------------------------------------------
// Write-back (Phase 4): POST the logged actuals to the Apps Script endpoint,
// which writes them into the athlete's W/R cells in the coach's Sheet.
// Manual trigger (a Sync button) — never automatic.
// ---------------------------------------------------------------------------

const ENDPOINT = import.meta.env.VITE_SHEET_ENDPOINT;
const TOKEN = import.meta.env.VITE_SHEET_TOKEN;

export interface SyncResult {
  ok: boolean;
  setsWritten?: number;
  unmatched?: string[];
  error?: string;
}

/** Can this day be synced? (configured, real Sheet data — not the offline sample.) */
export function canSync(day: WorkoutDay | null): boolean {
  return Boolean(ENDPOINT && TOKEN && day && day.source !== "sample" && !day.restDay);
}

/** True if the session has at least one logged set worth pushing. */
export function hasLoggedData(session: SessionLog | null): boolean {
  if (!session) return false;
  return Object.values(session.exercises).some((log) =>
    log.sets.some((s) => s.weight || s.reps),
  );
}

export async function syncSession(
  session: SessionLog,
  day: WorkoutDay,
): Promise<SyncResult> {
  if (!ENDPOINT || !TOKEN) return { ok: false, error: "Sheet sync not configured" };

  // Only send exercises that have logged data; keep full set arrays so set
  // indices (and thus target columns) stay aligned. Empty sets are skipped
  // server-side, never cleared.
  const exercises = day.exercises
    .map((ex) => ({
      name: ex.name,
      sets: (session.exercises[ex.id]?.sets ?? []).map((s) => ({
        weight: s.weight,
        reps: s.reps,
      })),
    }))
    .filter((e) => e.sets.some((s) => s.weight || s.reps));

  const payload = { token: TOKEN, date: session.date, exercises };

  try {
    // A plain string body defaults to text/plain → a CORS-safe "simple" request,
    // so the browser doesn't send a preflight Apps Script can't answer.
    const res = await fetch(ENDPOINT, { method: "POST", body: JSON.stringify(payload) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = (await res.json()) as SyncResult & { ok: boolean; error?: string };
    if (!data.ok) return { ok: false, error: data.error || "Write failed" };
    return { ok: true, setsWritten: data.setsWritten, unmatched: data.unmatched };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
