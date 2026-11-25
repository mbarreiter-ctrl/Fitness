/* Fortschrittsmodell, Vorschläge, Volumen, Gamification */

/* Erwartete Steigerung des geschätzten 1RM pro Woche bei voller Frequenz (≥ 3x/Woche dieselbe Übung).
   Orientierung: Untrainierte legen in Studien in 8–12 Wochen typischerweise 20–30 % zu,
   Trainierte (1–3 Jahre) eher 0,3–0,8 %/Woche, Erfahrene nur noch wenige Prozent pro Jahr. */
const LEVELS = {
  anf:  { name: 'Anfänger',        weekly: 0.020, windowWeeks: 4,  desc: 'Weniger als 1 Jahr' },
  fort: { name: 'Fortgeschritten', weekly: 0.005, windowWeeks: 6,  desc: '1 bis 3 Jahre' },
  erf:  { name: 'Erfahren',        weekly: 0.0015, windowWeeks: 10, desc: 'Mehr als 3 Jahre' },
};
/* Ziel fürs Körpergewicht → Faktor auf die erwartete Kraftsteigerung.
   Im Kaloriendefizit ist Kraft halten bei Trainierten bereits ein Erfolg. */
const GOALS = {
  aufbau:   { name: 'Zunehmen', short: 'Zunehmen', desc: 'Mehr essen als du verbrauchst – so wirst du am schnellsten stärker',  factor: { anf: 1.0, fort: 1.0, erf: 1.0 } },
  halten:   { name: 'Gewicht halten', short: 'Halten', desc: 'Etwa so viel essen, wie du verbrauchst',    factor: { anf: 0.85, fort: 0.75, erf: 0.6 } },
  abnehmen: { name: 'Abnehmen', short: 'Abnehmen', desc: 'Weniger essen – Gewichte im Gym zu halten ist dann schon gut',  factor: { anf: 0.4, fort: 0.1, erf: 0 } },
};
/* Wie stark eine Woche mit n Einheiten derselben Übung zählt (abnehmender Grenznutzen). */
function freqFactor(n) { return n <= 0 ? 0 : n === 1 ? 0.6 : n === 2 ? 0.9 : 1.0; }
/* Ab so vielen Tagen Pause sinkt die Kraft langsam (Kraft hält sich ca. 2–3 Wochen gut). */
const DETRAIN_AFTER_DAYS = 14;
const DETRAIN_PER_DAY = 0.001;

function e1rm(kg, reps) {
  if (!(reps > 0) || !(kg >= 0)) return 0;
  if (reps === 1) return kg;
  return kg * (1 + Math.min(reps, 15) / 30); // Epley, ab 15 Wdh. gedeckelt
}

function bodyweightAt(t) {
  const bws = S.bodyweights;
  if (!bws.length) return 75;
  let best = bws[0].kg;
  for (const b of bws) { if (b.t <= t) best = b.kg; }
  return best;
}
function currentBodyweight() {
  return S.bodyweights.length ? S.bodyweights[S.bodyweights.length - 1].kg : null;
}

/* Last eines Satzes: bei Körpergewichtsübungen zählt das Körpergewicht mit */
function setLoad(ex, kg, t) {
  return ex.bw ? bodyweightAt(t) + (kg || 0) : (kg || 0);
}

/* Alle Einheiten einer Übung, chronologisch */
function exerciseHistory(exId) {
  const ex = exById(exId);
  const out = [];
  for (const w of S.workouts) {
    const entry = w.entries.find(e => e.exId === exId);
    if (!entry) continue;
    const sets = entry.sets.filter(s => s.reps > 0);
    if (!sets.length) continue;
    let best = 0, bestSet = null, volume = 0;
    for (const s of sets) {
      const v = e1rm(setLoad(ex, s.kg, w.t), s.reps);
      volume += (s.kg || 0) * s.reps;
      if (v > best) { best = v; bestSet = s; }
    }
    out.push({ t: w.t, workoutId: w.id, e1rm: best, bestSet, sets, volume, maxReps: Math.max(...sets.map(s => s.reps)), light: !!entry.mode, note: entry.note || '' });
  }
  return out.sort((a, b) => a.t - b.t);
}

