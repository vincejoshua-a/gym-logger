# Gym Logger — PWA

Mobile-first logger for actual weights/reps against a coach-prescribed program.
Built from `gym-logger-plan.md`. **Currently: Phase 2 (installable PWA + offline) complete.**

## Stack (verified versions)
- React 19.2.7 · Vite 8.1.0 · TypeScript 6.0.2 · @vitejs/plugin-react 6.0.2
- PWA: vite-plugin-pwa 1.3.0 (Workbox generateSW, `registerType: autoUpdate`)
- Node 24.18.0 LTS (installed via **nvm** in `~/.nvm`; loaded by `~/.zshrc`)
- Storage: `localStorage` (data layer in `src/storage/`). No backend.

## Run it locally
```bash
cd "gym-logger"
npm run dev -- --host      # --host = reachable from your phone on the same Wi-Fi
```
Then open the printed **Network** URL on your phone (e.g. `http://192.168.x.x:5173/`).

`npm run build` → production bundle in `dist/` (for deploying to a free static host).

## Structure (data layer kept isolated for future Sheet sync)
- `src/types.ts` — Program vs. SessionLog model. `SessionLog.synced` is the Phase 4 hook.
- `src/data/sampleProgram.ts` — hardcoded sample day. **Replace with Google Sheet data in Phase 3.**
- `src/storage/sessionStore.ts` — the ONLY file that touches persistence. Swap to
  IndexedDB (Phase 2) or add a sync queue (Phase 4) here without touching components.
- `src/components/ExerciseCard.tsx`, `SetRow.tsx` — UI.
- `src/components/UpdatePrompt.tsx` — service-worker toast (offline-ready / update-available).
- `src/App.tsx` — loads/saves today's session, autosaves on every edit; sync-status pill.

## PWA assets
- `public/pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` — generated from
  `icon-source.svg` (project root) via macOS `qlmanage` + `sips`. Regenerate after editing
  the SVG; swap in a real icon any time.
- PWA config (manifest + Workbox) lives in `vite.config.ts`. `devOptions.enabled: true`
  runs the service worker in dev so it can be tested before deploying.

## Phase roadmap (from the plan)
- [x] **Phase 1** — local-only logger, hardcoded day, saves to localStorage.
- [x] **Phase 2** — PWA shell: installable to home screen, precached app shell works fully
  offline, "On device / Synced" status pill, update toast.
- [ ] **Phase 3** — read today's program from the coach's Google Sheet (needs Sheet layout first).
- [ ] **Phase 4** — write actuals back to the Sheet; flip `synced`.
- [ ] **Phase 5** — pre-fill last session, rest timer, history, plate calculator.

## Notes
- Verify package versions against current docs before each new phase.
