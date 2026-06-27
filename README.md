# Gym Logger — PWA

Mobile-first logger for actual weights/reps against a coach-prescribed program.
Built from `gym-logger-plan.md`. **Currently: Phase 3 (reads program from the coach's Google Sheet) complete.**

**Live:** https://vincejoshua-a.github.io/gym-logger/ · Repo: https://github.com/vincejoshua-a/gym-logger

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

## Deploying (GitHub Pages, automated)
Hosted on GitHub Pages at https://vincejoshua-a.github.io/gym-logger/.
**Every push to `main` auto-deploys** via `.github/workflows/deploy.yml` (Actions builds
and publishes `dist/`). To ship a change:
```bash
git add -A && git commit -m "..." && git push
```
Wait ~1–2 min, then reopen the app — it auto-updates (shows the "New version" toast).
The production build uses `base: '/gym-logger/'` (set in `vite.config.ts`) because Pages
serves project sites under `/<repo>/`; the dev server stays at root.

## Connecting to the coach's Google Sheet (Phase 3)
The program is read live from the coach's shared Google Sheet via a **standalone Apps
Script** in the athlete's Google account (source: `google-apps-script/Code.gs`, deploy
steps: `google-apps-script/DEPLOY.md`). It returns the prescribed workout for a date as
JSON by reading the Sheet's fixed column grammar — so it keeps working when the coach
adds a new 4-week block tab.

Config (two env vars):
- Local: copy `.env.example` → `.env.local` and fill `VITE_SHEET_ENDPOINT` (the `/exec`
  URL) and `VITE_SHEET_TOKEN` (must match `SECRET` in the deployed `Code.gs`). `.env.local`
  is git-ignored.
- Production: same two values are stored as **GitHub Actions secrets** and injected into
  the build (see `deploy.yml`). Note: client-side apps can't hide the token — it ends up in
  the shipped JS, so the program is technically readable by anyone with the app URL
  (read-only). Securing this (real auth) is a planned future task.

## Structure
- `src/types.ts` — Program (Prescription/Exercise/WorkoutDay) vs. SessionLog model.
- `src/program/programSource.ts` — fetches the day from the Sheet endpoint, caches it,
  falls back to cache then `src/data/sampleProgram.ts` (offline last resort).
- `src/storage/sessionStore.ts` — the ONLY file that touches local persistence.
  Phase 4 (write-back queue) plugs in here.
- `src/components/ExerciseCard.tsx`, `SetRow.tsx` — UI; ± Set handles compound prescriptions.
- `src/components/UpdatePrompt.tsx` — service-worker toast (offline-ready / update-available).
- `src/App.tsx` — loads the day (with date nav + rest-day handling), autosaves the log.

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
- [x] **Phase 3** — read today's program live from the coach's Google Sheet (Apps Script
  endpoint), date navigation, rest-day handling, offline cache.
- [ ] **Phase 4** — write actuals back to the Sheet; flip `synced`.
- [ ] **Phase 5** — pre-fill last session, rest timer, history, plate calculator.
- [ ] **Future (athlete request)** — secure the endpoint / add real auth so the program
  isn't readable by anyone with the app URL.

## Notes
- Verify package versions against current docs before each new phase.
