/* Oberfläche */

let S = loadState();
const ui = {
  tab: 'heute',
  modal: null,        // {type, ...}
  onb: { step: 0, d: { name: '', sex: null, level: null, kg: 75, goal: null, weeklyTarget: 3 } },
  showActive: true,
  restStart: null,
  muscleRange: 7,
  histFilter: 'alle',
  stack: [],          // darunterliegende Modals
};
let _ac = {};
const A = id => (_ac[id] ||= analyzeExercise(id));

const COLORS = ['lavender', 'mint', 'peach', 'sky', 'butter', 'rose'];
const cvar = c => `var(--${c}-deep)`;

const TEMPLATES = [
  { name: 'Push', color: 'peach', items: ['bankdruecken', 'schulterdruecken_kh', 'schraegbank_kh', 'seitheben', 'trizeps_seil'] },
  { name: 'Pull', color: 'sky', items: ['klimmzuege', 'rudern_lh', 'latzug', 'face_pulls', 'curls_sz', 'hammercurls'] },
  { name: 'Legs', color: 'butter', items: ['kniebeuge', 'rumaenisches_kh', 'beinpresse', 'beinbeuger_liegend', 'wadenheben_stehend'] },
];
const DEMO_PLANS = [
  { name: 'Ganzkörper A', color: 'lavender', items: ['kniebeuge', 'bankdruecken', 'rudern_lh', 'schulterdruecken_kh', 'beinbeuger_sitzend', 'plank'] },
  { name: 'Ganzkörper B', color: 'mint', items: ['kreuzheben', 'schraegbank_kh', 'latzug', 'ausfallschritte', 'seitheben', 'curls_kh'] },
];
function lightMode(sug) { return sug.type === 'deload' || sug.type === 'return' ? sug.type : undefined; }
function defaultReps(exId) { return exById(exId).type === 'c' ? [6, 10] : [10, 15]; }
function planItem(exId) { const [a, b] = defaultReps(exId); return { exId, sets: 3, repsMin: a, repsMax: b }; }

/* ---------- Render ---------- */

const root = document.getElementById('app');
function render() {
  _ac = {};
  if (!ui.modal) ui.stack = [];
  if (!S.profile) { root.innerHTML = viewOnboarding(); document.getElementById('modal-root').innerHTML = ''; document.getElementById('nav-root').innerHTML = ''; return; }
  if (S.active && ui.showActive) {
    root.innerHTML = viewActive();
    document.getElementById('nav-root').innerHTML = restPill();
  } else {
    const views = { heute: viewToday, plaene: viewPlans, verlauf: viewHistory, daten: viewData, profil: viewProfile };
    root.innerHTML = views[ui.tab]();
    document.getElementById('nav-root').innerHTML = tabbar();
  }
  const mr = document.getElementById('modal-root');
  const fresh = ui.modal !== ui._lastModal;
  const prevScroll = mr.querySelector('.sheet')?.scrollTop || 0;
  ui._lastModal = ui.modal;
  mr.className = fresh ? '' : 'noanim';
  mr.innerHTML = ui.modal ? viewModal() : '';
  if (!fresh && ui.modal) { const sh = mr.querySelector('.sheet'); if (sh) sh.scrollTop = prevScroll; }
}

function tabbar() {
  const hasAlert = trainedExerciseIds().some(id => ['plateau', 'rueckgang'].includes(A(id).status));
  const tabs = [['heute', '🏠', 'Heute'], ['plaene', '📋', 'Pläne'], ['verlauf', '🗓️', 'Verlauf'], ['daten', '📈', 'Daten'], ['profil', '🙂', 'Profil']];
  return `<nav class="tabbar"><div class="inner">${tabs.map(([id, i, l]) =>
    `<button class="tab ${ui.tab === id ? 'on' : ''}" data-a="tab" data-v="${id}"><span class="i">${i}</span>${l}${id === 'daten' && hasAlert ? '<span class="dot"></span>' : ''}</button>`).join('')}</div></nav>`;
}

function header(title, eyebrow = '', right = '') {
  return `<header class="top"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div>${right}</header>`;
}

/* ---------- Onboarding ---------- */

function viewOnboarding() {
  const o = ui.onb, d = o.d, steps = 5;
  const dots = `<div class="dots">${Array.from({ length: steps }, (_, i) => `<i class="${i <= o.step ? 'on' : ''}"></i>`).join('')}</div>`;
  let body = '', canNext = true;
  if (o.step === 0) {
    body = `<div class="big">Willkommen 👋</div>
      <p class="lead">Ein paar kurze Fragen, damit Vergleichswerte und Gewichtsvorschläge zu dir passen. Alles bleibt auf deinem Gerät.</p>
      <label class="f">Wie dürfen wir dich nennen? (optional)</label>
      <input class="input" data-in="onb" data-f="name" value="${esc(d.name)}" placeholder="Vorname">`;
  } else if (o.step === 1) {
    canNext = !!d.sex;
    body = `<div class="big">Für die Kraft-Richtwerte</div>
      <p class="lead">Kraftstandards unterscheiden sich deutlich zwischen Männern und Frauen. Ohne Angabe vergleicht die App nur mit deinem eigenen Verlauf.</p><div style="margin-top:18px">
      ${[['m', 'Männlich'], ['w', 'Weiblich'], ['x', 'Keine Angabe']].map(([v, l]) => `<button class="choice ${d.sex === v ? 'on' : ''}" data-a="onbSet" data-f="sex" data-v="${v}"><div class="t">${l}</div></button>`).join('')}</div>`;
  } else if (o.step === 2) {
    canNext = !!d.level;
    body = `<div class="big">Wie erfahren bist du?</div>
      <p class="lead">Davon hängt ab, welche Steigerung realistisch ist – und wann die App eine Stagnation meldet.</p><div style="margin-top:18px">
      ${Object.entries(LEVELS).map(([k, l]) => `<button class="choice ${d.level === k ? 'on' : ''}" data-a="onbSet" data-f="level" data-v="${k}"><div class="t">${l.name}</div><div class="s">${l.desc}</div></button>`).join('')}</div>`;
  } else if (o.step === 3) {
    canNext = !!d.goal;
    body = `<div class="big">Dein Körpergewicht</div>
      <div class="stepper"><button data-a="onbKg" data-v="-0.5">−</button><div class="v">${fmt(d.kg)}<span class="muted" style="font-size:20px"> kg</span></div><button data-a="onbKg" data-v="0.5">+</button></div>
      <label class="f" style="margin-top:26px">Was ist dein Ziel?</label>
      ${Object.entries(GOALS).map(([k, g]) => `<button class="choice ${d.goal === k ? 'on' : ''}" data-a="onbSet" data-f="goal" data-v="${k}"><div class="t">${g.name}</div><div class="s">${{ aufbau: 'Du isst mehr, als du verbrauchst – beste Voraussetzung, stärker zu werden', halten: 'Du isst etwa so viel, wie du verbrauchst – solider Fortschritt', abnehmen: 'Beim Abnehmen fehlt Energie für Kraftzuwachs – gleichbleibende Gewichte sind hier schon gut' }[k]}</div></button>`).join('')}`;
  } else {
    body = `<div class="big">Wie oft pro Woche?</div>
      <p class="lead">Dein Wochenziel für Trainings (Kraft und andere Workouts). Daraus entstehen deine Serien 🔥</p>
      <div class="stepper"><button data-a="onbTarget" data-v="-1">−</button><div class="v">${d.weeklyTarget}×</div><button data-a="onbTarget" data-v="1">+</button></div>`;
  }
  return `<div class="onb">${dots}${body}<div class="foot">
    <button class="btn" data-a="onbNext" ${canNext ? '' : 'disabled style="opacity:.4"'}>${o.step === steps - 1 ? 'Los geht’s' : 'Weiter'}</button>
    ${o.step > 0 ? '<button class="btn ghost" data-a="onbBack" style="margin-top:6px">Zurück</button>' : ''}</div></div>`;
}

/* ---------- Heute ---------- */

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

function reminders() {
  const out = [];
  const lastBw = S.bodyweights[S.bodyweights.length - 1];
  const bwInt = S.profile.bwInterval ?? 14;
  if (bwInt > 0 && (!lastBw || Date.now() - lastBw.t > bwInt * DAY)) {
    out.push(`<div class="card tint-butter"><div class="row"><div style="font-size:28px">⚖️</div><div class="grow"><h3>Zeit fürs Wiegen</h3><div class="sub">Letzter Eintrag ${lastBw ? relDay(lastBw.t) : '–'}. Dein Gewicht fließt in Vergleichswerte ein.</div></div><button class="btn sm" data-a="modal" data-v="bodyweight">Eintragen</button></div></div>`);
  }
  const p = S.profile;
  if (Date.now() - (p.levelSetAt || 0) > 120 * DAY && S.workouts.length > 10) {
    out.push(`<div class="card tint-lavender"><div class="row"><div style="font-size:28px">🎓</div><div class="grow"><h3>Passt deine Einstufung noch?</h3><div class="sub">Du bist als „${LEVELS[p.level].name}“ eingestuft. Das bestimmt, welche Steigerung erwartet wird.</div></div><button class="btn sm" data-a="modal" data-v="level">Prüfen</button></div></div>`);
  } else {
    const up = levelUpHint();
    if (up) out.push(`<div class="card tint-lavender"><div class="row"><div style="font-size:28px">🎓</div><div class="grow"><h3>Du bist stärker geworden</h3><div class="sub">${up}</div></div><button class="btn sm" data-a="modal" data-v="level">Ansehen</button></div></div>`);
  }
  return out.join('');
}
function levelUpHint() {
  const p = S.profile;
  if (p.level === 'erf' || !p.sex || p.sex === 'x') return null;
  const target = p.level === 'anf' ? 2 : 3;
  const keys = Object.keys(STRENGTH_STANDARDS.m).map(strengthStandard).filter(Boolean);
  const above = keys.filter(k => k.idx >= target).length;
  if (keys.length >= 2 && above >= 2) return `Bei ${above} Grundübungen liegst du schon im Bereich „${STANDARD_LABELS[target]}“. Eine höhere Einstufung macht die Erwartungen realistischer.`;
  return null;
}