function trainedExerciseIds() {
  const ids = new Set();
  for (const w of S.workouts) for (const e of w.entries) if (e.sets.some(s => s.reps > 0)) ids.add(e.exId);
  return [...ids];
}

/* Erwartete relative Steigerung im Zeitraum [t0, t1] auf Basis der tatsächlichen Trainingsfrequenz */
function expectedGain(sessions, t0, t1) {
  const p = S.profile || { level: 'anf', goal: 'aufbau' };
  const lvl = LEVELS[p.level] || LEVELS.anf;
  const gf = (GOALS[p.goal] || GOALS.aufbau).factor[p.level] ?? 1;
  const weekly = lvl.weekly * gf;
  let gain = 0;
  // Wochen durchgehen und nach Frequenz gewichten
  for (let ws = weekStart(t0); ws <= t1; ws = shiftWeek(ws, 1)) {
    const we = shiftWeek(ws, 1);
    const from = Math.max(ws, t0), to = Math.min(we, t1);
    if (to <= from) continue;
    const n = sessions.filter(s => s.t >= ws && s.t < we).length;
    gain += weekly * freqFactor(n) * ((to - from) / (7 * DAY));
  }
  // Pausen: lange Lücken kosten etwas Kraft
  let detrain = 0;
  const pts = sessions.filter(s => s.t >= t0 && s.t <= t1).map(s => s.t);
  for (let i = 1; i < pts.length; i++) {
    const gap = (pts[i] - pts[i - 1]) / DAY;
    if (gap > DETRAIN_AFTER_DAYS) detrain += (gap - DETRAIN_AFTER_DAYS) * DETRAIN_PER_DAY;
  }
  return { gain: gain - Math.min(detrain, 0.1), weekly, detrain };
}

const STATUS = {
  gut:       { label: 'Auf Kurs',          cls: 'mint',     emoji: '🚀' },
  stark:     { label: 'Über Erwartung', cls: 'mint', emoji: '🔥' },
  langsam:   { label: 'Unter Erwartung',     cls: 'butter',   emoji: '🐢' },
  plateau:   { label: 'Stagniert',        cls: 'rose',     emoji: '⛰️' },
  rueckgang: { label: 'Rückgang',          cls: 'rose',     emoji: '📉' },
  halten:    { label: 'Kraft gehalten',    cls: 'sky',      emoji: '🛡️' },
  pause:     { label: 'Lange Pause',       cls: 'lavender', emoji: '💤' },
  neu:       { label: 'Noch zu wenig Daten',     cls: 'lavender', emoji: '🌱' },
};

