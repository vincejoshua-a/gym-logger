/**
 * Gym Logger — read endpoint (Phase 3, READ-ONLY).
 *
 * A STANDALONE Apps Script that lives in the ATHLETE's Google account (not in the
 * coach's spreadsheet). It opens the coach's shared Sheet by ID and returns the
 * prescribed workout for a given date as JSON. It never writes anything.
 *
 * It reads by the fixed column GRAMMAR of the coach's template, so it keeps working
 * when the coach adds a new 4-week block tab — no code change per block.
 *
 * Deploy: New deployment → Web app → Execute as "Me" → Who has access "Anyone".
 * The SECRET below keeps the URL from being usefully called by strangers.
 */

// ── Configuration ──────────────────────────────────────────────────────────
const SHEET_ID = '13el6aDrxQRiFgxVcuyMWBDWp4kk9Mmoit0oi_UFOMnA'; // coach's shared Sheet
// Set this to your own secret token in the deployed copy. It must match the app's
// VITE_SHEET_TOKEN. Kept as a placeholder here so the real value isn't in the repo.
const SECRET = 'REPLACE_WITH_YOUR_TOKEN';
const TIMEZONE = 'Asia/Manila';                                   // for "today"

// Week-block anchor columns (1-indexed): the anchor is BOTH the day-date column AND
// the Set-1 "Weight" column. Everything else is derived from it.
const WEEK_ANCHORS = [6, 25, 44, 63]; // F, Y, AR, BK  → weeks 1..4
const SETS_PER_EXERCISE = 5;          // up to 5 W/R set pairs per exercise
const COL_MUSCLE = 1;                 // A — muscle tag; non-empty marks an exercise row
const COL_NAME = 2;                   // B — exercise name / day & section labels

// Tabs that are not 4-week training blocks (yearly logs, notes, etc.).
const SKIP_NAME_RE = /weekly|daily|macros|notes|supplement|ab routine|temporary|temp /i;

// ── Test helper ────────────────────────────────────────────────────────────
// Select this function in the Apps Script editor and click Run to (a) trigger the
// one-time authorization prompt and (b) print today's workout to the Execution log.
function testToday() {
  const out = findWorkout_(todayStr_());
  Logger.log(JSON.stringify(out, null, 2));
  return out;
}

// ── HTTP entrypoint ────────────────────────────────────────────────────────
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.token !== SECRET) return json_({ error: 'unauthorized' });
  try {
    const date = p.date || todayStr_();
    return json_(findWorkout_(date));
  } catch (err) {
    return json_({ error: String(err && err.message || err) });
  }
}

// ── Write endpoint (Phase 4) ───────────────────────────────────────────────
// POST body (sent as text/plain to avoid a CORS preflight):
//   { token, date, exercises: [{ name, sets: [{weight, reps}, ...] }, ...] }
// Writes ONLY the athlete's weight/reps actual cells for the matched day.
// Never clears a cell (empty values are skipped) and never touches prescription,
// notes, or any non-actual cell.
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.token !== SECRET) return json_({ ok: false, error: 'unauthorized' });
    if (!body.date || !Array.isArray(body.exercises)) {
      return json_({ ok: false, error: 'bad request' });
    }
    return json_(writeWorkout_(body.date, body.exercises));
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function writeWorkout_(dateStr, payloadExercises) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  for (const sheet of ss.getSheets()) {
    if (SKIP_NAME_RE.test(sheet.getName())) continue;
    const values = sheet.getDataRange().getValues();
    const hit = locateDay_(values, dateStr);
    if (hit) return applyWrites_(sheet, values, hit, payloadExercises, dateStr);
  }
  return { ok: false, error: 'no workout found for ' + dateStr };
}

