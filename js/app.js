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

const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>',
  list: '<rect x="4" y="3.5" width="16" height="17" rx="3"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  chart: '<path d="M4 19.5h16"/><path d="m5 15 4.5-5 4 3.5L20 6"/>',
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/>',
  play: '<path d="M8 5.5v13l10-6.5z" fill="currentColor" stroke="none"/>',
  dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  down: '<path d="m6 9.5 6 6 6-6"/>',
  up: '<path d="m6 14.5 6-6 6 6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 13.5l5-5 5 5M5 4h14"/>',
  import: '<path d="M4 14v5.5h16V14"/><path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/>',
  flask: '<path d="M9.5 3.5h5M10.5 3.5v6L5 19a1.3 1.3 0 0 0 1.1 2h11.8A1.3 1.3 0 0 0 19 19l-5.5-9.5v-6"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
};
function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

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
  const tabs = [['heute', 'home', 'Heute'], ['plaene', 'list', 'Pläne'], ['verlauf', 'calendar', 'Verlauf'], ['daten', 'chart', 'Fortschritt'], ['profil', 'user', 'Profil']];
  return `<nav class="tabbar"><div class="inner">${tabs.map(([id, i, l]) =>
    `<button class="tab ${ui.tab === id ? 'on' : ''}" data-a="tab" data-v="${id}">${icon(i)}<span>${l}</span>${id === 'daten' && hasAlert ? '<span class="dot"></span>' : ''}</button>`).join('')}</div></nav>`;
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
    body = `<div class="big">Willkommen</div>
      <p class="lead">Fünf kurze Fragen, damit Vorschläge und Vergleiche zu dir passen. Deine Daten bleiben auf diesem Gerät.</p>
      <label class="f">Dein Name (optional)</label>
      <input class="input" data-in="onb" data-f="name" value="${esc(d.name)}" placeholder="Vorname" autocomplete="given-name">`;
  } else if (o.step === 1) {
    canNext = !!d.sex;
    body = `<div class="big">Geschlecht</div>
      <p class="lead">Nur für die Kraft-Richtwerte – die unterscheiden sich zwischen Männern und Frauen.</p><div style="margin-top:18px">
      ${[['w', 'Weiblich'], ['m', 'Männlich'], ['x', 'Keine Angabe']].map(([v, l]) => `<button class="choice ${d.sex === v ? 'on' : ''}" data-a="onbSet" data-f="sex" data-v="${v}"><div class="t">${l}</div></button>`).join('')}</div>`;
  } else if (o.step === 2) {
    canNext = !!d.level;
    body = `<div class="big">Wie lange trainierst du schon?</div>
      <p class="lead">Danach richtet sich, wie viel Steigerung realistisch ist.</p><div style="margin-top:18px">
      ${Object.entries(LEVELS).map(([k, l]) => `<button class="choice ${d.level === k ? 'on' : ''}" data-a="onbSet" data-f="level" data-v="${k}"><div class="t">${l.name}</div><div class="s">${l.desc}</div></button>`).join('')}</div>`;
  } else if (o.step === 3) {
    canNext = !!d.goal && num(d.kg) >= 30;
    body = `<div class="big">Gewicht und Ziel</div>
      <label class="f" style="margin-top:22px">Körpergewicht</label>
      <div class="kg-input"><input class="input" inputmode="decimal" data-in="onb" data-f="kg" value="${esc(String(d.kg).replace('.', ','))}" placeholder="z. B. 68"><span>kg</span></div>
      <label class="f" style="margin-top:22px">Ziel</label>
      ${Object.entries(GOALS).map(([k, g]) => `<button class="choice ${d.goal === k ? 'on' : ''}" data-a="onbSet" data-f="goal" data-v="${k}"><div class="t">${g.name}</div><div class="s">${g.desc}</div></button>`).join('')}`;
  } else {
    body = `<div class="big">Wie oft pro Woche?</div>
      <p class="lead">Dein Wochenziel. Kraft und andere Workouts zählen beide.</p>
      <div class="stepper"><button data-a="onbTarget" data-v="-1" aria-label="weniger">−</button><div class="v">${d.weeklyTarget}×</div><button data-a="onbTarget" data-v="1" aria-label="mehr">+</button></div>`;
  }
  return `<div class="onb">${dots}${body}<div class="foot">
    <button class="btn" data-a="onbNext" ${canNext ? '' : 'disabled'}>${o.step === steps - 1 ? 'Fertig' : 'Weiter'}</button>
    ${o.step > 0 ? '<button class="btn ghost" data-a="onbBack" style="margin-top:6px">Zurück</button>' : ''}</div></div>`;
}

/* ---------- Heute ---------- */

function greeting() {
  const h = new Date().getHours();
  return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
}

function reminderCard(tint, title, sub, action, label) {
  return `<div class="card tint-${tint}"><div class="row"><div class="grow"><h3>${title}</h3><div class="sub">${sub}</div></div><button class="btn sm" ${action}>${label}</button></div></div>`;
}

function reminders() {
  const out = [];
  const lastBw = S.bodyweights[S.bodyweights.length - 1];
  const bwInt = S.profile.bwInterval ?? 14;
  if (bwInt > 0 && (!lastBw || Date.now() - lastBw.t > bwInt * DAY)) {
    out.push(reminderCard('butter', 'Wiegen fällig', lastBw ? `Zuletzt ${relDayInline(lastBw.t)}` : 'Noch kein Eintrag', 'data-a="modal" data-v="bodyweight"', 'Eintragen'));
  }
  const p = S.profile;
  const up = levelUpHint();
  if (up) out.push(reminderCard('lavender', 'Höher einstufen?', up, 'data-a="modal" data-v="level"', 'Ansehen'));
  else if (Date.now() - (p.levelSetAt || 0) > 120 * DAY && S.workouts.length > 10) {
    out.push(reminderCard('lavender', 'Einstufung prüfen', `Du bist als ${LEVELS[p.level].name} eingestuft. Passt das noch?`, 'data-a="modal" data-v="level"', 'Prüfen'));
  }
  return out.join('');
}
function levelUpHint() {
  const p = S.profile;
  if (p.level === 'erf' || !p.sex || p.sex === 'x') return null;
  const target = p.level === 'anf' ? 2 : 3;
  const keys = Object.keys(STRENGTH_STANDARDS.m).map(strengthStandard).filter(Boolean);
  const above = keys.filter(k => k.idx >= target).length;
  if (keys.length >= 2 && above >= 2) return `Bei ${above} Grundübungen liegst du schon im Bereich „${STANDARD_LABELS[target]}“.`;
  return null;
}

function stagnationList() {
  const ids = trainedExerciseIds().filter(id => ['plateau', 'rueckgang'].includes(A(id).status) && !A(id).hist.at(-1).light);
  if (!ids.length) return '';
  return `<div class="section-title"><h2>Stagniert</h2></div><div class="list">${ids.map(id => {
    const a = A(id);
    return `<button class="li" data-a="exDetail" data-v="${id}"><span class="dot-status rose"></span><div class="grow"><div class="t">${esc(exById(id).name)}</div>
      <div class="s">${fmtPct(a.actualPct)} in ${Math.round(a.spanDays / 7)} Wochen, erwartet ${fmtPct(a.expectedPct)}</div></div><span class="chev">›</span></button>`;
  }).join('')}</div>`;
}