/* Kernanalyse einer Übung */
function analyzeExercise(exId, now = Date.now()) {
  const all = exerciseHistory(exId);
  // Bewusst leichte Einheiten (Deload, Wiedereinstieg) zählen nicht in den Trend
  const hist = all.filter(h => !h.light && h.e1rm > 0); // Sätze ohne Gewicht bei Gewichtsübungen sind nicht vergleichbar
  const p = S.profile || { level: 'anf', goal: 'aufbau' };
  const lvl = LEVELS[p.level] || LEVELS.anf;
  const res = { exId, hist: all, trendHist: hist, status: 'neu', reg: null };
  if (!all.length) return res;
  res.daysSinceLast = (now - all[all.length - 1].t) / DAY;
  if (!hist.length) return res;
  const last = hist[hist.length - 1];

  const t0 = now - lvl.windowWeeks * 7 * DAY;
  let win = hist.filter(h => h.t >= t0);
  // Mindestens 4 Einheiten betrachten – aber nur, wenn sie nicht zu weit zurückliegen
  if (win.length < 4) {
    const last4 = hist.slice(-4);
    if (last4[0].t >= now - lvl.windowWeeks * 2 * 7 * DAY) win = last4;
  }
  // Langfristige Entwicklung: Schnitt der ersten 3 vs. letzten 3 Einheiten
  if (hist.length >= 4) {
    const k = Math.min(3, Math.floor(hist.length / 2));
    const avg = arr => arr.reduce((x, h) => x + h.e1rm, 0) / arr.length;
    res.longTermPct = (avg(hist.slice(-k)) / avg(hist.slice(0, k)) - 1) * 100;
    res.longTermFrom = hist[0].t;
  }
  if (!win.length) { res.status = res.daysSinceLast > 28 ? 'pause' : 'neu'; return res; }
  res.window = win;
  res.windowStart = win[0].t;
  const spanDays = (last.t - win[0].t) / DAY;
  res.spanDays = spanDays;

  if (win.length >= 2) {
    const xs = win.map(h => (h.t - win[0].t) / DAY);
    const ys = win.map(h => h.e1rm);
    res.reg = robustReg(xs, ys);
  }
  if (win.length < 3 || spanDays < 10 || !res.reg) {
    res.status = res.daysSinceLast > 28 ? 'pause' : 'neu';
    return res;
  }
  const mean = win.reduce((a, h) => a + h.e1rm, 0) / win.length;
  const startVal = res.reg.a;
  const actualAbs = res.reg.b * spanDays;
  const actual = actualAbs / (startVal || mean);
  const exp = expectedGain(hist, win[0].t, last.t);
  res.actualPct = actual * 100;
  res.expectedPct = exp.gain * 100;
  res.kgPerWeek = res.reg.b * 7;
  res.expectedKgPerWeek = exp.weekly * mean;
  res.ratio = exp.gain > 0.004 ? actual / exp.gain : null;

  if (res.daysSinceLast > 28) res.status = 'pause';
  else if (actual < -0.03) res.status = 'rueckgang';
  else if (res.ratio === null) res.status = actual >= 0.03 ? 'gut' : actual >= Math.min(-0.02, exp.gain - 0.02) ? 'halten' : 'rueckgang';
  else if (res.ratio >= 1.4) res.status = 'stark';
  else if (res.ratio >= 0.7) res.status = 'gut';
  else if (res.ratio >= 0.3 || win.length < 4 || spanDays < 21) res.status = 'langsam';
  else res.status = 'plateau';
  return res;
}

/* Gewichtsvorschlag für die nächste Einheit */
function suggestWeight(exId, repsMin = 8, repsMax = 12) {
  const ex = exById(exId);
  const a = analyzeExercise(exId);
  if (!a.hist.length) {
    return { type: 'neu', kg: null, text: 'Neue Übung. Nimm ein Gewicht, bei dem noch 2–3 Wiederholungen gehen würden.' };
  }
  const lastAny = a.hist[a.hist.length - 1];
  const last = a.trendHist.length ? a.trendHist[a.trendHist.length - 1] : lastAny;
  const topKg = Math.max(...last.sets.map(s => s.kg || 0));
  const topSets = last.sets.filter(s => (s.kg || 0) === topKg);
  const minReps = Math.min(...topSets.map(s => s.reps));
  let inc = ex.inc || 2.5;
  if (topKg > 0 && topKg < 12 && inc > 1) inc = 1;
  const goal = S.profile?.goal;

  if (ex.bw && topKg === 0) {
    if (minReps >= repsMax) return { type: 'up', kg: 0, text: `${repsMax}+ Wdh. geschafft. Zeit für Zusatzgewicht oder eine schwerere Variante.` };
    return { type: 'hold', kg: 0, text: `Ziel: ${minReps + 1} Wdh. pro Satz.` };
  }
  if (a.daysSinceLast > 21) {
    const kg = Math.max(0, floorTo(topKg * 0.9, inc));
    return { type: 'return', kg, text: `${Math.round(a.daysSinceLast)} Tage Pause. Steig mit ${fmt(kg)} kg wieder ein (−10 %).` };
  }
  if (lastAny.light && lastAny !== last) {
    return { type: 'hold', kg: topKg, text: `Zurück auf ${fmt(topKg)} kg.` };
  }
  if (a.status === 'plateau' || a.status === 'rueckgang') {
    const kg = Math.max(0, floorTo(topKg * 0.9, inc));
    return {
      type: 'deload', kg,
      text: `Kein Fortschritt seit Wochen. Mach eine leichte Einheit mit ${fmt(kg)} kg – oder wechsel zu ${repsMax > 8 ? '5–8' : '10–15'} Wdh.`,
    };
  }
  if (minReps >= repsMax) {
    const kg = topKg + inc;
    return { type: 'up', kg, text: `Letztes Mal ${repsMax}+ Wdh. in jedem Satz. Jetzt ${fmt(kg)} kg.` };
  }
  if (goal === 'abnehmen' && S.profile?.level !== 'anf') {
    return { type: 'hold', kg: topKg, text: `${fmt(topKg)} kg halten, Ziel ${Math.min(minReps + 1, repsMax)} Wdh. Beim Abnehmen reicht das.` };
  }
  return { type: 'hold', kg: topKg, text: `${fmt(topKg)} kg, Ziel ${Math.min(minReps + 1, repsMax)} Wdh. pro Satz.` };
}