function stagnationCards(limit = 3) {
  const ids = trainedExerciseIds().filter(id => ['plateau', 'rueckgang'].includes(A(id).status) && !A(id).hist.at(-1).light);
  return ids.slice(0, limit).map(id => {
    const a = A(id), ex = exById(id);
    return `<button class="card tint-rose" style="display:block;width:100%;text-align:left" data-a="exDetail" data-v="${id}">
      <div class="row"><div style="font-size:28px">${STATUS[a.status].emoji}</div><div class="grow"><h3>${esc(ex.name)}: ${STATUS[a.status].label}</h3>
      <div class="sub">${fmtPct(a.actualPct)} in ${Math.round(a.spanDays / 7)} Wochen – erwartet wären ca. ${fmtPct(a.expectedPct)}. Tippe für einen Vorschlag.</div></div><span class="chev">›</span></div></button>`;
  }).join('');
}

function viewToday() {
  const p = S.profile;
  const st = weeklyStreak();
  const lv = levelFromXP(computeXP());
  const initial = (p.name || '🙂').slice(0, 1).toUpperCase();
  let html = header(`${greeting()}${p.name ? ', ' + esc(p.name) : ''}`, fmtDateLong(Date.now()), `<button class="avatar" data-a="tab" data-v="profil">${esc(initial)}</button>`);

  if (S.active) {
    const min = Math.floor((Date.now() - S.active.start) / 60000);
    html += `<div class="card tint-mint" style="margin-bottom:12px"><div class="row"><div style="font-size:28px">⏱️</div><div class="grow"><h3>Training läuft</h3><div class="sub">${esc(S.active.name)} · seit ${min} min</div></div><button class="btn sm" data-a="resume">Weiter</button></div></div>`;
  }

  html += `<div class="card"><div class="row">
      ${ring(st.thisWeek / st.target, 'var(--lavender-deep)', 76, 9, `<div><div style="font-size:20px">${st.thisWeek}/${st.target}</div><div class="muted" style="font-size:10px">Woche</div></div>`)}
      <div class="grow"><h3>${st.thisWeek >= st.target ? 'Wochenziel geschafft! 🎉' : `Noch ${st.target - st.thisWeek} ${st.target - st.thisWeek === 1 ? 'Training' : 'Trainings'} diese Woche`}</h3>
      <div class="sub">🔥 ${st.streak} ${st.streak === 1 ? 'Woche' : 'Wochen'} in Folge · Level ${lv.level} ${lv.title}</div>
      <div class="bar" style="margin-top:10px"><i style="width:${lv.into / lv.need * 100}%;background:var(--lavender-deep)"></i></div></div></div></div>`;

  html += `<div class="grid2" style="margin-top:12px">
    <button class="btn" data-a="startEmpty">🏋️ Training starten</button>
    <button class="btn lav" data-a="modal" data-v="activity">⏱️ Workout eintragen</button></div>`;

  html += reminders() ? `<div class="stack" style="margin-top:12px">${reminders()}</div>` : '';
  const stag = stagnationCards();
  if (stag) html += `<div class="section-title"><h2>Achtung, Plateau</h2></div><div class="stack">${stag}</div>`;

  html += `<div class="section-title"><h2>Deine Pläne</h2><button class="link" data-a="tab" data-v="plaene">Alle</button></div>`;
  if (S.plans.length) {
    html += `<div class="list">${S.plans.slice(0, 4).map(pl => {
      const last = S.workouts.filter(w => w.planId === pl.id).sort((a, b) => b.t - a.t)[0];
      return `<button class="li" data-a="startPlan" data-v="${pl.id}"><div class="ico" style="background:var(--${pl.color})">▶︎</div>
      <div class="grow"><div class="t">${esc(pl.name)}</div><div class="s">${pl.items.length} Übungen${last ? ' · zuletzt ' + relDay(last.t) : ''}</div></div><span class="chev">›</span></button>`;
    }).join('')}</div>`;
  } else {
    html += `<button class="card tint-sky" style="display:block;width:100%;text-align:left" data-a="modal" data-v="templates"><h3>📋 Ersten Plan erstellen</h3><div class="sub">Starte mit einer Vorlage – Push, Pull oder Legs – oder stell dir selbst einen zusammen.</div></button>`;
  }

  const recent = [...S.workouts.map(w => ({ ...w, kind: 'w' })), ...S.activities.map(a => ({ ...a, kind: 'a' }))].sort((a, b) => b.t - a.t).slice(0, 3);
  if (recent.length) {
    html += `<div class="section-title"><h2>Zuletzt</h2><button class="link" data-a="tab" data-v="verlauf">Verlauf</button></div><div class="list">${recent.map(historyItem).join('')}</div>`;
  }
  return html;
}

/* ---------- Pläne ---------- */

function viewPlans() {
  let html = header('Pläne', 'Trainingspläne', `<button class="icon-btn" data-a="newPlan">＋</button>`);
  if (!S.plans.length) {
    html += `<div class="card empty"><div class="e">📋</div><div>Noch keine Pläne.</div></div>`;
  } else {
    html += S.plans.map(pl => {
      const vals = {};
      pl.items.forEach(it => { const ex = exById(it.exId); ex.primary.forEach(m => vals[m] = (vals[m] || 0) + it.sets); ex.secondary.forEach(m => vals[m] = (vals[m] || 0) + it.sets * 0.5); });
      const muscles = Object.entries(vals).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => MUSCLES[m].name);
      return `<div class="card" style="border-left:6px solid var(--${pl.color}-deep)"><div class="row between"><div class="grow"><h3>${esc(pl.name)}</h3><div class="sub">${pl.items.length} Übungen · ${pl.items.reduce((a, i) => a + i.sets, 0)} Sätze</div></div>
        <button class="icon-btn" data-a="editPlan" data-v="${pl.id}">✎</button></div>
        <div class="chips" style="margin-top:10px">${muscles.map(m => `<span class="muscle-chip">${m}</span>`).join('')}</div>
        <div class="sub small" style="margin-top:10px">${pl.items.map(i => esc(exById(i.exId).name)).join(' · ')}</div>
        <button class="btn ${pl.color === 'butter' ? 'peach' : 'lav'}" style="margin-top:12px" data-a="startPlan" data-v="${pl.id}">▶︎ Starten</button></div>`;
    }).join('');
  }
  html += `<div class="section-title"><h2>Vorlagen</h2></div><button class="btn soft" data-a="modal" data-v="templates">Aus Vorlage erstellen</button>`;
  return html;
}

/* ---------- Verlauf ---------- */

