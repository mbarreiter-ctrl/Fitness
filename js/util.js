/* Hilfsfunktionen und Speicherung */

const DAY = 86400000;
const STORE_KEY = 'formkurve.v1';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function emptyState() {
  return {
    profile: null,
    bodyweights: [],     // {t, kg}
    plans: [],           // {id, name, color, items:[{exId, sets, repsMin, repsMax}]}
    workouts: [],        // {id, t, durationMin, name, planId, entries:[{exId, sets:[{kg, reps}]}]}
    activities: [],      // {id, t, type, minutes, note}
    customExercises: [], // wie EXERCISES
    active: null,
    meta: { lastLevelCheck: 0, seenBadges: [] },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyState();
    return Object.assign(emptyState(), JSON.parse(raw));
  } catch (e) {
    return emptyState();
  }
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { console.warn('Speichern fehlgeschlagen', e); }
}

function exById(id) {
  return EX_BY_ID[id] || (S.customExercises || []).find(e => e.id === id) || { id, name: 'Unbekannte Übung', equip: '', primary: [], secondary: [], type: 'i', inc: 2.5 };
}
function allExercises() {
  return EXERCISES.concat(S.customExercises || []);
}

function num(v) {
  if (v === null || v === undefined || v === '') return NaN;
  return parseFloat(String(v).replace(',', '.'));
}
function fmt(n, d = 1) {
  if (!isFinite(n)) return '–';
  return n.toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: 0 });
}
function fmtPct(n, d = 1) {
  if (!isFinite(n)) return '–';
  const s = n > 0 ? '+' : '';
  return s + fmt(n, d) + ' %';
}
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function startOfDay(t) { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
function weekStart(t) {
  const d = new Date(startOfDay(t));
  const wd = (d.getDay() + 6) % 7; // Montag = 0
  d.setDate(d.getDate() - wd);
  return d.getTime();
}
function shiftWeek(ws, n) { const d = new Date(ws); d.setDate(d.getDate() + 7 * n); return d.getTime(); }
function fmtDate(t, opts = { day: 'numeric', month: 'short' }) {
  return new Date(t).toLocaleDateString('de-DE', opts);
}
function fmtDateLong(t) {
  return new Date(t).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}
function relDay(t) {
  const d = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY);
  if (d === 0) return 'Heute';
  if (d === 1) return 'Gestern';
  if (d < 7) return `vor ${d} Tagen`;
  return fmtDate(t);
}
function fmtDuration(min) {
  min = Math.round(min);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60 ? (min % 60) + ' min' : ''}`.trim();
}
function toDateInput(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fromDateInput(v) {
  const [y, m, d] = v.split('-').map(Number);
  const now = new Date();
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes()).getTime();
}

function roundTo(x, step) {
  if (!step) return Math.round(x * 10) / 10;
  return Math.round(x / step) * step;
}
function floorTo(x, step) {
  if (!step) return Math.floor(x * 10) / 10;
  return Math.floor(x / step + 1e-9) * step;
}

function linreg(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; syy += ys[i] * ys[i]; }
  const den = n * sxx - sx * sx;
  if (den === 0) return null;
  const b = (n * sxy - sx * sy) / den;
  const a = (sy - b * sx) / n;
  const ssTot = syy - sy * sy / n;
  let ssRes = 0;
  for (let i = 0; i < n; i++) { const r = ys[i] - (a + b * xs[i]); ssRes += r * r; }
  return { a, b, r2: ssTot > 0 ? 1 - ssRes / ssTot : 0 };
}

/* Robuste lineare Regression (Huber-gewichtet): wie normale lineare Regression,
   aber einzelne Ausreißer (ein schlechter Tag) bekommen weniger Gewicht. */
function robustReg(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  let w = new Array(n).fill(1), fit = null;
  for (let iter = 0; iter < 4; iter++) {
    let sw = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { sw += w[i]; sx += w[i] * xs[i]; sy += w[i] * ys[i]; sxx += w[i] * xs[i] * xs[i]; sxy += w[i] * xs[i] * ys[i]; }
    const den = sw * sxx - sx * sx;
    if (den === 0) return fit;
    const b = (sw * sxy - sx * sy) / den, a = (sy - b * sx) / sw;
    fit = { a, b };
    const res = xs.map((x, i) => ys[i] - (a + b * x));
    const mad = [...res.map(Math.abs)].sort((p, q) => p - q)[n >> 1] * 1.4826 || 1e-9;
    const k = 1.5 * mad;
    w = res.map(r => Math.abs(r) <= k ? 1 : k / Math.abs(r));
  }
  return fit;
}
