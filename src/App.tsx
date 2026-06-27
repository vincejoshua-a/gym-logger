import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { sampleDay } from "./data/sampleProgram";
import { ExerciseCard } from "./components/ExerciseCard";
import { UpdatePrompt } from "./components/UpdatePrompt";
import type { ExerciseLog, SessionLog } from "./types";
import { loadOrCreateSession, saveSession, todayISO } from "./storage/sessionStore";

function prettyDate(iso: string): string {
  // iso is "YYYY-MM-DD"; render in the local locale, no timezone shifting.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function App() {
  const day = sampleDay;
  const date = useMemo(() => todayISO(), []);

  // Load saved progress (or a fresh blank session) once on mount.
  const [session, setSession] = useState<SessionLog>(() =>
    loadOrCreateSession(day, date),
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Autosave on every edit. Skip the very first render (nothing changed yet).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    saveSession(session);
    setSavedAt(new Date().toLocaleTimeString(undefined, { timeStyle: "short" }));
  }, [session]);

  const updateExercise = (exerciseId: string, log: ExerciseLog) => {
    setSession((prev) => ({
      ...prev,
      exercises: { ...prev.exercises, [exerciseId]: log },
    }));
  };

  const totalSets = day.exercises.reduce((n, e) => n + e.prescription.sets, 0);
  const doneSets = Object.values(session.exercises).reduce(
    (n, log) => n + log.sets.filter((s) => s.weight && s.reps).length,
    0,
  );

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__header-row">
          <h1 className="app__day">{day.name}</h1>
          <span className="app__date">{prettyDate(date)}</span>
        </div>
        <div className="app__status">
          <span className="app__count">
            {doneSets}/{totalSets} sets
          </span>
          <span
            className={`sync-pill ${
              session.synced ? "sync-pill--synced" : "sync-pill--pending"
            }`}
            title="Sheet sync arrives in a later phase"
          >
            <span className="sync-pill__dot" aria-hidden="true" />
            {session.synced ? "Synced" : "On device"}
            {savedAt && <span className="sync-pill__time"> · {savedAt}</span>}
          </span>
        </div>
      </header>

      <main className="app__main">
        {day.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            log={session.exercises[exercise.id]}
            onChange={(log) => updateExercise(exercise.id, log)}
          />
        ))}
      </main>

      <footer className="app__footer">
        Everything is saved on this device and works offline. Sheet sync comes later.
      </footer>

      <UpdatePrompt />
    </div>
  );
}

export default App;