function historyItem(it) {
  if (it.kind === 'w') {
    return `<button class="li" data-a="workoutDetail" data-v="${it.id}"><div class="ico" style="background:var(--lavender)">🏋️</div>
      <div class="grow"><div class="t">${esc(it.name)}</div><div class="s">${relDay(it.t)} · ${fmtDuration(it.durationMin)} · ${workoutSetCount(it)} Sätze · ${fmt(workoutVolume(it) / 1000, 1)} t</div></div><span class="chev">›</span></button>`;
  }
  const t = ACTIVITY_TYPES.find(a => a.id === it.type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
  return `<button class="li" data-a="activityDetail" data-v="${it.id}"><div class="ico" style="background:var(--mint)">${t.emoji}</div>
    <div class="grow"><div class="t">${esc(t.name)}${it.note ? ' · ' + esc(it.note) : ''}</div><div class="s">${relDay(it.t)} · ${fmtDuration(it.minutes)}</div></div><span class="chev">›</span></button>`;
}

function viewHistory() {
  let html = header('Verlauf', `${S.workouts.length + S.activities.length} Einträge`, `<button class="icon-btn" data-a="modal" data-v="activity">＋</button>`);
  html += `<div class="seg" style="margin-bottom:14px">${[['alle', 'Alle'], ['kraft', 'Kraft'], ['andere', 'Andere']].map(([v, l]) => `<button class="${ui.histFilter === v ? 'on' : ''}" data-a="histFilter" data-v="${v}">${l}</button>`).join('')}</div>`;
  let items = [];
  if (ui.histFilter !== 'andere') items = items.concat(S.workouts.map(w => ({ ...w, kind: 'w' })));
  if (ui.histFilter !== 'kraft') items = items.concat(S.activities.map(a => ({ ...a, kind: 'a' })));
  items.sort((a, b) => b.t - a.t);
  if (!items.length) return html + `<div class="card empty"><div class="e">🗓️</div>Noch nichts eingetragen.</div>`;
  const groups = {};
  for (const it of items) (groups[weekStart(it.t)] ||= []).push(it);
  const thisW = weekStart(Date.now());
  for (const [ws, list] of Object.entries(groups).sort((a, b) => b[0] - a[0])) {
    const w = +ws;
    const label = w === thisW ? 'Diese Woche' : w === shiftWeek(thisW, -1) ? 'Letzte Woche' : `${fmtDate(w)} – ${fmtDate(shiftWeek(w, 1) - DAY)}`;
    const mins = list.reduce((a, i) => a + (i.kind === 'w' ? i.durationMin : i.minutes), 0);
    html += `<div class="section-title"><h2 style="font-size:16px">${label}</h2><span class="muted small">${list.length}× · ${fmtDuration(mins)}</span></div><div class="list">${list.map(historyItem).join('')}</div>`;
  }
  return html;
}

/* ---------- Daten ---------- */

function viewData() {
  const lv = levelFromXP(computeXP());
  const st = weeklyStreak();
  const prs = allPRs();
  let html = header('Deine Daten', 'Fortschritt & Erfolge');

  html += `<div class="hero"><div class="row between"><div><div class="lvl">Level ${lv.level}</div><div class="title">${lv.title}</div></div><div style="font-size:40px">🏆</div></div>
    <div class="xpbar"><i style="width:${lv.into / lv.need * 100}%"></i></div>
    <div class="small" style="margin-top:6px;color:var(--ink-2);font-weight:600">${lv.into} / ${lv.need} XP bis Level ${lv.level + 1}</div></div>`;

  const totalVol = S.workouts.reduce((a, w) => a + workoutVolume(w), 0);
  html += `<div class="grid3" style="margin-top:12px">
    <div class="stat card tint-peach"><div class="e">🔥</div><div class="v">${st.streak}</div><div class="l">Wochen-Serie</div></div>
    <div class="stat card tint-mint" style="margin-top:0"><div class="e">💪</div><div class="v">${S.workouts.length + S.activities.length}</div><div class="l">Trainings</div></div>
    <div class="stat card tint-sky" style="margin-top:0"><div class="e">⭐</div><div class="v">${prs.length}</div><div class="l">Rekorde</div></div></div>
    <div class="grid2" style="margin-top:10px">
    <div class="stat card tint-butter"><div class="v">${fmt(totalVol / 1000, 1)} t</div><div class="l">bewegtes Gewicht</div></div>
    <div class="stat card tint-lavender" style="margin-top:0"><div class="v">${fmtDuration(allSessions().reduce((a, s) => a + (s.minutes || 0), 0))}</div><div class="l">Trainingszeit</div></div></div>`;

  // Wochenaktivität
  const weeks = [];
  for (let i = 9; i >= 0; i--) weeks.push(shiftWeek(weekStart(Date.now()), -i));
  const kraft = weeks.map(ws => S.workouts.filter(w => weekStart(w.t) === ws).reduce((a, w) => a + w.durationMin, 0));
  const other = weeks.map(ws => S.activities.filter(w => weekStart(w.t) === ws).reduce((a, w) => a + w.minutes, 0));
  html += `<div class="section-title"><h2>Trainingszeit pro Woche</h2></div><div class="card">
    ${barChart({ labels: weeks.map(ws => fmtDate(ws, { day: 'numeric', month: 'numeric' })), stacks: [{ values: kraft, color: 'var(--lavender-deep)' }, { values: other, color: 'var(--mint-deep)' }] })}
    <div class="legend"><span><i style="background:var(--lavender-deep)"></i>Kraft</span><span><i style="background:var(--mint-deep)"></i>Andere Workouts</span><span class="muted">Minuten</span></div></div>`;

  // Übungen
  const ids = trainedExerciseIds().sort((a, b) => A(b).hist.at(-1).t - A(a).hist.at(-1).t);
  html += `<div class="section-title"><h2>Kraftentwicklung</h2><button class="link" data-a="info1rm">Was ist das 1RM?</button></div>`;
  if (!ids.length) html += `<div class="card empty"><div class="e">📈</div>Nach deinen ersten Trainings siehst du hier, wie sich jede Übung entwickelt.</div>`;
  else html += `<div class="list">${ids.slice(0, 12).map(id => {
    const a = A(id), s = STATUS[a.status];
    const vals = a.hist.slice(-10).map(h => h.e1rm);
    return `<button class="li" data-a="exDetail" data-v="${id}"><div class="grow"><div class="t">${esc(exById(id).name)}</div>
      <div class="s"><span class="pill ${s.cls}" style="padding:2px 8px">${s.emoji} ${s.label}</span> ${a.actualPct !== undefined ? fmtPct(a.actualPct) : ''}</div></div>
      ${sparkline(vals, cvar(s.cls))}<span class="chev">›</span></button>`;
  }).join('')}</div>
  <p class="muted small" style="margin:8px 4px 0;line-height:1.45">Der Trend ist eine robuste lineare Regression deines geschätzten 1RM (einzelne schlechte Tage und Deload-Einheiten verzerren ihn nicht). Verglichen wird mit der Steigerung, die für ${{ anf: "Anfänger", fort: "Fortgeschrittene", erf: "Erfahrene" }[S.profile.level]} bei deiner tatsächlichen Trainingshäufigkeit und deinem Ziel „${GOALS[S.profile.goal].short}“ realistisch ist.</p>`;

  // Muskelkarte
  const range = ui.muscleRange;
  const ms = muscleSets(Date.now() - range * DAY);
  const perWeek = Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, v / (range / 7)]));
  html += `<div class="section-title"><h2>Muskelgruppen</h2></div><div class="card">
    <div class="seg" style="margin-bottom:12px">${[[7, '7 Tage'], [28, '4 Wochen']].map(([v, l]) => `<button class="${range === v ? 'on' : ''}" data-a="muscleRange" data-v="${v}">${l}</button>`).join('')}</div>
    ${bodyMap(perWeek, { max: 20 })}
    <div style="margin-top:14px">${Object.entries(perWeek).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
      const z = volumeZone(v);
      return `<div style="margin-top:10px"><div class="row between small"><b>${MUSCLES[k].name}</b><span class="muted">${fmt(v, 1)} Sätze/Woche · ${z.label}</span></div>
      <div class="bar" style="margin-top:5px"><span class="zone" style="left:${10 / 25 * 100}%;width:${10 / 25 * 100}%"></span><i style="width:${Math.min(100, v / 25 * 100)}%;background:${z.cls === 'good' ? 'var(--mint-deep)' : z.cls === 'high' ? 'var(--peach-deep)' : 'var(--rose-deep)'}"></i></div></div>`;
    }).join('')}</div>
    <p class="muted small" style="margin-top:12px;line-height:1.45">Grüner Bereich: 10–20 Sätze pro Muskel und Woche – laut Studien der beste Bereich für Muskelaufbau. Sekundär beteiligte Muskeln zählen halb.</p></div>`;

  // Kraftvergleich
  const stds = Object.keys(STRENGTH_STANDARDS.m).map(id => [id, strengthStandard(id)]).filter(([, s]) => s);
  html += `<div class="section-title"><h2>Kraftvergleich</h2></div>`;
  if (!S.profile.sex || S.profile.sex === 'x') html += `<div class="card"><div class="sub">Für Vergleichswerte mit anderen Trainierenden braucht die App dein Geschlecht (im Profil). Bis dahin vergleichst du dich nur mit dir selbst – das ist sowieso der wichtigste Vergleich.</div></div>`;
  else if (!stds.length) html += `<div class="card"><div class="sub">Trainiere Kniebeuge, Bankdrücken, Kreuzheben, Schulterdrücken oder Langhantelrudern, um dich mit Richtwerten zu vergleichen.</div></div>`;
  else html += stds.map(([id, s]) => stdCard(id, s)).join('');

  // Körpergewicht
  html += `<div class="section-title"><h2>Körpergewicht</h2><button class="link" data-a="modal" data-v="bodyweight">Eintragen</button></div>`;
  html += bodyweightCard();

  // Rekorde
  if (prs.length) {
    html += `<div class="section-title"><h2>Neueste Rekorde</h2></div><div class="list">${prs.slice(-5).reverse().map(pr =>
      `<button class="li" data-a="exDetail" data-v="${pr.exId}"><div class="ico" style="background:var(--butter)">⭐</div><div class="grow"><div class="t">${esc(exById(pr.exId).name)}</div>
      <div class="s">${fmt(pr.set.kg)} kg × ${pr.set.reps} · 1RM ≈ ${fmt(pr.e1rm)} kg (${fmtPct((pr.e1rm / pr.prev - 1) * 100)})</div></div><span class="muted small">${relDay(pr.t)}</span></button>`).join('')}</div>`;
  }

  // Abzeichen
  const badges = earnedBadges();
  html += `<div class="section-title"><h2>Abzeichen</h2><span class="muted small">${badges.filter(b => b.earned).length}/${badges.length}</span></div>
    <div class="badges">${badges.map(b => `<div class="badge ${b.earned ? '' : 'off'}" title="${esc(b.desc)}"><div class="e">${b.emoji}</div><div class="n">${b.name}</div><div class="muted" style="font-size:10px;margin-top:2px">${b.desc}</div></div>`).join('')}</div>`;
  return html;
}

function stdCard(id, s) {
  const th = s.thresholds;
  const lo = th[0] * 0.7, hi = th[th.length - 1] * 1.1;
  const pos = Math.max(0, Math.min(100, (s.ratio - lo) / (hi - lo) * 100));
  return `<div class="card"><div class="row between"><h3>${esc(exById(id).name)}</h3><span class="pill lavender">${s.label}</span></div>
    <div class="sub">1RM ≈ ${fmt(s.best)} kg = ${fmt(s.ratio, 2)}× Körpergewicht${s.next ? ` · nächste Stufe ab ≈ ${fmt(roundTo(s.nextKg, 2.5))} kg` : ''}</div>
    <div class="std"><div class="mark" style="left:${pos}%"></div></div>
    <div class="std-labels">${STANDARD_LABELS.map(l => `<span>${l.slice(0, 5)}.</span>`).join('')}</div></div>`;
}

function bodyweightCard() {
  if (!S.bodyweights.length) return `<div class="card empty">Noch kein Gewicht eingetragen.</div>`;
  const pts = S.bodyweights.slice(-30).map(b => ({ x: b.t, y: b.kg }));
  const tr = bodyweightTrend();
  const cur = currentBodyweight();
  return `<div class="card"><div class="row between"><div><div class="stat" style="padding:0"><div class="v">${fmt(cur)} kg</div><div class="l">Ziel: ${GOALS[S.profile.goal].name}</div></div></div>
    ${tr ? `<span class="pill ${/empfohlenen|stabil/.test(tr.verdict) ? 'mint' : 'butter'}">${fmt(tr.perWeek, 2)} kg/Woche</span>` : ''}</div>
    <div style="margin-top:10px">${lineChart({ series: [{ pts, color: 'var(--peach-deep)', dots: true, area: true }], yFmt: v => fmt(v, 0) })}</div>
    ${tr ? `<div class="sub" style="margin-top:8px">${tr.verdict} (${fmtPct(tr.pctWeek, 2)} pro Woche, letzte 6 Wochen).</div>` : '<div class="sub" style="margin-top:8px">Trage regelmäßig ein (alle 1–2 Wochen), dann siehst du hier deinen Trend.</div>'}</div>`;
}

/* ---------- Profil ---------- */

