import { useEffect, useRef, useState } from "react";
import "./App.css";
import { ExerciseCard } from "./components/ExerciseCard";
import { UpdatePrompt } from "./components/UpdatePrompt";
import type { ExerciseLog, SessionLog, WorkoutDay } from "./types";
import { loadOrCreateSession, markSynced, saveSession, todayISO } from "./storage/sessionStore";
import { getWorkout } from "./program/programSource";
import { canSync, hasLoggedData, syncSession } from "./program/syncSession";

type SyncState = "idle" | "syncing" | "ok" | "error";

function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const off = dt.getTimezoneOffset() * 60_000;
  return new Date(dt.getTime() - off).toISOString().slice(0, 10);
}

const SOURCE_LABEL: Record<WorkoutDay["source"], string> = {
  sheet: "from Sheet",
  cache: "offline copy",
  sample: "sample (offline)",
};

function App() {
  const [date, setDate] = useState<string>(() => todayISO());
  const [day, setDay] = useState<WorkoutDay | null>(null);
  const [session, setSession] = useState<SessionLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncMsg, setSyncMsg] = useState("");

  // Don't autosave the session we just loaded (only real edits should save).
  const skipSave = useRef(false);

  // Load the program + log whenever the date changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSavedAt(null);
    setSyncState("idle");
    setSyncMsg("");
    (async () => {
      const fetched = await getWorkout(date);
      if (cancelled) return;
      skipSave.current = true;
      setDay(fetched);
      setSession(loadOrCreateSession(fetched, date));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Autosave on every edit.
  useEffect(() => {
    if (!session) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    saveSession(session);
    setSavedAt(new Date().toLocaleTimeString(undefined, { timeStyle: "short" }));
    // A fresh edit means the log no longer matches the Sheet.
    setSyncState("idle");
    setSyncMsg("");
  }, [session]);

  const doSync = async () => {
    if (!session || !day) return;
    setSyncState("syncing");
    setSyncMsg("");
    const res = await syncSession(session, day);
    if (res.ok) {
      skipSave.current = true; // markSynced already persisted; don't re-save as unsynced
      setSession(markSynced(session));
      setSyncState("ok");
      const extra =
        res.unmatched && res.unmatched.length
          ? ` (${res.unmatched.length} not matched)`
          : "";
      setSyncMsg(`Synced ${res.setsWritten ?? 0} sets to the Sheet${extra}`);
    } else {
      setSyncState("error");
      setSyncMsg(res.error || "Sync failed");
    }
  };

  const updateExercise = (exerciseId: string, log: ExerciseLog) => {
    setSession((prev) =>
      prev ? { ...prev, exercises: { ...prev.exercises, [exerciseId]: log } } : prev,
    );
  };

  const sets = session ? Object.values(session.exercises) : [];
  const totalSets = sets.reduce((n, log) => n + log.sets.length, 0);
  const doneSets = sets.reduce(
    (n, log) => n + log.sets.filter((s) => s.weight && s.reps).length,
    0,
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__nav">
          <button
            className="app__navbtn"
            onClick={() => setDate((d) => addDays(d, -1))}
            aria-label="Previous day"
          >
            ‹
          </button>
          <div className="app__nav-center">
            <span className="app__date">{prettyDate(date)}</span>
            {date === todayISO() && <span className="app__today">Today</span>}
          </div>
          <button
            className="app__navbtn"
            onClick={() => setDate((d) => addDays(d, 1))}
            aria-label="Next day"
          >
            ›
          </button>
        </div>

        <div className="app__header-row">
          <h1 className="app__day">
            {day?.dayLabel || day?.focus || (loading ? "Loading…" : "Workout")}
          </h1>
        </div>
        {day && (day.block || day.weekLabel || day.focus) && (
          <p className="app__sub">
            {[day.block, day.weekLabel, day.dayLabel ? day.focus : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="app__status">
          <span className="app__count">
            {doneSets}/{totalSets} sets
          </span>
          <span className="app__statusright">
            {day && <span className={`src src--${day.source}`}>{SOURCE_LABEL[day.source]}</span>}
            <span
              className={`sync-pill ${
                session?.synced ? "sync-pill--synced" : "sync-pill--pending"
              }`}
              title="Sheet write-back arrives in a later phase"
            >
              <span className="sync-pill__dot" aria-hidden="true" />
              {session?.synced ? "Synced" : "On device"}
              {savedAt && <span className="sync-pill__time"> · {savedAt}</span>}
            </span>
          </span>
        </div>
      </header>

      <main className="app__main">
        {loading && <p className="app__msg">Loading today's workout…</p>}

        {!loading && day && day.restDay && (
          <div className="app__rest">
            <p className="app__rest-title">No workout scheduled</p>
            <p className="app__rest-sub">{day.message || "Looks like a rest day."}</p>
            {day.availableDays && day.availableDays.length > 0 && (
              <div className="app__jump">
                <span className="app__jump-label">Jump to a training day:</span>
                <div className="app__jump-btns">
                  {day.availableDays
                    .filter((d) => d.dayLabel)
                    .map((d) => (
                      <button key={d.date} className="jumpbtn" onClick={() => setDate(d.date)}>
                        {prettyDate(d.date)} · {d.dayLabel.replace(/\s*\(.*\)/, "")}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading &&
          day &&
          !day.restDay &&
          session &&
          day.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              log={session.exercises[exercise.id]}
              onChange={(log) => updateExercise(exercise.id, log)}
            />
          ))}
      </main>

      {canSync(day) && hasLoggedData(session) && (
        <div className="syncbar">
          {syncMsg && (
            <span className={`syncbar__msg syncbar__msg--${syncState}`}>{syncMsg}</span>
          )}
          <button
            className="syncbar__btn"
            onClick={doSync}
            disabled={syncState === "syncing" || Boolean(session?.synced)}
          >
            {syncState === "syncing"
              ? "Syncing…"
              : session?.synced
                ? "Synced ✓"
                : "Sync to coach's Sheet"}
          </button>
        </div>
      )}

      <footer className="app__footer">
        Saved on this device and works offline. Write-back to your coach's Sheet comes next.
      </footer>

      <UpdatePrompt />
    </div>
  );
}

export default App;