/* Sätze pro Muskelgruppe in einem Zeitraum (primär = 1, sekundär = 0,5) */
function muscleSets(fromT, toT = Date.now()) {
  const out = Object.fromEntries(Object.keys(MUSCLES).map(k => [k, 0]));
  for (const w of S.workouts) {
    if (w.t < fromT || w.t > toT) continue;
    for (const e of w.entries) {
      const ex = exById(e.exId);
      const n = e.sets.filter(s => s.reps > 0).length;
      for (const m of ex.primary) if (m in out) out[m] += n;
      for (const m of ex.secondary) if (m in out) out[m] += n * 0.5;
    }
  }
  return out;
}
/* Einordnung Sätze pro Woche (Richtwert aus Dosis-Wirkungs-Studien: ~10–20 harte Sätze/Woche) */
function volumeZone(setsPerWeek) {
  if (setsPerWeek < 0.5) return { label: 'nicht trainiert', cls: 'none' };
  if (setsPerWeek < 6) return { label: 'wenig', cls: 'low' };
  if (setsPerWeek < 10) return { label: 'Erhalt', cls: 'mid' };
  if (setsPerWeek <= 20) return { label: 'optimal', cls: 'good' };
  return { label: 'sehr viel', cls: 'high' };
}

function workoutVolume(w) {
  let v = 0;
  for (const e of w.entries) for (const s of e.sets) if (s.reps > 0) v += (s.kg || 0) * s.reps;
  return v;
}
function workoutSetCount(w) {
  return w.entries.reduce((a, e) => a + e.sets.filter(s => s.reps > 0).length, 0);
}

/* Persönliche Rekorde (bester geschätzter 1RM), chronologisch erkannt */
function allPRs() {
  const best = {};
  const prs = [];
  const sorted = [...S.workouts].sort((a, b) => a.t - b.t);
  for (const w of sorted) {
    for (const e of w.entries) {
      const ex = exById(e.exId);
      let top = 0, topSet = null;
      for (const s of e.sets) if (s.reps > 0) {
        const v = e1rm(setLoad(ex, s.kg, w.t), s.reps);
        if (v > top) { top = v; topSet = s; }
      }
      if (!top) continue;
      if (best[e.exId] !== undefined && top > best[e.exId] * 1.001) prs.push({ t: w.t, exId: e.exId, e1rm: top, set: topSet, workoutId: w.id, prev: best[e.exId] });
      if (best[e.exId] === undefined || top > best[e.exId]) best[e.exId] = top;
    }
  }
  return prs;
}

