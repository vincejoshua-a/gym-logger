# Apps Script read endpoint — deployment

A **standalone** Apps Script in the athlete's Google account that reads the coach's
shared Sheet (`SHEET_ID` in `Code.gs`) and returns the prescribed workout as JSON.
Read-only. Phase 3 of the gym logger.

> Use the **same Google account the coach shared the Sheet with** (it needs view access).

## Steps
1. Go to **script.google.com** → **New project**.
2. Delete the default `function myFunction() {}` and **paste all of `Code.gs`**. Save (⌘S).
3. In the toolbar function dropdown pick **`testToday`** → click **Run**.
   - Google shows an authorization prompt the first time → **Review permissions** →
     choose your account → "Google hasn't verified this app" → **Advanced** →
     **Go to (project) (unsafe)** → **Allow**. (It's your own script; this is expected.)
   - Open **Execution log** — you should see today's workout JSON.
4. **Deploy** (top-right) → **New deployment** → gear icon → **Web app**:
   - Description: `gym-logger read`
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy** → copy the **Web app URL** (ends in `/exec`).
5. Test the URL in a browser (replace TOKEN if you changed it):
   ```
   <WEB_APP_URL>?token=YOUR_TOKEN&date=2026-06-23
   ```
   You should get JSON with that day's exercises.

## Notes
- The `SECRET` in `Code.gs` must match the app's `VITE_SHEET_TOKEN`. Use your own random
  token (e.g. `openssl rand -hex 16`); keep it out of any public repo.

## Phase 4 — adding write-back
`Code.gs` now also includes `doPost` (+ `writeWorkout_`, `applyWrites_`, `toNum_`), which
writes the athlete's weight/reps into the matched day's W/R cells (matched by exercise
name; only non-empty values; never clears or touches prescription/notes).

To update an already-deployed script **without changing its URL**:
1. In the Apps Script editor, paste the new functions at the bottom of your existing
   `Code.gs` (your `SECRET` and the Phase-3 code stay as they are).
2. **Deploy → Manage deployments** → pencil (Edit) on the existing deployment →
   **Version: New version** → **Deploy**. The `/exec` URL stays the same.
3. Authorization may re-prompt because the script now needs write scope — Allow it.

Write-test (from a terminal, replacing URL/TOKEN):
```
curl -L -X POST "<WEB_APP_URL>?token=YOUR_TOKEN" \
  -d '{"token":"YOUR_TOKEN","date":"2026-06-23","exercises":[{"name":"Pec Flyes","sets":[{"weight":"99","reps":"7"}]}]}'
```
Expect `{"ok":true,...,"setsWritten":1,...}` and the value to appear in the Sheet.