function viewToday() {
  const p = S.profile;
  const st = weeklyStreak();
  const initial = (p.name || '').slice(0, 1).toUpperCase();
  let html = header(`${greeting()}${p.name ? ', ' + esc(p.name) : ''}`, fmtDateLong(Date.now()), `<button class="avatar" data-a="tab" data-v="profil" aria-label="Profil">${initial ? esc(initial) : icon('user')}</button>`);

  if (S.active) {
    const min = Math.floor((Date.now() - S.active.start) / 60000);
    html += `<div class="card tint-mint" style="margin-bottom:12px"><div class="row"><div class="grow"><h3>Training läuft</h3><div class="sub">${esc(S.active.name)} · ${min} min</div></div><button class="btn sm" data-a="resume">Weiter</button></div></div>`;
  }

  const left = st.target - st.thisWeek;
  html += `<div class="card"><div class="row">
      ${ring(st.thisWeek / st.target, 'var(--lavender-deep)', 68, 8, `<div style="font-size:18px">${st.thisWeek}/${st.target}</div>`)}
      <div class="grow"><h3>${left <= 0 ? 'Wochenziel erreicht' : `Noch ${left} ${left === 1 ? 'Training' : 'Trainings'} diese Woche`}</h3>
      <div class="sub">${st.streak ? `${st.streak} ${st.streak === 1 ? 'Woche' : 'Wochen'} in Folge geschafft` : 'Schaffe dein Wochenziel, um eine Serie zu starten'}</div></div></div></div>`;

  html += `<div class="grid2" style="margin-top:12px">
    <button class="btn" data-a="startEmpty">Training starten</button>
    <button class="btn lav" data-a="modal" data-v="activity">Nur Zeit eintragen</button></div>`;

  const rem = reminders();
  if (rem) html += `<div class="stack" style="margin-top:12px">${rem}</div>`;
  html += stagnationList();

  html += `<div class="section-title"><h2>Pläne</h2>${S.plans.length ? '<button class="link" data-a="tab" data-v="plaene">Alle</button>' : ''}</div>`;
  if (S.plans.length) {
    html += `<div class="list">${S.plans.slice(0, 4).map(pl => {
      const last = S.workouts.filter(w => w.planId === pl.id).sort((a, b) => b.t - a.t)[0];
      return `<button class="li" data-a="startPlan" data-v="${pl.id}"><div class="ico" style="background:var(--${pl.color});color:var(--${pl.color}-deep)">${icon('play')}</div>
      <div class="grow"><div class="t">${esc(pl.name)}</div><div class="s">${pl.items.length} Übungen${last ? ' · zuletzt ' + relDayInline(last.t) : ''}</div></div><span class="chev">›</span></button>`;
    }).join('')}</div>`;
  } else {
    html += `<button class="card" style="display:block;width:100%;text-align:left" data-a="modal" data-v="templates"><h3>Ersten Plan anlegen</h3><div class="sub">Push, Pull, Legs als Vorlage – oder selbst zusammenstellen.</div></button>`;
  }

  const recent = [...S.workouts.map(w => ({ ...w, kind: 'w' })), ...S.activities.map(a => ({ ...a, kind: 'a' }))].sort((a, b) => b.t - a.t).slice(0, 3);
  if (recent.length) {
    html += `<div class="section-title"><h2>Zuletzt</h2><button class="link" data-a="tab" data-v="verlauf">Verlauf</button></div><div class="list">${recent.map(historyItem).join('')}</div>`;
  }
  return html;
}

/* ---------- Pläne ---------- */

function viewPlans() {
  let html = header('Pläne', '', `<button class="icon-btn" data-a="newPlan" aria-label="Neuer Plan">${icon('plus')}</button>`);
  if (!S.plans.length) {
    html += `<div class="card empty">Noch keine Pläne.</div>`;
  } else {
    html += S.plans.map(pl => {
      const vals = {};
      pl.items.forEach(it => { const ex = exById(it.exId); ex.primary.forEach(m => vals[m] = (vals[m] || 0) + it.sets); });
      const muscles = Object.entries(vals).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => MUSCLES[m].name);
      return `<div class="card plan-card" style="--accent:var(--${pl.color}-deep)"><div class="row between"><div class="grow"><h3>${esc(pl.name)}</h3><div class="sub">${pl.items.length} Übungen · ${pl.items.reduce((a, i) => a + i.sets, 0)} Sätze · ${muscles.join(', ')}</div></div>
        <button class="icon-btn" data-a="editPlan" data-v="${pl.id}" aria-label="Bearbeiten">${icon('edit')}</button></div>
        <div class="sub small" style="margin-top:8px">${pl.items.map(i => esc(exById(i.exId).name)).join(' · ')}</div>
        <button class="btn lav" style="margin-top:12px" data-a="startPlan" data-v="${pl.id}">Starten</button></div>`;
    }).join('');
  }
  html += `<button class="btn soft" style="margin-top:16px" data-a="modal" data-v="templates">Aus Vorlage erstellen</button>`;
  return html;
}

/* ---------- Verlauf ---------- */

function historyItem(it) {
  if (it.kind === 'w') {
    return `<button class="li" data-a="workoutDetail" data-v="${it.id}"><div class="ico" style="background:var(--lavender);color:var(--lavender-deep)">${icon('dumbbell')}</div>
      <div class="grow"><div class="t">${esc(it.name)}</div><div class="s">${relDay(it.t)} · ${fmtDuration(it.durationMin)} · ${workoutSetCount(it)} Sätze</div></div><span class="chev">›</span></button>`;
  }
  const t = ACTIVITY_TYPES.find(a => a.id === it.type) || ACTIVITY_TYPES[ACTIVITY_TYPES.length - 1];
  return `<button class="li" data-a="activityDetail" data-v="${it.id}"><div class="ico" style="background:var(--mint);color:var(--mint-deep)">${icon('clock')}</div>
    <div class="grow"><div class="t">${esc(t.name)}${it.note ? ' · ' + esc(it.note) : ''}</div><div class="s">${relDay(it.t)} · ${fmtDuration(it.minutes)}</div></div><span class="chev">›</span></button>`;
}

function viewHistory() {
  let html = header('Verlauf', '', `<button class="icon-btn" data-a="modal" data-v="activity" aria-label="Zeit eintragen">${icon('plus')}</button>`);
  html += `<div class="seg" style="margin-bottom:6px">${[['alle', 'Alle'], ['kraft', 'Kraft'], ['andere', 'Andere']].map(([v, l]) => `<button class="${ui.histFilter === v ? 'on' : ''}" data-a="histFilter" data-v="${v}">${l}</button>`).join('')}</div>`;
  let items = [];
  if (ui.histFilter !== 'andere') items = items.concat(S.workouts.map(w => ({ ...w, kind: 'w' })));
  if (ui.histFilter !== 'kraft') items = items.concat(S.activities.map(a => ({ ...a, kind: 'a' })));
  items.sort((a, b) => b.t - a.t);
  if (!items.length) return html + `<div class="card empty" style="margin-top:12px">Noch nichts eingetragen.</div>`;
  const groups = {};
  for (const it of items) (groups[weekStart(it.t)] ||= []).push(it);
  const thisW = weekStart(Date.now());
  for (const [ws, list] of Object.entries(groups).sort((a, b) => b[0] - a[0])) {
    const w = +ws;
    const label = w === thisW ? 'Diese Woche' : w === shiftWeek(thisW, -1) ? 'Letzte Woche' : `${fmtDate(w)} – ${fmtDate(shiftWeek(w, 1) - DAY)}`;
    const mins = list.reduce((a, i) => a + (i.kind === 'w' ? i.durationMin : i.minutes), 0);
    html += `<div class="section-title"><h2 class="h-sm">${label}</h2><span class="muted small">${list.length}× · ${fmtDuration(mins)}</span></div><div class="list">${list.map(historyItem).join('')}</div>`;
  }
  return html;
}