/* Sessions = Krafttrainings + eingetragene Aktivitäten */
function allSessions() {
  return S.workouts.map(w => ({ t: w.t, minutes: w.durationMin, kind: 'kraft' }))
    .concat(S.activities.map(a => ({ t: a.t, minutes: a.minutes, kind: a.type })));
}

function weeklyStreak() {
  const target = S.profile?.weeklyTarget || 3;
  const counts = {};
  for (const s of allSessions()) { const k = weekStart(s.t); counts[k] = (counts[k] || 0) + 1; }
  let ws = weekStart(Date.now());
  let streak = 0;
  if ((counts[ws] || 0) >= target) streak++;
  ws = shiftWeek(ws, -1);
  while ((counts[ws] || 0) >= target) { streak++; ws = shiftWeek(ws, -1); }
  return { streak, thisWeek: counts[weekStart(Date.now())] || 0, target };
}

/* XP und Level – vollständig aus den Daten berechnet */
function computeXP() {
  let xp = 0;
  for (const w of S.workouts) xp += 40 + Math.min(workoutSetCount(w), 30) * 3;
  for (const a of S.activities) xp += Math.round(Math.min(a.minutes, 120) * 0.6);
  xp += allPRs().length * 20;
  xp += S.bodyweights.length * 5;
  xp += weeklyStreak().streak * 30;
  return xp;
}
function levelFromXP(xp) {
  let lvl = 1, need = 120, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = Math.round(120 * Math.pow(lvl, 1.35)); }
  return { level: lvl, into: xp - acc, need, title: LEVEL_TITLES[Math.min(lvl - 1, LEVEL_TITLES.length - 1)] };
}
const LEVEL_TITLES = ['Neuling', 'Starter', 'Dranbleiber', 'Eisenfreund', 'Hantelheld', 'Kraftpaket', 'Gewichtheber', 'Stahlwerk', 'Titan', 'Legende'];

const BADGES = [
  { id: 'first', emoji: '🌱', name: 'Erster Schritt', desc: 'Erstes Training', test: c => c.sessions >= 1 },
  { id: 's10', emoji: '🔟', name: 'Zehner', desc: '10 Trainings', test: c => c.sessions >= 10 },
  { id: 's50', emoji: '🏅', name: 'Halbes Hundert', desc: '50 Trainings', test: c => c.sessions >= 50 },
  { id: 's100', emoji: '💯', name: 'Hundert', desc: '100 Trainings', test: c => c.sessions >= 100 },
  { id: 'pr1', emoji: '⭐', name: 'Rekord!', desc: 'Erster persönlicher Rekord', test: c => c.prs >= 1 },
  { id: 'pr25', emoji: '🌟', name: 'Rekordjäger', desc: '25 Rekorde', test: c => c.prs >= 25 },
  { id: 'streak4', emoji: '🔥', name: 'Im Flow', desc: '4 Wochen Wochenziel in Folge', test: c => c.streak >= 4 },
  { id: 'streak12', emoji: '☄️', name: 'Unaufhaltsam', desc: '12 Wochen in Folge', test: c => c.streak >= 12 },
  { id: 'ton10', emoji: '🏗️', name: 'Tonnenschieber', desc: '10 t in einem Training', test: c => c.maxVol >= 10000 },
  { id: 'ton100', emoji: '🚛', name: 'Schwertransport', desc: '100 t insgesamt', test: c => c.totalVol >= 100000 },
  { id: 'allround', emoji: '🧩', name: 'Allrounder', desc: '12 Muskelgruppen in einer Woche', test: c => c.maxMuscleWeek >= 12 },
  { id: 'cardio', emoji: '💨', name: 'Ausdauernd', desc: '10 andere Workouts', test: c => c.acts >= 10 },
  { id: 'scale', emoji: '⚖️', name: 'Im Blick', desc: '5× Körpergewicht eingetragen', test: c => c.bws >= 5 },
  { id: 'early', emoji: '🌅', name: 'Frühaufsteher', desc: 'Training vor 7 Uhr', test: c => c.early },
];
function badgeContext() {
  const vols = S.workouts.map(workoutVolume);
  let maxMuscleWeek = 0;
  const weeks = new Set(S.workouts.map(w => weekStart(w.t)));
  for (const ws of weeks) {
    const m = muscleSets(ws, shiftWeek(ws, 1) - 1);
    maxMuscleWeek = Math.max(maxMuscleWeek, Object.values(m).filter(v => v >= 1).length);
  }
  return {
    sessions: S.workouts.length + S.activities.length,
    prs: allPRs().length,
    streak: weeklyStreak().streak,
    maxVol: vols.length ? Math.max(...vols) : 0,
    totalVol: vols.reduce((a, b) => a + b, 0),
    maxMuscleWeek,
    acts: S.activities.length,
    bws: S.bodyweights.length,
    early: allSessions().some(s => new Date(s.t).getHours() < 7),
  };
}
function earnedBadges() {
  const c = badgeContext();
  return BADGES.map(b => ({ ...b, earned: !!b.test(c) }));
}