function viewProfile() {
  const p = S.profile;
  let html = header('Profil', 'Einstellungen');
  html += `<div class="card">
    <label class="f" style="margin-top:0">Name</label><input class="input" data-in="profile" data-f="name" value="${esc(p.name || '')}" placeholder="Vorname">
    <label class="f">Erfahrung</label><div class="seg">${Object.entries(LEVELS).map(([k, l]) => `<button class="${p.level === k ? 'on' : ''}" data-a="setProfile" data-f="level" data-v="${k}">${l.name.replace('Fortgeschritten', 'Fortgeschr.')}</button>`).join('')}</div>
    <label class="f">Ziel Körpergewicht</label><div class="seg">${Object.entries(GOALS).map(([k, g]) => `<button class="${p.goal === k ? 'on' : ''}" data-a="setProfile" data-f="goal" data-v="${k}">${g.short}</button>`).join('')}</div>
    <label class="f">Geschlecht (für Kraft-Richtwerte)</label><div class="seg">${[['m', 'Männlich'], ['w', 'Weiblich'], ['x', 'Keine Angabe']].map(([k, l]) => `<button class="${p.sex === k ? 'on' : ''}" data-a="setProfile" data-f="sex" data-v="${k}">${l}</button>`).join('')}</div>
    <label class="f">Erinnerung ans Wiegen</label><div class="seg">${[[7, 'Wöchentl.'], [14, '14 Tage'], [30, 'Monatl.'], [0, 'Aus']].map(([n, l]) => `<button class="${(p.bwInterval ?? 14) === n ? 'on' : ''}" data-a="setProfile" data-f="bwInterval" data-v="${n}">${l}</button>`).join('')}</div>
    <label class="f">Wochenziel</label><div class="seg">${[2, 3, 4, 5, 6].map(n => `<button class="${p.weeklyTarget === n ? 'on' : ''}" data-a="setProfile" data-f="weeklyTarget" data-v="${n}">${n}×</button>`).join('')}</div>
  </div>`;
  html += `<div class="section-title"><h2>Körpergewicht</h2><button class="link" data-a="modal" data-v="bodyweight">Eintragen</button></div>`;
  html += S.bodyweights.length ? `<div class="list">${S.bodyweights.slice(-6).reverse().map(b => `<div class="li"><div class="grow"><div class="t">${fmt(b.kg)} kg</div><div class="s">${fmtDate(b.t, { day: 'numeric', month: 'long', year: 'numeric' })}</div></div><button class="icon-btn" data-a="delBw" data-v="${b.t}">🗑</button></div>`).join('')}</div>` : `<div class="card empty">Noch keine Einträge.</div>`;

  html += `<div class="section-title"><h2>Daten</h2></div><div class="list">
    <button class="li" data-a="export"><div class="ico" style="background:var(--sky)">⬇️</div><div class="grow"><div class="t">Backup exportieren</div><div class="s">Als JSON-Datei sichern</div></div></button>
    <label class="li" style="cursor:pointer"><div class="ico" style="background:var(--mint)">⬆️</div><div class="grow"><div class="t">Backup importieren</div><div class="s">Ersetzt die aktuellen Daten</div></div><input type="file" accept="application/json,.json" data-in="import" hidden></label>
    ${S.workouts.some(w => w.demo) ? `<button class="li" data-a="removeDemo"><div class="ico" style="background:var(--butter)">🧪</div><div class="grow"><div class="t">Demo-Daten entfernen</div></div></button>`
      : `<button class="li" data-a="demo"><div class="ico" style="background:var(--butter)">🧪</div><div class="grow"><div class="t">Demo-Daten laden</div><div class="s">10 Wochen Beispieltraining zum Ausprobieren</div></div></button>`}
    <button class="li" data-a="reset"><div class="ico" style="background:var(--rose)">⚠️</div><div class="grow"><div class="t" style="color:var(--rose-deep)">Alles zurücksetzen</div></div></button></div>
    <p class="muted small" style="margin:14px 4px;line-height:1.5">Alle Daten liegen nur auf diesem Gerät. Mach ab und zu ein Backup – wenn du die App vom Homescreen löschst, sind die Daten weg.</p>`;
  return html;
}

/* ---------- Aktives Training ---------- */

function viewActive() {
  const w = S.active;
  let html = `<div class="workout-top"><button class="icon-btn" data-a="minimize">⌄</button><div class="grow"><div style="font-weight:800;font-size:18px">${esc(w.name)}</div><div class="timer" id="wtimer">${clock(Date.now() - w.start)}</div></div>
    <button class="btn sm mint" data-a="finish">Fertig</button></div>`;
  if (!w.entries.length) html += `<div class="card empty"><div class="e">🏋️</div>Füge deine erste Übung hinzu.</div>`;
  w.entries.forEach((e, ei) => {
    const ex = exById(e.exId);
    const sug = suggestWeight(e.exId, e.repsMin, e.repsMax);
    const hist = A(e.exId).hist;
    const last = hist[hist.length - 1];
    html += `<div class="ex-card"><div class="head"><div class="grow"><div class="name">${esc(ex.name)}</div>
      <div class="chips" style="margin-top:5px">${ex.primary.map(m => `<span class="muscle-chip">${MUSCLES[m].name}</span>`).join('')}${ex.secondary.slice(0, 2).map(m => `<span class="muscle-chip sec">${MUSCLES[m].name}</span>`).join('')}</div></div>
      <button class="icon-btn" data-a="exDetail" data-v="${e.exId}">📈</button><button class="icon-btn" data-a="removeEntry" data-v="${ei}">✕</button></div>
      <div class="suggest ${sug.type}"><div class="grow">${sug.type === 'up' ? '⬆️ ' : sug.type === 'deload' ? '🔄 ' : sug.type === 'return' ? '👋 ' : sug.type === 'neu' ? '🌱 ' : '🎯 '}${sug.text}</div>
      ${sug.kg !== null && sug.kg > 0 ? `<button class="btn sm soft" data-a="applySug" data-v="${ei}" data-kg="${sug.kg}" data-t="${sug.type}">Übernehmen</button>` : ''}</div>
      ${e.mode ? `<div class="prev">🪶 Leichte Einheit – zählt nicht in deinen Trend. <button class="link" style="color:var(--lavender-deep);font-weight:700" data-a="clearMode" data-v="${ei}">Doch normal werten</button></div>` : ''}
      ${last ? `<div class="prev">Letztes Mal (${relDay(last.t)}): ${last.sets.map(s => `${fmt(s.kg)}×${s.reps}`).join(', ')}</div>` : ''}
      <div class="sets"><div class="set-row head"><span>Satz</span><span style="text-align:center">${ex.bw ? '+kg' : 'kg'}</span><span style="text-align:center">Wdh. (${e.repsMin}–${e.repsMax})</span><span></span></div>
      ${e.sets.map((s, si) => `<div class="set-row ${s.done ? 'done' : ''}"><span class="n">${si + 1}</span>
        <input inputmode="decimal" data-in="set" data-e="${ei}" data-s="${si}" data-f="kg" value="${esc(s.kg)}" placeholder="${sug.kg ?? '0'}">
        <input inputmode="numeric" data-in="set" data-e="${ei}" data-s="${si}" data-f="reps" value="${esc(s.reps)}" placeholder="${e.repsMin}–${e.repsMax}">
        <button class="check" data-a="toggleSet" data-e="${ei}" data-s="${si}">✓</button></div>`).join('')}</div>
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-a="addSet" data-v="${ei}">＋ Satz</button>${e.sets.length > 1 ? `<button class="btn sm ghost" data-a="removeSet" data-v="${ei}">− Satz</button>` : ''}</div></div>`;
  });
  html += `<button class="btn lav" data-a="picker" data-v="active">＋ Übung hinzufügen</button>
    <button class="btn danger" style="margin-top:8px" data-a="cancelWorkout">Training verwerfen</button>`;
  return html;
}
function clock(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0');
}
function restPill() {
  if (!ui.restStart) return '';
  return `<div class="rest">⏳ Pause <span id="rest-t">${clock(Date.now() - ui.restStart)}</span><button data-a="stopRest" style="opacity:.7">✕</button></div>`;
}

/* ---------- Modals ---------- */

function sheet(title, body, { full = false, right = '' } = {}) {
  return `<div class="backdrop" data-a="close"></div><div class="sheet ${full ? 'full' : ''}">${full ? '' : '<div class="grab"></div>'}
    <div class="sheet-head"><h2>${title}</h2><div class="row">${right}<button class="icon-btn" data-a="close">✕</button></div></div>${body}</div>`;
}

function viewModal() {
  const m = ui.modal;
  switch (m.type) {
    case 'picker': return modalPicker(m);
    case 'activity': return modalActivity(m);
    case 'bodyweight': return modalBodyweight(m);
    case 'templates': return modalTemplates();
    case 'plan': return modalPlan(m);
    case 'workoutDetail': return modalWorkoutDetail(m);
    case 'activityDetail': return modalActivityDetail(m);
    case 'exDetail': return modalExDetail(m);
    case 'summary': return modalSummary(m);
    case 'level': return modalLevel();
    case 'custom': return modalCustom(m);
    case 'info1rm': return modalInfo1RM();
  }
  return '';
}