/* ---------- Daten ---------- */

function viewData() {
  const lv = levelFromXP(computeXP());
  const st = weeklyStreak();
  const prs = allPRs();
  let html = header('Fortschritt');

  html += `<div class="hero"><div class="lvl">Level ${lv.level}</div><div class="title">${lv.title}</div>
    <div class="xpbar"><i style="width:${lv.into / lv.need * 100}%"></i></div>
    <div class="small" style="margin-top:6px;color:var(--ink-2);font-weight:600">Noch ${lv.need - lv.into} XP bis Level ${lv.level + 1}</div></div>`;

  html += `<div class="grid3" style="margin-top:12px">
    <div class="stat card tint-peach"><div class="v">${st.streak}</div><div class="l">Wochen in Folge</div></div>
    <div class="stat card tint-mint"><div class="v">${S.workouts.length + S.activities.length}</div><div class="l">Trainings</div></div>
    <div class="stat card tint-sky"><div class="v">${prs.length}</div><div class="l">Rekorde</div></div></div>`;

  const weeks = [];
  for (let i = 9; i >= 0; i--) weeks.push(shiftWeek(weekStart(Date.now()), -i));
  const kraft = weeks.map(ws => S.workouts.filter(w => weekStart(w.t) === ws).reduce((a, w) => a + w.durationMin, 0));
  const other = weeks.map(ws => S.activities.filter(w => weekStart(w.t) === ws).reduce((a, w) => a + w.minutes, 0));
  html += `<div class="section-title"><h2>Minuten pro Woche</h2></div><div class="card">
    ${barChart({ labels: weeks.map(ws => fmtDate(ws, { day: 'numeric', month: 'numeric' })), stacks: [{ values: kraft, color: 'var(--lavender-deep)' }, { values: other, color: 'var(--mint-deep)' }] })}
    <div class="legend"><span><i style="background:var(--lavender-deep)"></i>Kraft</span><span><i style="background:var(--mint-deep)"></i>Andere</span></div></div>`;

  const ids = trainedExerciseIds().sort((a, b) => A(b).hist.at(-1).t - A(a).hist.at(-1).t);
  html += `<div class="section-title"><h2>Kraft</h2><button class="link" data-a="info1rm">Wie wird das berechnet?</button></div>`;
  if (!ids.length) html += `<div class="card empty">Nach den ersten Trainings siehst du hier jede Übung.</div>`;
  else {
    const shown = ui.showAllEx ? ids : ids.slice(0, 8);
    html += `<div class="list">${shown.map(id => {
      const a = A(id), s = STATUS[a.status];
      const pct = a.actualPct !== undefined ? fmtPct(a.actualPct) : a.longTermPct !== undefined ? `gesamt ${fmtPct(a.longTermPct, 0)}` : '';
      return `<button class="li" data-a="exDetail" data-v="${id}"><div class="grow"><div class="t">${esc(exById(id).name)}</div>
        <div class="s"><span class="dot-status ${s.cls}"></span>${s.label}${pct ? ' · ' + pct : ''}</div></div>
        ${sparkline(a.hist.slice(-10).map(h => h.e1rm), cvar(s.cls))}<span class="chev">›</span></button>`;
    }).join('')}</div>`;
    if (ids.length > 8) html += `<button class="btn ghost" data-a="toggleAllEx">${ui.showAllEx ? 'Weniger anzeigen' : `Alle ${ids.length} Übungen`}</button>`;
  }

  const range = ui.muscleRange;
  const ms = muscleSets(Date.now() - range * DAY);
  const perWeek = Object.fromEntries(Object.entries(ms).map(([k, v]) => [k, v / (range / 7)]));
  const trained = Object.entries(perWeek).filter(([, v]) => v >= 0.5).sort((a, b) => b[1] - a[1]);
  const untrained = Object.entries(perWeek).filter(([, v]) => v < 0.5).map(([k]) => MUSCLES[k].name);
  html += `<div class="section-title"><h2>Muskeln</h2></div><div class="card">
    <div class="seg" style="margin-bottom:12px">${[[7, 'Letzte 7 Tage'], [28, 'Ø 4 Wochen']].map(([v, l]) => `<button class="${range === v ? 'on' : ''}" data-a="muscleRange" data-v="${v}">${l}</button>`).join('')}</div>
    ${bodyMap(perWeek, { max: 20 })}
    ${trained.length ? `<div style="margin-top:14px">${trained.map(([k, v]) => {
      const z = volumeZone(v);
      return `<div class="mrow"><div class="row between small"><b>${MUSCLES[k].name}</b><span class="muted">${fmt(v, 1)} Sätze/Woche</span></div>
      <div class="bar"><span class="zone" style="left:40%;width:40%"></span><i style="width:${Math.min(100, v / 25 * 100)}%;background:${z.cls === 'good' ? 'var(--mint-deep)' : z.cls === 'high' ? 'var(--peach-deep)' : 'var(--rose-deep)'}"></i></div></div>`;
    }).join('')}</div>` : ''}
    ${untrained.length ? `<p class="muted small" style="margin-top:12px">Nicht trainiert: ${untrained.join(', ')}</p>` : ''}
    <p class="muted small" style="margin-top:6px">Grüner Bereich: 10–20 Sätze pro Woche, ideal für Muskelaufbau.</p></div>`;

  const stds = S.profile.sex && S.profile.sex !== 'x' ? Object.keys(STRENGTH_STANDARDS.m).map(id => [id, strengthStandard(id)]).filter(([, s]) => s) : [];
  if (stds.length) html += `<div class="section-title"><h2>Kraftvergleich</h2></div>${stds.map(([id, s]) => stdCard(id, s)).join('')}`;

  html += `<div class="section-title"><h2>Körpergewicht</h2><button class="link" data-a="modal" data-v="bodyweight">Eintragen</button></div>`;
  html += bodyweightCard();

  if (prs.length) {
    html += `<div class="section-title"><h2>Neueste Rekorde</h2></div><div class="list">${prs.slice(-5).reverse().map(pr =>
      `<button class="li" data-a="exDetail" data-v="${pr.exId}"><div class="grow"><div class="t">${esc(exById(pr.exId).name)}</div>
      <div class="s">${fmt(pr.set.kg)} kg × ${pr.set.reps} · ${fmtPct((pr.e1rm / pr.prev - 1) * 100)}</div></div><span class="muted small">${relDay(pr.t)}</span></button>`).join('')}</div>`;
  }

  const badges = earnedBadges();
  html += `<div class="section-title"><h2>Abzeichen</h2><span class="muted small">${badges.filter(b => b.earned).length} von ${badges.length}</span></div>
    <div class="badges">${badges.map(b => `<div class="badge ${b.earned ? '' : 'off'}"><div class="e">${b.emoji}</div><div class="n">${b.name}</div><div class="d">${b.desc}</div></div>`).join('')}</div>`;
  return html;
}