/* Kraftvergleich mit Richtwerten */
function strengthStandard(exId) {
  const sex = S.profile?.sex;
  const table = STRENGTH_STANDARDS[sex === 'w' ? 'w' : 'm'];
  if (!table[exId] || !sex || sex === 'x') return null;
  const hist = exerciseHistory(exId);
  if (!hist.length) return null;
  const recent = hist.filter(h => h.t > Date.now() - 56 * DAY);
  const best = Math.max(...(recent.length ? recent : hist).map(h => h.e1rm));
  const bw = currentBodyweight() || bodyweightAt(Date.now());
  const ratio = best / bw;
  const th = table[exId];
  let idx = -1;
  for (let i = 0; i < th.length; i++) if (ratio >= th[i]) idx = i;
  const next = idx + 1 < th.length ? th[idx + 1] : null;
  return { ratio, best, bw, idx, label: idx >= 0 ? STANDARD_LABELS[idx] : 'Unter Untrainiert', thresholds: th, next, nextKg: next ? next * bw : null };
}

/* Körpergewicht: Trend in kg pro Woche über die letzten 6 Wochen */
function bodyweightTrend() {
  const pts = S.bodyweights.filter(b => b.t > Date.now() - 42 * DAY);
  if (pts.length < 2 || (pts[pts.length - 1].t - pts[0].t) < 7 * DAY) return null;
  const reg = linreg(pts.map(p => (p.t - pts[0].t) / DAY), pts.map(p => p.kg));
  if (!reg) return null;
  const perWeek = reg.b * 7;
  const bw = pts[pts.length - 1].kg;
  const pctWeek = perWeek / bw * 100;
  const goal = S.profile?.goal;
  const lvl = S.profile?.level;
  let verdict;
  // Richtwerte: Aufbau ~0,25–0,5 %/Woche (Anfänger) bzw. ~0,1–0,25 % (Trainierte); Abnehmen ~0,5–1 %/Woche
  if (goal === 'aufbau') {
    const [lo, hi] = lvl === 'anf' ? [0.15, 0.5] : [0.05, 0.25];
    verdict = pctWeek < lo ? 'Zunahme langsamer als empfohlen' : pctWeek > hi ? 'Zunahme schneller als nötig – mehr Fett als Muskel' : 'Zunahme im empfohlenen Bereich';
  } else if (goal === 'abnehmen') {
    verdict = pctWeek > -0.25 ? 'Kaum Abnahme – Defizit etwas erhöhen' : pctWeek < -1.0 ? 'Sehr schnelle Abnahme – Muskelverlust droht' : 'Abnahme im empfohlenen Bereich';
  } else {
    verdict = Math.abs(pctWeek) <= 0.2 ? 'Gewicht stabil' : pctWeek > 0 ? 'Gewicht steigt leicht' : 'Gewicht sinkt leicht';
  }
  return { perWeek, pctWeek, verdict, reg, pts };
}