function applyWrites_(sheet, values, hit, payloadExercises, dateStr) {
  const anchor = hit.anchorCol; // 1-indexed: Set-1 weight column for this week
  const endRow = nextDatedRow_(values, anchor - 1, hit.dayRow);

  // Map exercise name → 0-indexed row, for the exercise rows of this day.
  const rowByName = {};
  for (let r = hit.dayRow; r < endRow; r++) {
    const muscle = String(values[r][COL_MUSCLE - 1] || '').trim();
    const name = String(values[r][COL_NAME - 1] || '').trim();
    if (muscle && name) rowByName[name.toLowerCase()] = r;
  }

  let setsWritten = 0;
  const unmatched = [];
  for (const ex of payloadExercises) {
    const key = String(ex.name || '').trim().toLowerCase();
    const r0 = rowByName[key];
    if (r0 === undefined) {
      unmatched.push(ex.name);
      continue;
    }
    const sheetRow = r0 + 1; // 1-indexed
    const sets = ex.sets || [];
    for (let k = 0; k < Math.min(sets.length, SETS_PER_EXERCISE); k++) {
      const wCol = anchor + 3 * k; // weight column for set k (1-indexed)
      const w = sets[k] ? sets[k].weight : '';
      const rp = sets[k] ? sets[k].reps : '';
      let touched = false;
      if (w !== '' && w != null) { sheet.getRange(sheetRow, wCol).setValue(toNum_(w)); touched = true; }
      if (rp !== '' && rp != null) { sheet.getRange(sheetRow, wCol + 1).setValue(toNum_(rp)); touched = true; }
      if (touched) setsWritten++;
    }
  }
  return { ok: true, date: dateStr, block: sheet.getName(), setsWritten: setsWritten, unmatched: unmatched };
}

/** Numeric where possible (so the Sheet's TOTAL formulas recompute), else raw. */
function toNum_(v) {
  const n = Number(v);
  return isNaN(n) ? String(v) : n;
}

// ── Core lookup ────────────────────────────────────────────────────────────
function findWorkout_(dateStr) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  for (const sheet of ss.getSheets()) {
    const name = sheet.getName();
    if (SKIP_NAME_RE.test(name)) continue;
    const values = sheet.getDataRange().getValues(); // values[r][c], 0-indexed
    const hit = locateDay_(values, dateStr);
    if (hit) {
      return buildDay_(values, hit, name, dateStr);
    }
  }
  // No exact date match — return the nearest block's day list so the app can offer a picker.
  const fallback = nearestBlock_(ss, dateStr);
  return Object.assign({ found: false, date: dateStr }, fallback);
}

/**
 * Find the (week, row) whose anchor-column cell equals dateStr.
 * Returns { weekIndex, anchorCol, dayRow } or null.
 */
function locateDay_(values, dateStr) {
  for (let w = 0; w < WEEK_ANCHORS.length; w++) {
    const col = WEEK_ANCHORS[w] - 1; // 0-indexed
    for (let r = 0; r < values.length; r++) {
      if (cellDateStr_(values[r][col]) === dateStr) {
        return { weekIndex: w, anchorCol: WEEK_ANCHORS[w], dayRow: r };
      }
    }
  }
  return null;
}