function stdCard(id, s, title = exById(id).name) {
  const th = s.thresholds;
  const lo = th[0] * 0.7, hi = th[th.length - 1] * 1.1;
  const pos = Math.max(0, Math.min(100, (s.ratio - lo) / (hi - lo) * 100));
  return `<div class="card"><div class="row between"><h3>${esc(title)}</h3><span class="pill lavender">${s.label}</span></div>
    <div class="sub">${fmt(s.ratio, 2)}× dein Körpergewicht${s.next ? ` · nächste Stufe ab ${fmt(roundTo(s.nextKg, 2.5))} kg` : ''}</div>
    <div class="std"><div class="mark" style="left:${pos}%"></div></div>
    <div class="std-labels">${STANDARD_LABELS.map(l => `<span>${l === 'Fortgeschritten' ? 'Fortg.' : l === 'Untrainiert' ? 'Untr.' : l}</span>`).join('')}</div></div>`;
}

function bodyweightCard() {
  if (!S.bodyweights.length) return `<div class="card empty">Noch kein Gewicht eingetragen.</div>`;
  const pts = S.bodyweights.slice(-30).map(b => ({ x: b.t, y: b.kg }));
  const tr = bodyweightTrend();
  return `<div class="card"><div class="row between"><div class="stat" style="padding:0"><div class="v">${fmt(currentBodyweight())} kg</div><div class="l">Ziel: ${GOALS[S.profile.goal].short}</div></div>
    ${tr ? `<span class="pill ${/empfohlenen|stabil/.test(tr.verdict) ? 'mint' : 'butter'}">${tr.perWeek > 0 ? '+' : ''}${fmt(tr.perWeek, 2)} kg/Woche</span>` : ''}</div>
    ${pts.length > 1 ? `<div style="margin-top:10px">${lineChart({ series: [{ pts, color: 'var(--peach-deep)', dots: true, area: true }], yFmt: v => fmt(v, 0) })}</div>` : ''}
    <div class="sub" style="margin-top:8px">${tr ? tr.verdict + '.' : 'Ab zwei Einträgen im Abstand von einer Woche siehst du hier deinen Trend.'}</div></div>`;
}

/* ---------- Profil ---------- */

function viewProfile() {
  const p = S.profile;
  const seg = (f, opts, cur) => `<div class="seg">${opts.map(([k, l]) => `<button class="${cur === k ? 'on' : ''}" data-a="setProfile" data-f="${f}" data-v="${k}">${l}</button>`).join('')}</div>`;
  let html = header('Profil');
  html += `<div class="card">
    <label class="f" style="margin-top:0">Name</label><input class="input" data-in="profile" data-f="name" value="${esc(p.name || '')}" placeholder="Vorname">
    <label class="f">Erfahrung</label>${seg('level', [['anf', 'Anfänger'], ['fort', 'Fortgeschr.'], ['erf', 'Erfahren']], p.level)}
    <label class="f">Ziel</label>${seg('goal', Object.entries(GOALS).map(([k, g]) => [k, g.short]), p.goal)}
    <label class="f">Geschlecht</label>${seg('sex', [['w', 'Weiblich'], ['m', 'Männlich'], ['x', 'Keine Angabe']], p.sex)}
    <label class="f">Trainings pro Woche</label>${seg('weeklyTarget', [2, 3, 4, 5, 6].map(n => [n, n + '×']), p.weeklyTarget)}
    <label class="f">Ans Wiegen erinnern</label>${seg('bwInterval', [[7, 'Wöchentl.'], [14, '2 Wochen'], [30, 'Monatl.'], [0, 'Nie']], p.bwInterval ?? 14)}
  </div>`;
  html += `<div class="section-title"><h2>Körpergewicht</h2><button class="link" data-a="modal" data-v="bodyweight">Eintragen</button></div>`;
  html += S.bodyweights.length ? `<div class="list">${S.bodyweights.slice(-5).reverse().map(b => `<div class="li"><div class="grow"><div class="t">${fmt(b.kg)} kg</div><div class="s">${fmtDate(b.t, { day: 'numeric', month: 'long', year: 'numeric' })}</div></div><button class="icon-btn ghost" data-a="delBw" data-v="${b.t}" aria-label="Löschen">${icon('trash')}</button></div>`).join('')}</div>` : `<div class="card empty">Noch keine Einträge.</div>`;

  const row = (attrs, ic, title, sub, tag = 'button', extra = '') => `<${tag} class="li" ${attrs}><div class="ico">${icon(ic)}</div><div class="grow"><div class="t">${title}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>${extra}</${tag}>`;
  html += `<div class="section-title"><h2>Daten</h2></div><div class="list">
    ${row('style="cursor:pointer"', 'import', 'Aus anderer App importieren', 'CSV, z. B. von FitnessOnline', 'label', '<input type="file" accept=".csv,text/csv,text/plain" data-in="importCsv" hidden>')}
    ${row('data-a="export"', 'download', 'Backup speichern', 'Als Datei auf dem Gerät')}
    ${row('style="cursor:pointer"', 'upload', 'Backup wiederherstellen', 'Ersetzt die aktuellen Daten', 'label', '<input type="file" accept="application/json,.json" data-in="import" hidden>')}
    ${S.workouts.some(w => w.demo) ? row('data-a="removeDemo"', 'flask', 'Beispieldaten entfernen', '') : row('data-a="demo"', 'flask', 'Beispieldaten laden', 'Zum Ausprobieren, jederzeit entfernbar')}
    ${row('data-a="reset"', 'alert', '<span style="color:var(--rose-deep)">Alles löschen</span>', '')}</div>
    <p class="muted small" style="margin:12px 4px;line-height:1.5">Alles liegt nur auf diesem Gerät. Wer die App vom Home-Bildschirm löscht, löscht auch die Daten – speicher ab und zu ein Backup.</p>`;
  return html;
}

/* ---------- Aktives Training ---------- */