function modalPicker(m) {
  const q = (m.q || '').toLowerCase().trim();
  const inCtx = new Set(m.ctx === 'active' ? S.active.entries.map(e => e.exId) : planModal()?.draft.items.map(i => i.exId) || []);
  let list = allExercises();
  if (m.muscle) list = list.filter(e => e.primary.includes(m.muscle));
  if (m.equip) list = list.filter(e => e.equip === m.equip);
  if (q) list = list.filter(e => e.name.toLowerCase().includes(q) || e.equip.toLowerCase().includes(q) || e.primary.some(p => MUSCLES[p].name.toLowerCase().includes(q)));
  // zuletzt genutzte oben
  const lastUse = {};
  S.workouts.forEach(w => w.entries.forEach(e => lastUse[e.exId] = Math.max(lastUse[e.exId] || 0, w.t)));
  list = [...list].sort((a, b) => (lastUse[b.id] || 0) - (lastUse[a.id] || 0) || a.name.localeCompare(b.name, 'de'));
  const equips = [...new Set(allExercises().map(e => e.equip))];
  const body = `<input class="input" id="picker-q" data-in="pickerQ" value="${esc(m.q || '')}" placeholder="🔍 Übung suchen …" autocomplete="off">
    <div class="hscroll" style="margin-top:10px"><button class="chip ${!m.muscle ? 'on' : ''}" data-a="pickMuscle" data-v="">Alle</button>${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${m.muscle === k ? 'on' : ''}" data-a="pickMuscle" data-v="${k}">${v.name}</button>`).join('')}</div>
    <div class="hscroll"><button class="chip ${!m.equip ? 'on' : ''}" data-a="pickEquip" data-v="">Alles Equipment</button>${equips.map(k => `<button class="chip ${m.equip === k ? 'on' : ''}" data-a="pickEquip" data-v="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="list" style="margin-top:8px" id="picker-list">${list.map(e => `<button class="li" data-a="pick" data-v="${e.id}"><div class="grow"><div class="t">${esc(e.name)}</div>
      <div class="s">${e.primary.map(p => MUSCLES[p].name).join(', ')} · ${esc(e.equip)}</div></div>${inCtx.has(e.id) ? '<span class="pill mint">✓</span>' : '<span class="chev">＋</span>'}</button>`).join('') || '<div class="empty">Nichts gefunden.</div>'}</div>
    <button class="btn soft" style="margin-top:12px" data-a="modal" data-v="custom">Eigene Übung anlegen</button>`;
  return sheet('Übung wählen', body, { full: true, right: `<button class="btn sm" data-a="close">Fertig</button>` });
}

function modalCustom(m) {
  const d = m.d;
  const equips = Object.keys(EQUIP_INC);
  return sheet('Eigene Übung', `<label class="f" style="margin-top:0">Name</label><input class="input" data-in="custom" data-f="name" value="${esc(d.name)}" placeholder="z. B. Kabelrudern einarmig">
    <label class="f">Equipment</label><div class="chips">${equips.map(e => `<button class="chip ${d.equip === e ? 'on' : ''}" data-a="customSet" data-f="equip" data-v="${e}">${e}</button>`).join('')}</div>
    <label class="f">Hauptmuskeln</label><div class="chips">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${d.primary.includes(k) ? 'on' : ''}" data-a="customMuscle" data-f="primary" data-v="${k}">${v.name}</button>`).join('')}</div>
    <label class="f">Mitbeteiligt</label><div class="chips">${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${d.secondary.includes(k) ? 'on' : ''}" data-a="customMuscle" data-f="secondary" data-v="${k}">${v.name}</button>`).join('')}</div>
    <label class="f">Art</label><div class="seg"><button class="${d.type === 'c' ? 'on' : ''}" data-a="customSet" data-f="type" data-v="c">Grundübung</button><button class="${d.type === 'i' ? 'on' : ''}" data-a="customSet" data-f="type" data-v="i">Isolation</button></div>
    <button class="btn" style="margin-top:18px" data-a="saveCustom">Speichern</button>`);
}

function modalActivity(m) {
  const d = m.d;
  return sheet(d.id ? 'Workout bearbeiten' : 'Workout eintragen', `<p class="sub" style="margin-bottom:12px">Für Trainings, bei denen du nur die Zeit festhalten willst – Kurse, Laufen, ein Training ohne Details …</p>
    <div class="chips">${ACTIVITY_TYPES.map(t => `<button class="chip ${d.type === t.id ? 'on' : ''}" data-a="actSet" data-f="type" data-v="${t.id}">${t.emoji} ${t.name}</button>`).join('')}</div>
    <label class="f">Dauer</label>
    <div class="stepper" style="margin-top:4px"><button data-a="actMin" data-v="-5">−</button><div class="v" style="font-size:40px">${d.minutes}<span class="muted" style="font-size:18px"> min</span></div><button data-a="actMin" data-v="5">+</button></div>
    <div class="chips" style="justify-content:center;margin-top:10px">${[20, 30, 45, 60, 90].map(n => `<button class="chip ${d.minutes === n ? 'on' : ''}" data-a="actSet" data-f="minutes" data-v="${n}">${n}</button>`).join('')}</div>
    <label class="f">Datum</label><input class="input" type="date" data-in="act" data-f="date" value="${toDateInput(d.t)}" max="${toDateInput(Date.now())}">
    <label class="f">Notiz (optional)</label><input class="input" data-in="act" data-f="note" value="${esc(d.note || '')}" placeholder="z. B. Spinning-Kurs">
    <button class="btn" style="margin-top:18px" data-a="saveActivity">Speichern</button>`);
}

function modalBodyweight(m) {
  return sheet('Körpergewicht', `<div class="stepper"><button data-a="bwStep" data-v="-0.1">−</button><div class="v">${fmt(m.kg)}<span class="muted" style="font-size:20px"> kg</span></div><button data-a="bwStep" data-v="0.1">+</button></div>
    <div class="chips" style="justify-content:center;margin-top:12px">${[-1, -0.5, 0.5, 1].map(n => `<button class="chip" data-a="bwStep" data-v="${n}">${n > 0 ? '+' : ''}${fmt(n)}</button>`).join('')}</div>
    <p class="sub" style="text-align:center;margin-top:14px">Am besten morgens nach dem Aufstehen wiegen.</p>
    <button class="btn" style="margin-top:18px" data-a="saveBw">Speichern</button>`);
}

function modalTemplates() {
  return sheet('Vorlagen', `<div class="stack">${TEMPLATES.map((t, i) => `<button class="card" style="display:block;width:100%;text-align:left;border-left:6px solid var(--${t.color}-deep)" data-a="useTemplate" data-v="${i}">
    <h3>${t.name}</h3><div class="sub small">${t.items.map(id => exById(id).name).join(' · ')}</div></button>`).join('')}</div>
    <button class="btn soft" style="margin-top:12px" data-a="newPlan">Leeren Plan erstellen</button>`);
}

function modalPlan(m) {
  const d = m.draft;
  const vals = {};
  d.items.forEach(it => { const ex = exById(it.exId); ex.primary.forEach(k => vals[k] = (vals[k] || 0) + it.sets); ex.secondary.forEach(k => vals[k] = (vals[k] || 0) + it.sets * 0.5); });
  const body = `<label class="f" style="margin-top:0">Name</label><input class="input" data-in="plan" data-f="name" value="${esc(d.name)}" placeholder="z. B. Push-Tag">
    <label class="f">Farbe</label><div class="chips">${COLORS.map(c => `<button class="chip" style="background:var(--${c});${d.color === c ? `outline:3px solid var(--${c}-deep)` : ''}" data-a="planColor" data-v="${c}">&nbsp;&nbsp;&nbsp;</button>`).join('')}</div>
    <label class="f">Übungen</label>
    ${d.items.length ? `<div class="list">${d.items.map((it, i) => `<div class="li" style="flex-wrap:wrap"><div class="grow"><div class="t">${esc(exById(it.exId).name)}</div></div>
      <button class="icon-btn" data-a="planMove" data-v="${i}" data-d="-1">↑</button><button class="icon-btn" data-a="planRemove" data-v="${i}">✕</button>
      <div class="row small" style="width:100%;gap:8px"><input class="input" style="width:60px;padding:8px;text-align:center" inputmode="numeric" data-in="planItem" data-i="${i}" data-f="sets" value="${it.sets}"><span class="muted">Sätze à</span>
      <input class="input" style="width:56px;padding:8px;text-align:center" inputmode="numeric" data-in="planItem" data-i="${i}" data-f="repsMin" value="${it.repsMin}"><span class="muted">–</span>
      <input class="input" style="width:56px;padding:8px;text-align:center" inputmode="numeric" data-in="planItem" data-i="${i}" data-f="repsMax" value="${it.repsMax}"><span class="muted">Wdh.</span></div></div>`).join('')}</div>` : '<div class="card empty">Noch keine Übungen.</div>'}
    <button class="btn lav" style="margin-top:10px" data-a="picker" data-v="plan">＋ Übung hinzufügen</button>
    ${d.items.length ? `<label class="f">Trainierte Muskeln</label><div class="card">${bodyMap(vals)}</div>` : ''}
    <button class="btn" style="margin-top:18px" data-a="savePlan">Plan speichern</button>
    ${d.id ? '<button class="btn danger" style="margin-top:6px" data-a="deletePlan">Plan löschen</button>' : ''}`;
  return sheet(d.id ? 'Plan bearbeiten' : 'Neuer Plan', body, { full: true });
}

function modalWorkoutDetail(m) {
  const w = S.workouts.find(x => x.id === m.id);
  if (!w) return '';
  const prs = allPRs().filter(p => p.workoutId === w.id);
  const ms = {};
  w.entries.forEach(e => { const ex = exById(e.exId); const n = e.sets.filter(s => s.reps > 0).length; ex.primary.forEach(k => ms[k] = (ms[k] || 0) + n); ex.secondary.forEach(k => ms[k] = (ms[k] || 0) + n / 2); });
  return sheet(esc(w.name), `<div class="sub" style="margin-bottom:12px">${fmtDateLong(w.t)} · ${fmtDuration(w.durationMin)}</div>
    <div class="grid3"><div class="stat card tint-lavender"><div class="v">${workoutSetCount(w)}</div><div class="l">Sätze</div></div><div class="stat card tint-mint" style="margin-top:0"><div class="v">${fmt(workoutVolume(w) / 1000, 2)} t</div><div class="l">Volumen</div></div><div class="stat card tint-butter" style="margin-top:0"><div class="v">${prs.length}</div><div class="l">Rekorde</div></div></div>
    <div class="card" style="margin-top:12px">${bodyMap(ms)}</div>
    ${w.entries.map(e => `<div class="card"><div class="row between"><h3>${esc(exById(e.exId).name)}</h3>${prs.some(p => p.exId === e.exId) ? '<span class="pill butter">⭐ Rekord</span>' : ''}</div>
      <div class="sub">${e.sets.filter(s => s.reps > 0).map(s => `${fmt(s.kg)} kg × ${s.reps}`).join(' · ')}</div></div>`).join('')}
    <button class="btn danger" style="margin-top:12px" data-a="deleteWorkout" data-v="${w.id}">Training löschen</button>`);
}

function modalActivityDetail(m) {
  const a = S.activities.find(x => x.id === m.id);
  if (!a) return '';
  const t = ACTIVITY_TYPES.find(x => x.id === a.type) || ACTIVITY_TYPES[0];
  return sheet(`${t.emoji} ${t.name}`, `<div class="card"><div class="stat" style="padding:0"><div class="v">${fmtDuration(a.minutes)}</div><div class="l">${fmtDateLong(a.t)}</div></div>${a.note ? `<div class="sub" style="margin-top:8px">${esc(a.note)}</div>` : ''}</div>
    <button class="btn soft" style="margin-top:12px" data-a="editActivity" data-v="${a.id}">Bearbeiten</button>
    <button class="btn danger" style="margin-top:6px" data-a="deleteActivity" data-v="${a.id}">Löschen</button>`);
}

function modalExDetail(m) {
  const ex = exById(m.id);
  const a = A(m.id);
  const s = STATUS[a.status];
  let body = `<div class="chips" style="margin-bottom:12px">${ex.primary.map(k => `<span class="muscle-chip">${MUSCLES[k].name}</span>`).join('')}${ex.secondary.map(k => `<span class="muscle-chip sec">${MUSCLES[k].name}</span>`).join('')}<span class="muscle-chip sec">${esc(ex.equip)}</span></div>`;
  if (!a.hist.length) {
    body += `<div class="card">${exerciseBodyMap(ex)}</div><div class="card empty">Noch keine Daten für diese Übung.</div>`;
    return sheet(esc(ex.name), body);
  }
  const pts = a.hist.filter(h => h.t > Date.now() - 180 * DAY).map(h => ({ x: h.t, y: h.e1rm }));
  const series = [{ pts, color: 'var(--lavender-deep)', dots: true, area: true, width: 2 }];
  if (a.reg && a.window?.length >= 2) {
    const w0 = a.window[0].t, w1 = a.window[a.window.length - 1].t;
    const span = (w1 - w0) / DAY;
    series.push({ pts: [{ x: w0, y: a.reg.a }, { x: w1, y: a.reg.a + a.reg.b * span }], color: cvar(s.cls), width: 3 });
    if (a.expectedPct !== undefined) series.push({ pts: [{ x: w0, y: a.reg.a }, { x: w1, y: a.reg.a * (1 + a.expectedPct / 100) }], color: 'var(--muted)', dash: '5 5', width: 2 });
  }
  const weeks = Math.max(1, a.spanDays / 7);
  const freq = a.window ? a.window.length / Math.max(1, (Date.now() - a.window[0].t) / (7 * DAY)) : 0;
  const best = Math.max(...a.hist.map(h => h.e1rm));
  const last = a.hist[a.hist.length - 1];
  body += `<div class="card"><div class="row between"><div><div class="small muted row" style="font-weight:700;gap:6px">Geschätztes 1RM <button class="info-btn" data-a="info1rm" aria-label="Was ist das 1RM?">i</button></div><div style="font-size:28px;font-weight:800">${fmt(last.e1rm)} kg</div></div><span class="pill ${s.cls}">${s.emoji} ${s.label}</span></div>
    <div style="margin-top:10px">${lineChart({ series })}</div>
    <div class="legend"><span><i style="background:var(--lavender-deep)"></i>1RM je Training</span><span><i style="background:${cvar(s.cls)}"></i>Dein Trend</span>${a.expectedPct !== undefined ? '<span><i class="dash" style="border-color:var(--muted)"></i>Erwartung</span>' : ''}</div></div>`;
  if (a.actualPct !== undefined) {
    body += `<div class="grid2" style="margin-top:12px"><div class="stat card tint-${s.cls}"><div class="v">${fmtPct(a.actualPct)}</div><div class="l">Dein Trend (${fmt(weeks, 0)} Wo.)</div></div>
      <div class="stat card" style="margin-top:0"><div class="v">${fmtPct(a.expectedPct)}</div><div class="l">Erwartet</div></div></div>
      <p class="sub small" style="margin:10px 4px 0;line-height:1.5">Erwartung für <b>${LEVELS[S.profile.level].name}</b>, Ziel <b>${GOALS[S.profile.goal].short}</b>, bei <b>${fmt(freq, 1)}× pro Woche</b> diese Übung${a.window && a.window.some((h, i) => i && (h.t - a.window[i - 1].t) / DAY > DETRAIN_AFTER_DAYS) ? ' – inklusive Pausen, die etwas Kraft kosten' : ''}. Seltener trainieren bedeutet eine niedrigere Erwartung.</p>`;
  } else {
    body += `<p class="sub" style="margin:10px 4px">${a.status === 'pause' ? 'Die letzte Einheit ist über 4 Wochen her.' : 'Ab 3 Einheiten über mindestens 10 Tage berechnet die App deinen Trend.'}</p>`;
  }
  const sug = suggestWeight(m.id);
  body += `<div class="suggest ${sug.type}" style="margin-top:12px"><div>${sug.text}</div></div>`;
  const std = strengthStandard(m.id);
  if (std) body += `<div style="margin-top:12px">${stdCard(m.id, std)}</div>`;
  body += `<div class="grid2" style="margin-top:12px"><div class="stat card"><div class="v">${fmt(best)} kg</div><div class="l">Bestes 1RM</div></div><div class="stat card" style="margin-top:0"><div class="v">${a.hist.length}</div><div class="l">Einheiten</div></div></div>`;
  body += `<div class="card" style="margin-top:12px">${exerciseBodyMap(ex)}</div>`;
  body += `<div class="section-title"><h2 style="font-size:16px">Letzte Einheiten</h2></div><div class="list">${a.hist.slice(-6).reverse().map(h => `<div class="li"><div class="grow"><div class="t">${h.sets.map(x => `${fmt(x.kg)}×${x.reps}`).join(', ')}</div><div class="s">${relDay(h.t)}</div></div><span class="muted small">1RM ${fmt(h.e1rm)}</span></div>`).join('')}</div>`;
  return sheet(esc(ex.name), body);
}

function modalSummary(m) {
  const w = S.workouts.find(x => x.id === m.id);
  if (!w) return '';
  const ms = {};
  w.entries.forEach(e => { const ex = exById(e.exId); const n = e.sets.filter(s => s.reps > 0).length; ex.primary.forEach(k => ms[k] = (ms[k] || 0) + n); ex.secondary.forEach(k => ms[k] = (ms[k] || 0) + n / 2); });
  return sheet('Stark gemacht! 💪', `
    <div class="hero" style="text-align:center"><div style="font-size:44px">${m.prs.length ? '🏆' : '🎉'}</div><div class="title">+${m.xp} XP</div>
    ${m.levelUp ? `<div class="lvl" style="margin-top:4px">Level-up! Jetzt Level ${m.level}</div>` : ''}</div>
    <div class="grid3" style="margin-top:12px"><div class="stat card tint-lavender"><div class="v">${fmtDuration(w.durationMin)}</div><div class="l">Dauer</div></div><div class="stat card tint-mint" style="margin-top:0"><div class="v">${workoutSetCount(w)}</div><div class="l">Sätze</div></div><div class="stat card tint-peach" style="margin-top:0"><div class="v">${fmt(workoutVolume(w) / 1000, 2)} t</div><div class="l">Volumen</div></div></div>
    ${m.prs.length ? `<div class="section-title"><h2 style="font-size:16px">Neue Rekorde ⭐</h2></div><div class="list">${m.prs.map(p => `<div class="li"><div class="ico" style="background:var(--butter)">⭐</div><div class="grow"><div class="t">${esc(exById(p.exId).name)}</div><div class="s">${fmt(p.set.kg)} kg × ${p.set.reps} · 1RM ≈ ${fmt(p.e1rm)} kg</div></div></div>`).join('')}</div>` : ''}
    ${m.badges.length ? `<div class="section-title"><h2 style="font-size:16px">Neue Abzeichen</h2></div><div class="badges">${m.badges.map(b => `<div class="badge"><div class="e">${b.emoji}</div><div class="n">${b.name}</div></div>`).join('')}</div>` : ''}
    <div class="card" style="margin-top:12px"><h3 style="margin-bottom:8px">Heute trainiert</h3>${bodyMap(ms)}</div>
    <button class="btn" style="margin-top:16px" data-a="close">Schließen</button>`);
}

function modalInfo1RM() {
  return sheet('Was ist das 1RM?', `
    <div class="hero"><div class="title" style="font-size:22px">1RM = One-Rep-Max</div>
    <div class="sub" style="margin-top:6px;color:var(--ink)">Das Gewicht, das du bei einer Übung <b>genau ein einziges Mal</b> schaffen würdest – mehr geht nicht.</div></div>
    <div class="card" style="margin-top:12px"><h3>🙌 Du musst das nie testen</h3>
      <div class="sub">Maximalversuche sind anstrengend und riskant. Die App <b>schätzt</b> dein 1RM aus deinen ganz normalen Sätzen.</div></div>
    <div class="card"><h3>🧮 So wird geschätzt</h3>
      <div class="sub">Gewicht × (1 + Wiederholungen ÷ 30)</div>
      <div class="sub" style="margin-top:6px">Beispiel: <b>80 kg × 8 Wdh.</b> → 80 × (1 + 8 ÷ 30) ≈ <b>101 kg</b></div></div>
    <div class="card"><h3>⚖️ Wozu das gut ist</h3>
      <div class="sub">Damit verschiedene Sätze vergleichbar werden. <b>80 kg × 8</b> und <b>90 kg × 4</b> sehen unterschiedlich aus, sind aber etwa gleich stark (≈ 101 und 102 kg). So erkennt die App, ob du stärker wirst – auch wenn du mal mehr Gewicht und mal mehr Wiederholungen machst.</div></div>
    <div class="card tint-butter"><h3>💡 Gut zu wissen</h3>
      <div class="sub">Es ist eine Schätzung. Bei wenigen Wiederholungen (bis ca. 10) ist sie ziemlich genau, bei sehr vielen wird sie ungenauer. Wichtig ist nicht die exakte Zahl, sondern ob sie über die Wochen steigt.</div></div>
    <button class="btn" style="margin-top:16px" data-a="close">Verstanden</button>`);
}

function modalLevel() {
  const p = S.profile;
  const stds = Object.keys(STRENGTH_STANDARDS.m).map(id => [id, strengthStandard(id)]).filter(([, s]) => s);
  return sheet('Einstufung', `<p class="sub" style="margin-bottom:14px">Die Einstufung legt fest, welche Steigerung erwartet wird. Wer zu niedrig eingestuft ist, bekommt zu früh Stagnations-Hinweise.</p>
    ${Object.entries(LEVELS).map(([k, l]) => `<button class="choice ${p.level === k ? 'on' : ''}" data-a="setLevel" data-v="${k}"><div class="t">${l.name}</div><div class="s">${l.desc} · erwartet ca. ${fmt(l.weekly * 100 * 4.3, 1)} % pro Monat</div></button>`).join('')}
    ${stds.length ? `<div class="section-title"><h2 style="font-size:16px">Deine Richtwerte</h2></div>${stds.map(([id, s]) => stdCard(id, s)).join('')}` : ''}`);
}

/* ---------- Aktionen ---------- */

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}
function confetti() {
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['--lavender-deep', '--mint-deep', '--peach-deep', '--sky-deep', '--butter-deep', '--rose-deep'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = `var(${cols[i % cols.length]})`;
    p.style.animationDelay = Math.random() * 0.6 + 's';
    p.style.animationDuration = 1.6 + Math.random() * 1.4 + 's';
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 3500);
}
function openModal(m) { ui.stack = []; ui.modal = m; render(); }
function closeModal() { ui.modal = ui.stack.pop() || null; render(); }
function planModal() { return [...ui.stack].reverse().find(m => m.type === 'plan'); }

function startWorkout(name, entries, planId = null) {
  if (S.active && !confirm('Es läuft schon ein Training. Verwerfen und neu starten?')) return;
  S.active = { id: uid(), start: Date.now(), name, planId, entries };
  ui.showActive = true; ui.restStart = null;
  saveState(); render(); window.scrollTo(0, 0);
}

function finishWorkout() {
  const w = S.active;
  const entries = w.entries.map(e => ({
    exId: e.exId,
    ...(e.mode ? { mode: e.mode } : {}),
    sets: e.sets.map(s => ({ kg: num(s.kg) || 0, reps: Math.round(num(s.reps)) || 0, done: s.done })).filter(s => s.reps > 0),
  })).filter(e => e.sets.length);
  if (!entries.length) {
    if (confirm('Keine Sätze mit Wiederholungen eingetragen. Training verwerfen?')) { S.active = null; saveState(); render(); }
    return;
  }
  const xpBefore = computeXP();
  const lvBefore = levelFromXP(xpBefore).level;
  const badgesBefore = new Set(earnedBadges().filter(b => b.earned).map(b => b.id));
  const rec = { id: w.id, t: w.start, name: w.name, planId: w.planId, durationMin: Math.max(1, Math.round((Date.now() - w.start) / 60000)), entries };
  S.workouts.push(rec);
  S.active = null; ui.restStart = null;
  saveState();
  const xpAfter = computeXP();
  const lv = levelFromXP(xpAfter);
  const prs = allPRs().filter(p => p.workoutId === rec.id);
  const badges = earnedBadges().filter(b => b.earned && !badgesBefore.has(b.id));
  ui.tab = 'heute';
  openModal({ type: 'summary', id: rec.id, xp: xpAfter - xpBefore, prs, badges, levelUp: lv.level > lvBefore, level: lv.level });
  confetti();
}

function makeDemo() {
  const now = Date.now();
  const bw0 = currentBodyweight() || 78;
  const planA = { id: uid(), name: 'Ganzkörper A', color: 'lavender', items: DEMO_PLANS[0].items.map(planItem), demo: true };
  const planB = { id: uid(), name: 'Ganzkörper B', color: 'mint', items: DEMO_PLANS[1].items.map(planItem), demo: true };
  S.plans.push(planA, planB);
  const starts = { kniebeuge: 70, bankdruecken: 60, rudern_lh: 50, schulterdruecken_kh: 16, beinbeuger_sitzend: 35, plank: 0, kreuzheben: 90, schraegbank_kh: 20, latzug: 50, ausfallschritte: 14, seitheben: 8, curls_kh: 12 };
  let i = 0;
  for (let day = 70; day >= 1; day--) {
    const t = startOfDay(now - day * DAY) + 18 * 3600000;
    const wd = new Date(t).getDay();
    if (day > 30 && day < 40) continue; // Urlaubspause
    if (![1, 3, 5].includes(wd)) {
      if (wd === 6 && day % 2 === 0) S.activities.push({ id: uid(), t: t - 8 * 3600000, type: 'laufen', minutes: 30 + (day % 3) * 10, note: '', demo: true });
      continue;
    }
    const plan = i++ % 2 ? planB : planA;
    const weeks = (70 - day) / 7;
    const entries = plan.items.map(it => {
      const ex = exById(it.exId);
      let g = 0.018 * weeks;
      if (it.exId === 'bankdruecken') g = Math.min(weeks, 4) * 0.02; // Plateau ab Woche 4
      if (it.exId === 'kniebeuge') g = 0.022 * weeks;
      const base = starts[it.exId] ?? 20;
      const kg = ex.bw ? 0 : roundTo(base * (1 + g), ex.inc || 2.5);
      return { exId: it.exId, sets: Array.from({ length: it.sets }, (_, si) => ({ kg, reps: ex.bw ? 40 + Math.round(weeks * 3) : Math.max(it.repsMin, it.repsMax - si - ((day * 7 + si) % 3)) })) };
    });
    S.workouts.push({ id: uid(), t, name: plan.name, planId: plan.id, durationMin: 50 + (day % 4) * 5, entries, demo: true });
  }
  for (let d = 70; d >= 0; d -= 7) S.bodyweights.push({ t: now - d * DAY, kg: Math.round((bw0 - 1.5 + (70 - d) / 70 * 1.6 + ((d / 7) % 2) * 0.3) * 10) / 10, demo: true });
  S.bodyweights.sort((a, b) => a.t - b.t);
  S.workouts.sort((a, b) => a.t - b.t);
  S.activities.sort((a, b) => a.t - b.t);
}

const actions = {
  tab: el => { ui.tab = el.dataset.v; ui.modal = null; render(); window.scrollTo(0, 0); },
  close: () => closeModal(),
  modal: el => {
    const v = el.dataset.v;
    if (v === 'activity') openModal({ type: 'activity', d: { type: 'krafttraining', minutes: 60, t: Date.now(), note: '' } });
    else if (v === 'bodyweight') openModal({ type: 'bodyweight', kg: currentBodyweight() || 75 });
    else if (v === 'custom') { ui.stack.push(ui.modal); ui.modal = { type: 'custom', d: { name: '', equip: 'Maschine', primary: [], secondary: [], type: 'i' } }; render(); }
    else openModal({ type: v });
  },
  // Onboarding
  onbSet: el => { ui.onb.d[el.dataset.f] = el.dataset.v; render(); },
  onbKg: el => { ui.onb.d.kg = Math.max(30, Math.round((ui.onb.d.kg + +el.dataset.v) * 10) / 10); render(); },
  onbTarget: el => { ui.onb.d.weeklyTarget = Math.min(7, Math.max(1, ui.onb.d.weeklyTarget + +el.dataset.v)); render(); },
  onbBack: () => { ui.onb.step--; render(); },
  onbNext: () => {
    const o = ui.onb;
    if (o.step < 4) { o.step++; render(); return; }
    const d = o.d;
    S.profile = { name: d.name.trim(), sex: d.sex, level: d.level, goal: d.goal, weeklyTarget: d.weeklyTarget, bwInterval: 14, createdAt: Date.now(), levelSetAt: Date.now() };
    S.bodyweights.push({ t: Date.now(), kg: d.kg });
    saveState(); render(); confetti();
  },
  // Profil
  setProfile: el => { const f = el.dataset.f; S.profile[f] = ['weeklyTarget', 'bwInterval'].includes(f) ? +el.dataset.v : el.dataset.v; if (f === 'level') S.profile.levelSetAt = Date.now(); saveState(); render(); },
  setLevel: el => { S.profile.level = el.dataset.v; S.profile.levelSetAt = Date.now(); saveState(); toast('Einstufung gespeichert'); closeModal(); },
  delBw: el => { if (!confirm('Eintrag löschen?')) return; S.bodyweights = S.bodyweights.filter(b => b.t !== +el.dataset.v); saveState(); render(); },
  bwStep: el => { ui.modal.kg = Math.max(30, Math.round((ui.modal.kg + +el.dataset.v) * 10) / 10); render(); },
  saveBw: () => {
    const today = startOfDay(Date.now());
    S.bodyweights = S.bodyweights.filter(b => startOfDay(b.t) !== today);
    S.bodyweights.push({ t: Date.now(), kg: ui.modal.kg });
    S.bodyweights.sort((a, b) => a.t - b.t);
    saveState(); toast('Gewicht gespeichert ⚖️'); closeModal();
  },
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `fitness-backup-${toDateInput(Date.now())}.json`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  demo: () => { makeDemo(); saveState(); toast('Demo-Daten geladen'); ui.tab = 'daten'; render(); },
  removeDemo: () => {
    S.workouts = S.workouts.filter(w => !w.demo); S.activities = S.activities.filter(a => !a.demo);
    S.plans = S.plans.filter(p => !p.demo); S.bodyweights = S.bodyweights.filter(b => !b.demo);
    saveState(); toast('Demo-Daten entfernt'); render();
  },
  reset: () => { if (!confirm('Wirklich alle Daten löschen? Das kann nicht rückgängig gemacht werden.')) return; S = emptyState(); saveState(); ui.onb.step = 0; render(); },
  // Verlauf
  histFilter: el => { ui.histFilter = el.dataset.v; render(); },
  workoutDetail: el => openModal({ type: 'workoutDetail', id: el.dataset.v }),
  activityDetail: el => openModal({ type: 'activityDetail', id: el.dataset.v }),
  deleteWorkout: el => { if (!confirm('Training löschen?')) return; S.workouts = S.workouts.filter(w => w.id !== el.dataset.v); saveState(); ui.modal = null; render(); },
  deleteActivity: el => { if (!confirm('Eintrag löschen?')) return; S.activities = S.activities.filter(w => w.id !== el.dataset.v); saveState(); ui.modal = null; render(); },
  editActivity: el => { const a = S.activities.find(x => x.id === el.dataset.v); openModal({ type: 'activity', d: { ...a } }); },
  // Aktivität
  actSet: el => { ui.modal.d[el.dataset.f] = el.dataset.f === 'minutes' ? +el.dataset.v : el.dataset.v; render(); },
  actMin: el => { ui.modal.d.minutes = Math.max(5, ui.modal.d.minutes + +el.dataset.v); render(); },
  saveActivity: () => {
    const d = ui.modal.d;
    const badgesBefore = new Set(earnedBadges().filter(b => b.earned).map(b => b.id));
    if (d.id) S.activities = S.activities.map(a => a.id === d.id ? { ...d } : a);
    else S.activities.push({ id: uid(), t: d.t, type: d.type, minutes: d.minutes, note: d.note || '' });
    S.activities.sort((a, b) => a.t - b.t);
    saveState();
    const nb = earnedBadges().filter(b => b.earned && !badgesBefore.has(b.id));
    ui.modal = null; render();
    toast(nb.length ? `Neues Abzeichen: ${nb[0].emoji} ${nb[0].name}` : `Eingetragen · +${Math.round(Math.min(d.minutes, 120) * 0.6)} XP`);
    if (nb.length || weeklyStreak().thisWeek === weeklyStreak().target) confetti();
  },
  // Pläne
  newPlan: () => openModal({ type: 'plan', draft: { name: '', color: 'lavender', items: [] } }),
  editPlan: el => { const p = S.plans.find(x => x.id === el.dataset.v); openModal({ type: 'plan', draft: JSON.parse(JSON.stringify(p)) }); },
  useTemplate: el => { const t = TEMPLATES[+el.dataset.v]; openModal({ type: 'plan', draft: { name: t.name, color: t.color, items: t.items.map(planItem) } }); },
  planColor: el => { ui.modal.draft.color = el.dataset.v; render(); },
  planRemove: el => { ui.modal.draft.items.splice(+el.dataset.v, 1); render(); },
  planMove: el => { const i = +el.dataset.v, it = ui.modal.draft.items; if (i > 0) { [it[i - 1], it[i]] = [it[i], it[i - 1]]; render(); } },
  savePlan: () => {
    const d = ui.modal.draft;
    if (!d.name.trim()) { toast('Bitte gib dem Plan einen Namen'); return; }
    if (!d.items.length) { toast('Füge mindestens eine Übung hinzu'); return; }
    d.items.forEach(it => { it.sets = Math.max(1, it.sets | 0); it.repsMin = Math.max(1, it.repsMin | 0); it.repsMax = Math.max(it.repsMin, it.repsMax | 0); });
    if (d.id) S.plans = S.plans.map(p => p.id === d.id ? d : p);
    else S.plans.push({ ...d, id: uid() });
    saveState(); ui.modal = null; ui.tab = 'plaene'; render(); toast('Plan gespeichert');
  },
  deletePlan: () => { if (!confirm('Plan löschen? Deine Trainings bleiben erhalten.')) return; S.plans = S.plans.filter(p => p.id !== ui.modal.draft.id); saveState(); ui.modal = null; render(); },
  // Picker
  picker: el => {
    const ctx = el.dataset.v;
    if (ctx === 'plan') ui.stack.push(ui.modal);
    ui.modal = { type: 'picker', ctx, q: '', muscle: null, equip: null };
    render();
  },
  pickMuscle: el => { ui.modal.muscle = el.dataset.v || null; render(); },
  pickEquip: el => { ui.modal.equip = el.dataset.v || null; render(); },
  pick: el => {
    const id = el.dataset.v;
    if (ui.modal.ctx === 'active') {
      const [a, b] = defaultReps(id);
      const sug = suggestWeight(id, a, b);
      S.active.entries.push({ exId: id, repsMin: a, repsMax: b, mode: lightMode(sug), sets: Array.from({ length: 3 }, () => ({ kg: sug.kg ? String(sug.kg).replace('.', ',') : '', reps: '', done: false })) });
      saveState(); ui.modal = null; render();
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
    } else {
      planModal().draft.items.push(planItem(id));
      toast(`${exById(id).name} hinzugefügt`);
      render();
    }
  },
  customSet: el => { ui.modal.d[el.dataset.f] = el.dataset.v; render(); },
  customMuscle: el => { const arr = ui.modal.d[el.dataset.f]; const i = arr.indexOf(el.dataset.v); i >= 0 ? arr.splice(i, 1) : arr.push(el.dataset.v); render(); },
  saveCustom: () => {
    const d = ui.modal.d;
    if (!d.name.trim() || !d.primary.length) { toast('Name und mindestens ein Hauptmuskel nötig'); return; }
    S.customExercises.push({ id: 'c_' + uid(), name: d.name.trim(), equip: d.equip, primary: d.primary, secondary: d.secondary.filter(m => !d.primary.includes(m)), type: d.type, bw: d.equip === 'Körpergewicht', inc: EQUIP_INC[d.equip] ?? 2.5, custom: true });
    saveState(); toast('Übung angelegt'); closeModal();
  },
  // Training
  startEmpty: () => startWorkout('Training', []),
  startPlan: el => {
    const pl = S.plans.find(p => p.id === el.dataset.v);
    const entries = pl.items.map(it => {
      const sug = suggestWeight(it.exId, it.repsMin, it.repsMax);
      return { exId: it.exId, repsMin: it.repsMin, repsMax: it.repsMax, mode: lightMode(sug), sets: Array.from({ length: it.sets }, () => ({ kg: sug.kg ? String(sug.kg).replace('.', ',') : '', reps: '', done: false })) };
    });
    startWorkout(pl.name, entries, pl.id);
  },
  resume: () => { ui.showActive = true; render(); window.scrollTo(0, 0); },
  minimize: () => { ui.showActive = false; ui.tab = 'heute'; render(); },
  addSet: el => { const e = S.active.entries[+el.dataset.v]; const l = e.sets[e.sets.length - 1]; e.sets.push({ kg: l ? l.kg : '', reps: '', done: false }); saveState(); render(); },
  removeSet: el => { S.active.entries[+el.dataset.v].sets.pop(); saveState(); render(); },
  removeEntry: el => { if (!confirm('Übung entfernen?')) return; S.active.entries.splice(+el.dataset.v, 1); saveState(); render(); },
  applySug: el => { const e = S.active.entries[+el.dataset.v]; e.mode = lightMode({ type: el.dataset.t }); e.sets.forEach(s => { if (!s.done) s.kg = el.dataset.kg.replace('.', ','); }); saveState(); render(); },
  toggleSet: el => {
    const e = S.active.entries[+el.dataset.e], s = e.sets[+el.dataset.s];
    if (!s.done && !(num(s.reps) > 0)) {
      // leere Wiederholungen: untere Grenze des Bereichs übernehmen
      s.reps = String(e.repsMin);
    }
    if (!s.done && s.kg === '') s.kg = '0';
    s.done = !s.done;
    if (s.done) ui.restStart = Date.now();
    saveState(); const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  clearMode: el => { delete S.active.entries[+el.dataset.v].mode; saveState(); render(); },
  info1rm: () => { if (ui.modal) ui.stack.push(ui.modal); ui.modal = { type: 'info1rm' }; render(); },
  stopRest: () => { ui.restStart = null; render(); },
  finish: () => finishWorkout(),
  cancelWorkout: () => { if (!confirm('Training wirklich verwerfen?')) return; S.active = null; ui.restStart = null; saveState(); render(); },
  exDetail: el => { openModal({ type: 'exDetail', id: el.dataset.v }); },
  muscleRange: el => { ui.muscleRange = +el.dataset.v; render(); },
};

document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]');
  if (!t || t.disabled) return;
  const fn = actions[t.dataset.a];
  if (fn) { e.preventDefault(); fn(t, e); }
});

document.addEventListener('input', e => {
  const t = e.target, k = t.dataset.in;
  if (!k) return;
  if (k === 'onb') ui.onb.d[t.dataset.f] = t.value;
  else if (k === 'profile') { S.profile[t.dataset.f] = t.value; saveState(); }
  else if (k === 'set') { S.active.entries[+t.dataset.e].sets[+t.dataset.s][t.dataset.f] = t.value; saveState(); }
  else if (k === 'plan') ui.modal.draft[t.dataset.f] = t.value;
  else if (k === 'planItem') ui.modal.draft.items[+t.dataset.i][t.dataset.f] = parseInt(t.value) || 0;
  else if (k === 'act') { if (t.dataset.f === 'date') { if (t.value) ui.modal.d.t = fromDateInput(t.value); } else ui.modal.d[t.dataset.f] = t.value; }
  else if (k === 'custom') ui.modal.d[t.dataset.f] = t.value;
  else if (k === 'pickerQ') {
    ui.modal.q = t.value;
    const pos = t.selectionStart;
    render();
    const n = document.getElementById('picker-q');
    if (n) { n.focus(); n.setSelectionRange(pos, pos); }
  }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.in !== 'import' || !t.files[0]) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const data = JSON.parse(r.result);
      if (!data.profile || !Array.isArray(data.workouts)) throw new Error('Ungültig');
      if (!confirm('Aktuelle Daten durch das Backup ersetzen?')) return;
      S = Object.assign(emptyState(), data); saveState(); toast('Backup importiert'); render();
    } catch (err) { toast('Datei konnte nicht gelesen werden'); }
  };
  r.readAsText(t.files[0]);
});

setInterval(() => {
  if (!S.active) return;
  const wt = document.getElementById('wtimer');
  if (wt) wt.textContent = clock(Date.now() - S.active.start);
  const rt = document.getElementById('rest-t');
  if (rt && ui.restStart) rt.textContent = clock(Date.now() - ui.restStart);
}, 1000);

render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