/** Build the full workout payload for a located day. */
function buildDay_(values, hit, blockName, dateStr) {
  const anchor = hit.anchorCol;            // 1-indexed
  const prescCol = anchor - 3;             // working sets
  const noteCol = anchor - 2;              // tempo & notes
  const weekLabel = String(values[0][anchor - 1] || ('WEEK ' + (hit.weekIndex + 1)));

  // The day spans from its date row until the next dated row in the same week column.
  const endRow = nextDatedRow_(values, anchor - 1, hit.dayRow);

  // Day label + focus live in column B around the date row.
  let dayLabel = '', focus = '';
  for (let r = hit.dayRow; r < Math.min(hit.dayRow + 4, endRow); r++) {
    const b = String(values[r][COL_NAME - 1] || '');
    if (/^day\s*\d/i.test(b)) {
      dayLabel = b;
      focus = String(values[r + 1] ? values[r + 1][COL_NAME - 1] || '' : '');
      break;
    }
  }

  const exercises = [];
  for (let r = hit.dayRow; r < endRow; r++) {
    const muscle = String(values[r][COL_MUSCLE - 1] || '').trim();
    const name = String(values[r][COL_NAME - 1] || '').trim();
    if (!muscle || !name) continue; // exercise rows always have a muscle tag + name
    const presc = String(values[r][prescCol - 1] || '').trim();
    const parsed = parsePrescription_(presc);
    exercises.push({
      order: exercises.length + 1,
      muscle: muscle,
      name: name,
      prescription: presc,         // raw, always shown
      sets: parsed.sets,           // best-effort number, or null
      repRange: parsed.repRange,   // e.g. "9-10", "12", "30min"
      note: String(values[r][noteCol - 1] || '').trim(),
    });
  }

  return {
    found: true,
    date: dateStr,
    block: blockName,
    weekNumber: hit.weekIndex + 1,
    weekLabel: weekLabel,
    dayLabel: dayLabel,
    focus: focus,
    restDay: exercises.length === 0,
    exercises: exercises,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** First dated row in the same anchor column strictly after `fromRow` (or end). */
function nextDatedRow_(values, col0, fromRow) {
  for (let r = fromRow + 1; r < values.length; r++) {
    if (values[r][col0] instanceof Date) return r;
  }
  return values.length;
}

/** When no exact date matches, list the days of the block whose dates bracket today. */
function nearestBlock_(ss, dateStr) {
  const target = dateStr;
  let best = null;
  for (const sheet of ss.getSheets()) {
    if (SKIP_NAME_RE.test(sheet.getName())) continue;
    const values = sheet.getDataRange().getValues();
    const days = [];
    for (let w = 0; w < WEEK_ANCHORS.length; w++) {
      const col = WEEK_ANCHORS[w] - 1;
      for (let r = 0; r < values.length; r++) {
        const ds = cellDateStr_(values[r][col]);
        if (!ds) continue;
        let label = '';
        for (let k = r; k < Math.min(r + 4, values.length); k++) {
          const b = String(values[k][COL_NAME - 1] || '');
          if (/^day\s*\d/i.test(b)) { label = b; break; }
        }
        days.push({ date: ds, weekNumber: w + 1, dayLabel: label });
      }
    }
    if (!days.length) continue;
    days.sort((a, b) => a.date < b.date ? -1 : 1);
    if (target >= days[0].date && target <= days[days.length - 1].date) {
      return { block: sheet.getName(), message: 'No workout dated this day (rest day?).', availableDays: days };
    }
    if (!best || Math.abs(daysBetween_(days[0].date, target)) < Math.abs(daysBetween_(best.days[0].date, target))) {
      best = { block: sheet.getName(), days: days };
    }
  }
  if (best) return { block: best.block, message: 'Nearest block.', availableDays: best.days };
  return { message: 'No block found for this date.', availableDays: [] };
}

/** A Date cell → "yyyy-MM-dd" in the sheet timezone, else "". */
function cellDateStr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TIMEZONE, 'yyyy-MM-dd');
  return '';
}

function todayStr_() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
}

function daysBetween_(a, b) {
  return (new Date(a).getTime() - new Date(b).getTime()) / 86400000;
}

/**
 * Best-effort parse of the coach's free-form "working sets" string.
 *   "4x9-10" → { sets: 4, repRange: "9-10" }
 *   "5x10-12ea" → { sets: 5, repRange: "10-12ea" }
 *   "30min" / "2x dbl, 1x triple" → { sets: null, repRange: <raw> }
 * The raw string is always preserved separately by the caller.
 */
function parsePrescription_(s) {
  const m = String(s).match(/^\s*(\d+)\s*[xX]\s*(.+?)\s*$/);
  if (m) return { sets: parseInt(m[1], 10), repRange: m[2] };
  return { sets: null, repRange: String(s).trim() };
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