function viewActive() {
  const w = S.active;
  let html = `<div class="workout-top"><button class="icon-btn" data-a="minimize" aria-label="Minimieren">${icon('down')}</button><div class="grow"><div style="font-weight:800;font-size:18px">${esc(w.name)}</div><div class="timer" id="wtimer">${clock(Date.now() - w.start)}</div></div>
    <button class="btn sm mint" data-a="finish">Beenden</button></div>`;
  if (!w.entries.length) html += `<div class="card empty">Füge deine erste Übung hinzu.</div>`;
  w.entries.forEach((e, ei) => {
    const ex = exById(e.exId);
    const sug = suggestWeight(e.exId, e.repsMin, e.repsMax);
    const hist = A(e.exId).hist;
    const last = hist[hist.length - 1];
    const lastNote = [...hist].reverse().find(h => h.note);
    const sugKg = sug.kg !== null && sug.kg > 0 ? String(sug.kg).replace('.', ',') : null;
    const differs = sugKg && e.sets.some(s => !s.done && s.kg !== sugKg);
    html += `<div class="ex-card"><div class="head"><div class="grow"><div class="name">${esc(ex.name)}</div>
      <div class="sub small">${ex.primary.map(m => MUSCLES[m].name).join(', ')}</div></div>
      <button class="icon-btn" data-a="exDetail" data-v="${e.exId}" aria-label="Verlauf">${icon('chart')}</button><button class="icon-btn" data-a="removeEntry" data-v="${ei}" aria-label="Entfernen">${icon('x')}</button></div>
      <div class="suggest ${sug.type}"><div class="grow">${sug.text}</div>
      ${differs ? `<button class="btn sm soft" data-a="applySug" data-v="${ei}" data-kg="${sug.kg}" data-t="${sug.type}">${sugKg} kg setzen</button>` : ''}</div>
      ${e.mode ? `<div class="prev">Leichte Einheit, zählt nicht zum Trend · <button class="link-inline" data-a="clearMode" data-v="${ei}">normal werten</button></div>` : ''}
      ${last ? `<div class="prev">Letztes Mal: ${last.sets.map(s => `${fmt(s.kg)}×${s.reps}`).join(', ')}</div>` : ''}
      ${lastNote && !e.note ? `<div class="prev">Notiz: ${esc(lastNote.note)}</div>` : ''}
      <div class="sets"><div class="set-row head"><span></span><span>${ex.bw ? '+kg' : 'kg'}</span><span>Wdh.</span><span></span></div>
      ${e.sets.map((s, si) => `<div class="set-row ${s.done ? 'done' : ''}"><span class="n">${si + 1}</span>
        <input inputmode="decimal" data-in="set" data-e="${ei}" data-s="${si}" data-f="kg" value="${esc(s.kg)}" placeholder="${sugKg ?? '0'}" aria-label="Gewicht Satz ${si + 1}">
        <input inputmode="numeric" data-in="set" data-e="${ei}" data-s="${si}" data-f="reps" value="${esc(s.reps)}" placeholder="${e.repsMin}–${e.repsMax}" aria-label="Wiederholungen Satz ${si + 1}">
        <button class="check" data-a="toggleSet" data-e="${ei}" data-s="${si}" aria-label="Satz erledigt">${icon('check')}</button></div>`).join('')}</div>
      <textarea class="input note-in" rows="1" data-in="entryNote" data-e="${ei}" placeholder="Notiz (z. B. Sitzhöhe, Griff)">${esc(e.note || '')}</textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm ghost" data-a="addSet" data-v="${ei}">+ Satz</button>${e.sets.length > 1 ? `<button class="btn sm ghost" data-a="removeSet" data-v="${ei}">− Satz</button>` : ''}</div></div>`;
  });
  html += `<button class="btn lav" data-a="picker" data-v="active">Übung hinzufügen</button>
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
  return `<div class="rest">Pause <span id="rest-t">${clock(Date.now() - ui.restStart)}</span><button data-a="stopRest" aria-label="Pause ausblenden">${icon('x')}</button></div>`;
}

/* ---------- Modals ---------- */

function sheet(title, body, { full = false, right = '' } = {}) {
  return `<div class="backdrop" data-a="close"></div><div class="sheet ${full ? 'full' : ''}" role="dialog" aria-label="${esc(title)}">${full ? '' : '<div class="grab"></div>'}
    <div class="sheet-head"><h2>${title}</h2><div class="row">${right}<button class="icon-btn" data-a="close" aria-label="Schließen">${icon('x')}</button></div></div>${body}</div>`;
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
    case 'importPreview': return modalImportPreview(m);
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
  const body = `<input class="input" id="picker-q" data-in="pickerQ" value="${esc(m.q || '')}" placeholder="Übung suchen" autocomplete="off">
    <div class="hscroll" style="margin-top:10px"><button class="chip ${!m.muscle ? 'on' : ''}" data-a="pickMuscle" data-v="">Alle</button>${Object.entries(MUSCLES).map(([k, v]) => `<button class="chip ${m.muscle === k ? 'on' : ''}" data-a="pickMuscle" data-v="${k}">${v.name}</button>`).join('')}</div>
    <div class="hscroll"><button class="chip ${!m.equip ? 'on' : ''}" data-a="pickEquip" data-v="">Alles Equipment</button>${equips.map(k => `<button class="chip ${m.equip === k ? 'on' : ''}" data-a="pickEquip" data-v="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="list" style="margin-top:8px" id="picker-list">${list.map(e => `<button class="li" data-a="pick" data-v="${e.id}"><div class="grow"><div class="t">${esc(e.name)}</div>
      <div class="s">${e.primary.map(p => MUSCLES[p].name).join(', ')} · ${esc(e.equip)}</div></div>${inCtx.has(e.id) ? `<span class="pick-state on">${icon('check')}</span>` : `<span class="pick-state">${icon('plus')}</span>`}</button>`).join('') || '<div class="empty">Nichts gefunden.</div>'}</div>
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
  return sheet(d.id ? 'Eintrag bearbeiten' : 'Zeit eintragen', `
    <div class="chips">${ACTIVITY_TYPES.map(t => `<button class="chip ${d.type === t.id ? 'on' : ''}" data-a="actSet" data-f="type" data-v="${t.id}">${t.name}</button>`).join('')}</div>
    <label class="f">Dauer</label>
    <div class="stepper" style="margin-top:4px"><button data-a="actMin" data-v="-5" aria-label="5 Minuten weniger">−</button><div class="v" style="font-size:40px">${d.minutes}<span class="muted" style="font-size:18px"> min</span></div><button data-a="actMin" data-v="5" aria-label="5 Minuten mehr">+</button></div>
    <div class="chips" style="justify-content:center;margin-top:10px">${[20, 30, 45, 60, 90].map(n => `<button class="chip ${d.minutes === n ? 'on' : ''}" data-a="actSet" data-f="minutes" data-v="${n}">${n}</button>`).join('')}</div>
    <label class="f">Datum</label><input class="input" type="date" data-in="act" data-f="date" value="${toDateInput(d.t)}" max="${toDateInput(Date.now())}">
    <label class="f">Notiz</label><input class="input" data-in="act" data-f="note" value="${esc(d.note || '')}" placeholder="optional">
    <button class="btn" style="margin-top:18px" data-a="saveActivity">Speichern</button>`);
}

function modalBodyweight(m) {
  return sheet('Körpergewicht', `<div class="kg-input big"><input class="input" id="bw-in" inputmode="decimal" data-in="bwKg" value="${esc(String(m.kg).replace('.', ','))}"><span>kg</span></div>
    <p class="sub" style="text-align:center;margin-top:10px">Am besten morgens, vor dem Frühstück.</p>
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
      <button class="icon-btn" data-a="planMove" data-v="${i}" aria-label="Nach oben">${icon('up')}</button><button class="icon-btn" data-a="planRemove" data-v="${i}" aria-label="Entfernen">${icon('x')}</button>
      <div class="row small" style="width:100%;gap:8px"><input class="input" style="width:60px;padding:8px;text-align:center" inputmode="numeric" data-in="planItem" data-i="${i}" data-f="sets" value="${it.sets}"><span class="muted">Sätze à</span>
      <input class="input" style="width:56px;padding:8px;text-align:center" inputmode="numeric" data-in="planItem" data-i="${i}" data-f="repsMin" value="${it.repsMin}"><span class="muted">–</span>
      <input class="input" style="width:56px;padding:8px;text-align:center" inputmode="numeric" data-in="planItem" data-i="${i}" data-f="repsMax" value="${it.repsMax}"><span class="muted">Wdh.</span></div></div>`).join('')}</div>` : '<div class="card empty">Noch keine Übungen.</div>'}
    <button class="btn lav" style="margin-top:10px" data-a="picker" data-v="plan">Übung hinzufügen</button>
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
  return sheet(esc(w.name), `<div class="sub" style="margin-bottom:12px">${fmtDateLong(w.t)} · ${fmtDuration(w.durationMin)} · ${workoutSetCount(w)} Sätze · ${fmt(workoutVolume(w) / 1000, 1)} t</div>
    ${w.entries.map(e => `<div class="card"><div class="row between"><h3>${esc(exById(e.exId).name)}</h3>${prs.some(p => p.exId === e.exId) ? '<span class="pill butter">Rekord</span>' : ''}</div>
      <div class="sub">${e.sets.filter(s => s.reps > 0).map(s => `${fmt(s.kg)} × ${s.reps}`).join(' · ')}</div>${e.note ? `<div class="sub small muted" style="margin-top:6px">${esc(e.note)}</div>` : ''}</div>`).join('')}
    ${w.notes?.length ? `<div class="card"><h3>Notizen</h3><div class="sub">${w.notes.map(esc).join('<br>')}</div></div>` : ''}
    <div class="card">${bodyMap(ms)}</div>
    <button class="btn danger" style="margin-top:12px" data-a="deleteWorkout" data-v="${w.id}">Training löschen</button>`);
}

function modalActivityDetail(m) {
  const a = S.activities.find(x => x.id === m.id);
  if (!a) return '';
  const t = ACTIVITY_TYPES.find(x => x.id === a.type) || ACTIVITY_TYPES[0];
  return sheet(esc(t.name), `<div class="card"><div class="stat" style="padding:0"><div class="v">${fmtDuration(a.minutes)}</div><div class="l">${fmtDateLong(a.t)}</div></div>${a.note ? `<div class="sub" style="margin-top:8px">${esc(a.note)}</div>` : ''}</div>
    <button class="btn soft" style="margin-top:12px" data-a="editActivity" data-v="${a.id}">Bearbeiten</button>
    <button class="btn danger" style="margin-top:6px" data-a="deleteActivity" data-v="${a.id}">Löschen</button>`);
}

function modalExDetail(m) {
  const ex = exById(m.id);
  const a = A(m.id);
  const s = STATUS[a.status];
  let body = `<div class="sub" style="margin:-6px 0 12px">${ex.primary.map(k => MUSCLES[k].name).join(', ')}${ex.secondary.length ? ` · mit ${ex.secondary.map(k => MUSCLES[k].name).join(', ')}` : ''} · ${esc(ex.equip)}</div>`;
  if (!a.hist.length) {
    body += `<div class="card">${exerciseBodyMap(ex)}</div><div class="card empty">Noch keine Einheiten.</div>`;
    return sheet(esc(ex.name), body);
  }
  const pts = a.hist.filter(h => h.t > Date.now() - 180 * DAY).map(h => ({ x: h.t, y: h.e1rm }));
  const series = [{ pts: pts.length ? pts : a.hist.slice(-12).map(h => ({ x: h.t, y: h.e1rm })), color: 'var(--lavender-deep)', dots: true, area: true, width: 2 }];
  if (a.reg && a.window?.length >= 2) {
    const w0 = a.window[0].t, w1 = a.window[a.window.length - 1].t;
    const span = (w1 - w0) / DAY;
    series.push({ pts: [{ x: w0, y: a.reg.a }, { x: w1, y: a.reg.a + a.reg.b * span }], color: cvar(s.cls), width: 3 });
    if (a.expectedPct !== undefined) series.push({ pts: [{ x: w0, y: a.reg.a }, { x: w1, y: a.reg.a * (1 + a.expectedPct / 100) }], color: 'var(--muted)', dash: '5 5', width: 2 });
  }
  const last = a.hist[a.hist.length - 1];
  const best = Math.max(...a.hist.map(h => h.e1rm));
  body += `<div class="card"><div class="row between"><div><div class="small muted row" style="font-weight:700;gap:6px">Geschätztes 1RM <button class="info-btn" data-a="info1rm" aria-label="Was ist das 1RM?">?</button></div><div style="font-size:28px;font-weight:800">${fmt(last.e1rm)} kg</div></div><span class="pill ${s.cls}">${s.label}</span></div>
    <div style="margin-top:10px">${lineChart({ series })}</div>
    <div class="legend"><span><i style="background:var(--lavender-deep)"></i>1RM</span>${a.reg && a.window?.length >= 2 ? `<span><i style="background:${cvar(s.cls)}"></i>Trend</span>` : ''}${a.expectedPct !== undefined ? '<span><i class="dash" style="border-color:var(--muted)"></i>Erwartet</span>' : ''}</div>`;
  if (a.actualPct !== undefined) {
    const weeks = Math.max(1, Math.round(a.spanDays / 7));
    const freq = a.window.length / Math.max(1, (Date.now() - a.window[0].t) / (7 * DAY));
    body += `<div class="trend-line"><div><b>${fmtPct(a.actualPct)}</b><span>in ${weeks} Wochen</span></div><div><b>${fmtPct(a.expectedPct)}</b><span>erwartet</span></div></div>
      <p class="muted small" style="margin-top:8px">Erwartung für ${LEVELS[S.profile.level].name.replace('Fortgeschritten', 'Fortgeschrittene')}, bei ${fmt(freq, 1)}× pro Woche.</p>`;
  } else {
    body += `<p class="muted small" style="margin-top:8px">${a.status === 'pause' ? 'Letzte Einheit vor über 4 Wochen – kein aktueller Trend.' : `Trend ab 3 Einheiten in ${LEVELS[S.profile.level].windowWeeks * 2} Wochen.`}</p>`;
  }
  body += `</div>`;
  const sug = suggestWeight(m.id);
  body += `<div class="suggest ${sug.type}" style="margin-top:12px"><div><b>Nächstes Mal:</b> ${sug.text}</div></div>`;
  body += `<div class="grid3" style="margin-top:12px"><div class="stat card"><div class="v">${fmt(best, 0)}</div><div class="l">Bestes 1RM</div></div>
    <div class="stat card"><div class="v">${a.hist.length}</div><div class="l">Einheiten</div></div>
    <div class="stat card"><div class="v">${a.longTermPct !== undefined ? fmtPct(a.longTermPct, 0) : '–'}</div><div class="l">${a.longTermFrom ? 'seit ' + fmtDate(a.longTermFrom, { month: 'short', year: '2-digit' }) : 'Gesamt'}</div></div></div>`;
  const std = strengthStandard(m.id);
  if (std) body += `<div style="margin-top:12px">${stdCard(m.id, std, 'Kraftvergleich')}</div>`;
  body += `<div class="section-title"><h2 class="h-sm">Letzte Einheiten</h2></div><div class="list">${a.hist.slice(-6).reverse().map(h => `<div class="li"><div class="grow"><div class="t">${h.sets.map(x => `${fmt(x.kg)}×${x.reps}`).join(', ')}</div><div class="s">${relDay(h.t)}${h.note ? ' · ' + esc(h.note) : ''}</div></div><span class="muted small">${fmt(h.e1rm, 0)}</span></div>`).join('')}</div>`;
  return sheet(esc(ex.name), body);
}

function modalSummary(m) {
  const w = S.workouts.find(x => x.id === m.id);
  if (!w) return '';
  const ms = {};
  w.entries.forEach(e => { const ex = exById(e.exId); const n = e.sets.filter(s => s.reps > 0).length; ex.primary.forEach(k => ms[k] = (ms[k] || 0) + n); ex.secondary.forEach(k => ms[k] = (ms[k] || 0) + n / 2); });
  return sheet('Training gespeichert', `
    <div class="hero" style="text-align:center"><div class="title">+${m.xp} XP</div>
    ${m.levelUp ? `<div class="lvl" style="margin-top:4px">Neues Level: ${m.level}</div>` : ''}</div>
    <div class="grid3" style="margin-top:12px"><div class="stat card"><div class="v">${fmtDuration(w.durationMin)}</div><div class="l">Dauer</div></div><div class="stat card"><div class="v">${workoutSetCount(w)}</div><div class="l">Sätze</div></div><div class="stat card"><div class="v">${fmt(workoutVolume(w) / 1000, 1)} t</div><div class="l">bewegt</div></div></div>
    ${m.prs.length ? `<div class="section-title"><h2 class="h-sm">Neue Rekorde</h2></div><div class="list">${m.prs.map(p => `<div class="li"><div class="grow"><div class="t">${esc(exById(p.exId).name)}</div><div class="s">${fmt(p.set.kg)} kg × ${p.set.reps}</div></div><span class="pill butter">${fmtPct((p.e1rm / p.prev - 1) * 100)}</span></div>`).join('')}</div>` : ''}
    ${m.badges.length ? `<div class="section-title"><h2 class="h-sm">Neue Abzeichen</h2></div><div class="badges">${m.badges.map(b => `<div class="badge"><div class="e">${b.emoji}</div><div class="n">${b.name}</div></div>`).join('')}</div>` : ''}
    <div class="card" style="margin-top:12px">${bodyMap(ms)}</div>
    <button class="btn" style="margin-top:16px" data-a="close">Fertig</button>`);
}

function modalInfo1RM() {
  return sheet('Was ist das 1RM?', `
    <div class="card prose">
      <p><b>1RM</b> steht für „One-Rep-Max“: das Gewicht, das du genau einmal schaffen würdest.</p>
      <p>Testen musst du das nie. Die App schätzt es aus deinen normalen Sätzen:<br><b>Gewicht × (1 + Wdh. ÷ 30)</b><br>80 kg × 8 Wdh. ergibt ungefähr 101 kg.</p>
      <p>So lassen sich verschiedene Sätze vergleichen: 80 kg × 8 und 90 kg × 4 sind etwa gleich stark. Steigt die Zahl über die Wochen, wirst du stärker – egal ob du mehr Gewicht oder mehr Wiederholungen machst.</p>
      <p class="muted">Bis etwa 10 Wiederholungen ist die Schätzung recht genau. Wichtig ist nicht die exakte Zahl, sondern die Richtung.</p>
    </div>
    <div class="card prose">
      <p><b>Trend und Erwartung</b></p>
      <p>Der Trend ist eine Gerade durch deine letzten Einheiten. Einzelne schlechte Tage und leichte Wochen zählen kaum.</p>
      <p>Die Erwartung hängt von deiner Erfahrung, deinem Ziel und davon ab, wie oft du die Übung wirklich gemacht hast. Liegt dein Trend über mehrere Wochen deutlich darunter, meldet die App eine Stagnation.</p>
    </div>
    <button class="btn" style="margin-top:8px" data-a="close">Verstanden</button>`);
}

function openFlags(m) { return m.imp.flags.filter(f => !m.choices?.[f.id]).length; }
function importFlagsHtml(m, lookup) {
  const flags = m.imp.flags;
  if (!flags.length) return '';
  const ch = m.choices || {};
  const dOpt = { day: 'numeric', month: 'short', year: '2-digit' };
  return `<div class="section-title"><h2 class="h-sm">Bitte prüfen</h2><span class="muted small">${openFlags(m)} von ${flags.length} offen</span></div>
    <p class="sub small" style="margin:-4px 4px 10px;line-height:1.45">Hier ändert sich das Gewicht plötzlich stark – oft steckt ein anderes Gerät dahinter.</p>
    <div class="stack">${flags.map(f => {
      const ex = lookup(f.exId);
      const opts = VARIANT_CHOICES.filter(v => !v.equip || v.equip !== ex.equip);
      const chip = (val, label) => `<button class="chip ${ch[f.id] === val ? 'on' : ''}" data-a="flagChoice" data-f="${esc(f.id)}" data-v="${esc(val)}">${label}</button>`;
      return `<div class="card ${ch[f.id] ? '' : 'tint-butter'}"><h3>${esc(ex.name)}</h3>
        <div class="sub">${f.keys.length} ${f.keys.length === 1 ? 'Einheit' : 'Einheiten'} (${fmtDate(f.from, dOpt)}${f.keys.length > 1 ? ' – ' + fmtDate(f.to, dOpt) : ''}) mit <b>${fmt(f.minKg)}${f.maxKg !== f.minKg ? '–' + fmt(f.maxKg) : ''} kg</b> statt sonst ca. <b>${fmt(f.baseKg)} kg</b></div>
        <div class="sub small muted" style="margin-top:4px">z. B. ${f.sample.map(x => `${fmt(x.kg)}×${x.reps}`).join(', ')}</div>
        <div class="small" style="font-weight:700;margin:10px 0 6px;color:var(--ink-2)">Das war:</div>
        <div class="chips">${chip('ok', 'Gleiche Übung')}${opts.map(v => chip(v.label, v.label === 'ohne Gewicht' ? 'ohne Gewicht' : (['liegend', 'anderes Gerät'].includes(v.label) ? v.label : `mit ${v.label}`))).join('')}${chip('drop', 'Weglassen')}</div></div>`;
    }).join('')}</div>`;
}

function modalImportPreview(m) {
  const imp = m.imp;
  if (!imp.workouts.length) return sheet('Import', '<div class="card empty">In der Datei wurden keine Krafttrainings gefunden.</div>');
  const existing = imp.workouts.filter(w => S.workouts.some(x => x.id === w.id)).length;
  const byEx = {};
  imp.workouts.forEach(w => w.entries.forEach(e => byEx[e.exId] = (byEx[e.exId] || 0) + e.sets.length));
  const lookup = id => imp.customs.find(c => c.id === id) || exById(id);
  const dOpt = { day: 'numeric', month: 'short', year: 'numeric' };
  return sheet('Import prüfen', `
    <div class="grid3"><div class="stat card tint-lavender"><div class="v">${imp.workouts.length}</div><div class="l">Trainings</div></div>
      <div class="stat card tint-mint" style="margin-top:0"><div class="v">${imp.sets}</div><div class="l">Sätze</div></div>
      <div class="stat card tint-peach" style="margin-top:0"><div class="v">${imp.exercises}</div><div class="l">Übungen</div></div></div>
    <div class="card" style="margin-top:12px"><div class="sub">Zeitraum: <b>${fmtDate(imp.from, dOpt)} – ${fmtDate(imp.to, dOpt)}</b>${existing ? `<br>${existing} Trainings gibt es schon aus einem früheren Import – sie werden ersetzt, nicht doppelt angelegt.` : ''}${imp.customs.length ? `<br>${imp.customs.length} eigene Übungen werden angelegt${imp.variants ? `, davon ${imp.variants} Varianten (z. B. „liegend“ oder „Kurzhantel“ aus deinen Notizen), damit ein Gerätewechsel nicht wie Kraftverlust aussieht` : ''}.` : ''}</div></div>
    ${imp.unmapped.length ? `<div class="card tint-butter"><h3>Automatisch zugeordnet</h3><div class="sub">Diese Namen kannte die App nicht, die Muskelgruppe wurde geschätzt: ${imp.unmapped.map(esc).join(', ')}</div></div>` : ''}
    ${importFlagsHtml(m, lookup)}
    <div class="section-title"><h2 style="font-size:16px">Übungen</h2></div>
    <div class="list">${Object.entries(byEx).sort((a, b) => b[1] - a[1]).map(([id, n]) => { const ex = lookup(id); return `<div class="li"><div class="grow"><div class="t">${esc(ex.name)}</div><div class="s">${ex.primary.map(p => MUSCLES[p].name).join(', ')}${ex.custom ? ' · eigene Übung' : ''}</div></div><span class="muted small">${n} Sätze</span></div>`; }).join('')}</div>
    <p class="muted small" style="margin:12px 4px;line-height:1.45">Notizen aus der Datei landen bei der jeweiligen Übung. Zeitübungen (z. B. Planke 30 s) und Cardio (z. B. Crosstrainer) stehen als Notiz am Training. Die Trainingsdauer wird aus den Uhrzeiten der Sätze geschätzt.</p>
    <button class="btn" data-a="doImport">${imp.workouts.length} Trainings importieren</button>
    ${openFlags(m) ? `<p class="muted small" style="text-align:center;margin-top:8px">${openFlags(m)} ungeprüfte Fälle werden so übernommen, wie sie in der Datei stehen.</p>` : ''}`);
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
    ...(e.note?.trim() ? { note: e.note.trim() } : {}),
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
  onbTarget: el => { ui.onb.d.weeklyTarget = Math.min(7, Math.max(1, ui.onb.d.weeklyTarget + +el.dataset.v)); render(); },
  onbBack: () => { ui.onb.step--; render(); },
  onbNext: () => {
    const o = ui.onb;
    if (o.step < 4) { o.step++; render(); return; }
    const d = o.d;
    S.profile = { name: d.name.trim(), sex: d.sex, level: d.level, goal: d.goal, weeklyTarget: d.weeklyTarget, bwInterval: 14, createdAt: Date.now(), levelSetAt: Date.now() };
    S.bodyweights.push({ t: Date.now(), kg: Math.round(num(d.kg) * 10) / 10 });
    saveState(); render(); confetti();
  },
  // Profil
  setProfile: el => { const f = el.dataset.f; S.profile[f] = ['weeklyTarget', 'bwInterval'].includes(f) ? +el.dataset.v : el.dataset.v; if (f === 'level') S.profile.levelSetAt = Date.now(); saveState(); render(); },
  setLevel: el => { S.profile.level = el.dataset.v; S.profile.levelSetAt = Date.now(); saveState(); toast('Einstufung gespeichert'); closeModal(); },
  delBw: el => { if (!confirm('Eintrag löschen?')) return; S.bodyweights = S.bodyweights.filter(b => b.t !== +el.dataset.v); saveState(); render(); },
  saveBw: () => {
    const today = startOfDay(Date.now());
    S.bodyweights = S.bodyweights.filter(b => startOfDay(b.t) !== today);
    const kg = Math.round(num(ui.modal.kg) * 10) / 10;
    if (!(kg >= 30 && kg <= 300)) { toast('Bitte ein gültiges Gewicht eingeben'); return; }
    S.bodyweights.push({ t: Date.now(), kg });
    S.bodyweights.sort((a, b) => a.t - b.t);
    saveState(); toast('Gewicht gespeichert'); closeModal();
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
      const inp = document.querySelector(`[data-in=set][data-e="${el.dataset.e}"][data-s="${el.dataset.s}"][data-f=reps]`);
      if (inp) inp.focus();
      toast('Erst die Wiederholungen eintragen');
      return;
    }
    if (!s.done && s.kg === '') s.kg = '0';
    s.done = !s.done;
    if (s.done) ui.restStart = Date.now();
    saveState(); const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  clearMode: el => { delete S.active.entries[+el.dataset.v].mode; saveState(); render(); },
  info1rm: () => { if (ui.modal) ui.stack.push(ui.modal); ui.modal = { type: 'info1rm' }; render(); },
  doImport: () => {
    const imp = ui.modal.imp;
    applyImport(imp, ui.modal.choices || {});
    ui.modal = null; ui.tab = 'daten'; render(); window.scrollTo(0, 0);
    toast(`${imp.workouts.length} Trainings importiert`);
    confetti();
  },
  flagChoice: el => { const c = (ui.modal.choices ||= {}); c[el.dataset.f] = c[el.dataset.f] === el.dataset.v ? undefined : el.dataset.v; render(); },
  stopRest: () => { ui.restStart = null; render(); },
  finish: () => finishWorkout(),
  cancelWorkout: () => { if (!confirm('Training wirklich verwerfen?')) return; S.active = null; ui.restStart = null; saveState(); render(); },
  exDetail: el => { openModal({ type: 'exDetail', id: el.dataset.v }); },
  toggleAllEx: () => { ui.showAllEx = !ui.showAllEx; render(); },
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
  if (k === 'onb') { ui.onb.d[t.dataset.f] = t.value; if (t.dataset.f === 'kg') { const b = document.querySelector('[data-a=onbNext]'); if (b) b.disabled = !(ui.onb.d.goal && num(t.value) >= 30); } }
  else if (k === 'bwKg') ui.modal.kg = t.value;
  else if (k === 'profile') { S.profile[t.dataset.f] = t.value; saveState(); }
  else if (k === 'set') { S.active.entries[+t.dataset.e].sets[+t.dataset.s][t.dataset.f] = t.value; saveState(); }
  else if (k === 'entryNote') { S.active.entries[+t.dataset.e].note = t.value; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; saveState(); }
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
  if (t.dataset.in === 'importCsv' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => {
      try { openModal({ type: 'importPreview', imp: buildImport(String(r.result)) }); }
      catch (err) { toast(err.message || 'Datei konnte nicht gelesen werden'); }
      t.value = '';
    };
    r.readAsText(t.files[0], 'utf-8');
    return;
  }
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
