/* Import von Trainingsdaten aus anderen Apps (CSV).
   Unterstützt das Export-Format von FitnessOnline:
   Datum,Übung,Satz,Gewicht (kg),Wdh.,Uhrzeit,Notiz */

/* Eigene Übungen, die nicht im Katalog sind: [Name, Equipment, primär, sekundär, Typ, Körpergewicht?] */
const IMPORT_CUSTOM = {
  schraeg_brustpresse: ['Schrägbank-Brustpresse (Maschine)', 'Maschine', ['brust'], ['schultern', 'trizeps'], 'c'],
  hyperext_gesaess: ['Hyperextension (Gesäß-Fokus)', 'Körpergewicht', ['gesaess'], ['beinbeuger', 'ruecken_u'], 'i', true],
  sumo_kniebeuge: ['Sumo-Kniebeuge (Langhantel)', 'Langhantel', ['quad', 'gesaess', 'adduktoren'], ['beinbeuger'], 'c'],
  breite_kniebeuge: ['Breite Kniebeuge (Langhantel)', 'Langhantel', ['quad', 'gesaess', 'adduktoren'], ['beinbeuger'], 'c'],
  dips_maschine: ['Dips an der Maschine', 'Maschine', ['trizeps'], ['brust', 'schultern'], 'c'],
  fliegende_einarmig: ['Einarmige Fliegende (Maschine)', 'Maschine', ['brust'], ['schultern'], 'i'],
  beinpresse_sitzend: ['Beinpresse sitzend', 'Maschine', ['quad', 'gesaess'], ['beinbeuger'], 'c'],
  kofferuebung: ['Kofferübung (Klappmesser im Sitzen)', 'Körpergewicht', ['bauch'], [], 'i', true],
  fahrrad_crunch: ['Fahrrad-Crunch', 'Körpergewicht', ['bauch'], [], 'i', true],
  klappmesser_ball: ['Klappmesser mit Gymnastikball', 'Körpergewicht', ['bauch'], ['schultern'], 'i', true],
  beinschere: ['Beinschere', 'Körpergewicht', ['bauch'], [], 'i', true],
  schulter_warmup: ['Schulteraufwärmen mit Band', 'Band', ['schultern'], [], 'i'],
  seitbeugen_kh: ['Seitbeugen (Kurzhantel)', 'Kurzhantel', ['bauch'], [], 'i'],
  adduktion_kabel: ['Adduktion am Kabel (stehend)', 'Kabelzug', ['adduktoren'], [], 'i'],
};

/* Bekannte Namen → Katalog-ID oder eigene Übung ('imp:…'), 'cardio' = nur Zeit */
const IMPORT_MAP = {
  'beinpresse mit engem stand': 'beinpresse',
  'abduktoren maschine': 'abduktoren_maschine',
  'rumänisches kreuzheben': 'rumaenisches_kh',
  'latzug mit breitem obergriff': 'latzug',
  'latzug mit weitem parallelgriff': 'latzug',
  'rudern sitzend kabelzug mit engem griff': 'kabelrudern',
  'vorgebeugtes langhantelrudern obergriff': 'rudern_lh',
  'bulgarische kniebeugen': 'bulgarian_split',
  'hammer strength schrägbankbrustpresse': 'imp:schraeg_brustpresse',
  'brustpresse maschine schrägbank': 'imp:schraeg_brustpresse',
  'butterfly am gerät': 'butterfly',
  'adduktoren maschine': 'adduktoren_maschine',
  'hyperextension gesäß': 'imp:hyperext_gesaess',
  'glute bridge an einer maschine': 'hip_thrust_maschine',
  'langhantel-sumo-kniebeugen': 'imp:sumo_kniebeuge',
  'breite kniebeugen mit langhantel': 'imp:breite_kniebeuge',
  'kreuzheben': 'kreuzheben',
  'hyperextensionen (rückenstrecker) am gerät': 'rueckenstrecker',
  'maschinen-trizepsdips': 'imp:dips_maschine',
  'einbeiniges beinheben nach hinten am kabelzug': 'kabel_kickback',
  'abwechselnde bizepscurls eingedreht stehend': 'curls_kh',
  'beinbeuger maschine liegend': 'beinbeuger_liegend',
  'bauchpresse am gerät': 'bauchmaschine',
  'goblet-kniebeuge': 'goblet_squat',
  'trizepsdrücken am kabelzug (push downs) mit v-griff': 'trizepsdruecken_kabel',
  'trizepsdrücken an der maschine': 'trizeps_maschine',
  'fliegende einarmig an der maschine': 'imp:fliegende_einarmig',
  'schulterdrücken maschine': 'schulterpresse',
  'step-up auf box mit kurzhanteln': 'step_ups',
  'beinpresse sitzend': 'imp:beinpresse_sitzend',
  'die kofferübung': 'imp:kofferuebung',
  'fahrrad-crunch': 'imp:fahrrad_crunch',
  'klappmesser mit gymnastikball': 'imp:klappmesser_ball',
  'planke': 'plank',
  'unterarmstütz': 'plank',
  'russische drehung mit erhobenen füßen': 'russian_twist',
  'alternierende crunches': 'crunches',
  'schulteraufwärmen mit trainingsband': 'imp:schulter_warmup',
  'pendelübung zum schulteraufwärmen mit trainingsband': 'imp:schulter_warmup',
  'kniebeugen mit langhantel (sissy squats)': 'sissy_squat',
  'beinschere': 'imp:beinschere',
  'beinheben am gerät': 'beinheben_haengend',
  'beinheben im liegen': 'beinheben_liegend',
  'sit-ups auf der schrägbank': 'sit_ups',
  'seitbeugen mit kurzhantel': 'imp:seitbeugen_kh',
  'pull ups am gravitron-gerät stehend': 'klimmzug_maschine',
  'hüftadduktion stehend am kabelzug': 'imp:adduktion_kabel',
  'crosstrainer': 'cardio',
  'stairmaster': 'cardio',
  'laufband': 'cardio',
  'fahrradergometer': 'cardio',
  'rudergerät': 'cardio',
};

/* Für unbekannte Namen: Muskelgruppe anhand von Stichworten raten */
const GUESS_KEYWORDS = [
  [/brust|bankdr|butterfly|fliegende|liegest/, 'brust'],
  [/schulter|seitheb|frontheb|military|arnold/, 'schultern'],
  [/bizeps|curl/, 'bizeps'],
  [/trizeps|dips|push ?down|french/, 'trizeps'],
  [/latzug|klimmz|pull ?up|lat/, 'lat'],
  [/rudern|row/, 'lat'],
  [/shrug|nacken/, 'trapez'],
  [/rücken|hyperext/, 'ruecken_u'],
  [/gesäß|glute|hip|abdukt|kickback/, 'gesaess'],
  [/addukt/, 'adduktoren'],
  [/beinbeuger|leg curl/, 'beinbeuger'],
  [/wade|calf/, 'waden'],
  [/kniebeug|squat|beinpresse|beinstreck|ausfall|lunge|step/, 'quad'],
  [/bauch|crunch|sit-?up|plank|planke|stütz|beinheb|twist|drehung/, 'bauch'],
  [/crosstrainer|stairmaster|laufband|ergometer|cardio|rad|lauf/, 'cardio'],
];

const VARIANTS = [
  [/liegend/, { label: 'liegend' }],
  [/smith|multi ?presse/, { label: 'Multipresse', equip: 'Multipresse' }],
  [/kurzhantel|hanteln?\b/, { label: 'Kurzhantel', equip: 'Kurzhantel' }],
  [/langhantel/, { label: 'Langhantel', equip: 'Langhantel' }],
  [/maschine|gerät|machine/, { label: 'Maschine', equip: 'Maschine' }],
];
function variantOf(note) {
  const n = String(note || '').toLowerCase();
  if (!n || /^dauer/.test(n)) return null;
  const hit = VARIANTS.find(([re]) => re.test(n));
  return hit ? hit[1] : null;
}

/* Auswahl für die manuelle Zuordnung verdächtiger Einheiten */
const VARIANT_CHOICES = [
  { label: 'Kurzhantel', equip: 'Kurzhantel' },
  { label: 'Langhantel', equip: 'Langhantel' },
  { label: 'Maschine', equip: 'Maschine' },
  { label: 'Multipresse', equip: 'Multipresse' },
  { label: 'Kabelzug', equip: 'Kabelzug' },
  { label: 'liegend' },
  { label: 'anderes Gerät' },
  { label: 'ohne Gewicht', equip: 'Körpergewicht' },
];

/* Variante einer Übung anlegen (oder vorhandene wiederverwenden) */
function makeVariant(exId, label, equip, customs) {
  const baseId = exId.split('__')[0];
  const vid = baseId + '__' + slug(label);
  if (!customs[vid]) {
    const base = customs[baseId] || exById(baseId);
    const e = equip || base.equip;
    customs[vid] = { ...base, id: vid, name: `${base.name.replace(/\s*\([^)]*\)$/, '')} (${label})`, equip: e, bw: e === 'Körpergewicht' ? true : base.bw, inc: EQUIP_INC[e] ?? base.inc, custom: true };
  }
  return vid;
}

/* Verdächtige Fälle: das Gewicht bricht plötzlich stark ein (z. B. Langhantel → Kurzhantel ohne Notiz)
   oder springt nur kurz nach oben (z. B. anderes Gerät für 1–3 Einheiten).
   Aufeinanderfolgende Einheiten auf dem neuen Niveau werden zu einem Block zusammengefasst. */
function detectFlags(workouts, exLookup) {
  const byEx = {};
  for (const w of workouts) for (const e of w.entries) {
    (byEx[e.exId] ||= []).push({ wid: w.id, t: w.t, top: Math.max(...e.sets.map(x => x.kg || 0)), sets: e.sets });
  }
  const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const flags = [];
  for (const [exId, list] of Object.entries(byEx)) {
    if (exLookup(exId).bw || list.length < 3) continue;
    let i = 1;
    while (i < list.length) {
      const base = median(list.slice(Math.max(0, i - 3), i).map(x => x.top));
      const cur = list[i].top;
      const ratio = base > 0 ? cur / base : (cur > 0 ? Infinity : 1);
      if ((ratio < 0.6 || ratio > 1.7) && Math.abs(cur - base) >= 5) {
        const block = [list[i]];
        let j = i + 1;
        while (j < list.length && Math.abs(list[j].top - cur) < Math.abs(list[j].top - base)) { block.push(list[j]); j++; }
        const tops = block.map(b => b.top);
        // Dauerhafte Steigerungen sind Fortschritt – verdächtig sind Einbrüche und kurze Ausreißer nach oben
        if (cur > base && block.length > 3) { i = j; continue; }
        flags.push({ id: exId + '@' + list[i].wid, exId, keys: block.map(b => b.wid), baseKg: base, minKg: Math.min(...tops), maxKg: Math.max(...tops), from: block[0].t, to: block[block.length - 1].t, sample: block[0].sets, down: cur < base });
        i = j;
      } else i++;
    }
  }
  return flags.sort((a, b) => a.from - b.from);
}

function normName(s) { return String(s || '').trim().toLowerCase().replace(/\s+/g, ' '); }

function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0];
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(x => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(x => x !== '')) rows.push(row);
  return rows;
}

/* Übungsnamen auflösen: feste Zuordnung → exakter Katalogname → Stichwort-Raten */
function resolveImportExercise(name) {
  const n = normName(name);
  if (IMPORT_MAP[n]) return IMPORT_MAP[n];
  const exact = EXERCISES.find(e => normName(e.name) === n);
  if (exact) return exact.id;
  const hit = GUESS_KEYWORDS.find(([re]) => re.test(n));
  if (hit && hit[1] === 'cardio') return 'cardio';
  return 'new:' + (hit ? hit[1] : 'bauch');
}

function slug(s) {
  return normName(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
}

/* Liest die CSV und baut daraus Trainings – ohne etwas zu speichern */
function buildImport(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error('Die Datei ist leer.');
  const head = rows[0].map(normName);
  const col = (...names) => head.findIndex(h => names.some(n => h.startsWith(n)));
  const ci = { date: col('datum', 'date'), ex: col('übung', 'uebung', 'exercise'), kg: col('gewicht', 'weight'), reps: col('wdh', 'wiederholung', 'reps'), time: col('uhrzeit', 'zeit', 'time'), note: col('notiz', 'note') };
  if (ci.date < 0 || ci.ex < 0 || ci.reps < 0) throw new Error('Unbekanntes Format. Erwartet werden Spalten wie Datum, Übung, Gewicht, Wdh.');

  const customs = {};      // id → Übung
  const unmapped = new Set();
  const days = {};          // Datum → {sets, times, notes, cardio}
  let skipped = 0;

  for (const r of rows.slice(1)) {
    const dm = String(r[ci.date] || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/) || String(r[ci.date] || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dm) { skipped++; continue; }
    const [d, m, y] = dm[1].length === 4 ? [+dm[3], +dm[2], +dm[1]] : [+dm[1], +dm[2], +dm[3] < 100 ? 2000 + +dm[3] : +dm[3]];
    const key = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const name = String(r[ci.ex] || '').trim();
    if (!name) { skipped++; continue; }
    const note = ci.note >= 0 ? String(r[ci.note] || '').trim() : '';
    const tm = ci.time >= 0 ? String(r[ci.time] || '').match(/(\d{1,2}):(\d{2})/) : null;
    const minutesOfDay = tm ? +tm[1] * 60 + +tm[2] : null;
    const day = (days[key] ||= { y, m, d, entries: {}, order: [], times: [], notes: [], cardio: [] });
    if (minutesOfDay !== null) day.times.push(minutesOfDay);

    let id = resolveImportExercise(name);
    const reps = Math.round(num(r[ci.reps]));
    const kg = ci.kg >= 0 ? num(r[ci.kg]) : NaN;
    const dur = note.match(/dauer\s*(\d+)\s*(min|s)/i);

    if (id === 'cardio') {
      day.cardio.push(`${name}${dur ? ' ' + dur[1] + ' ' + dur[2] : ''}`);
      continue;
    }
    if (!(reps > 0)) {
      // Zeitbasierte Sätze (z. B. Planke 30 s) als Notiz behalten
      if (dur) day.notes.push(`${name}: ${dur[1]} ${dur[2]}`); else skipped++;
      continue;
    }
    if (id.startsWith('imp:')) {
      const k = id.slice(4), [n, equip, pri, sec, type, bw] = IMPORT_CUSTOM[k];
      id = 'imp_' + k;
      customs[id] ||= { id, name: n, equip, primary: pri, secondary: sec, type, bw: !!bw, inc: EQUIP_INC[equip] ?? 2.5, custom: true };
    } else if (id.startsWith('new:')) {
      const muscle = id.slice(4);
      unmapped.add(name);
      id = 'imp_' + slug(name);
      customs[id] ||= { id, name, equip: isNaN(kg) ? 'Körpergewicht' : 'Maschine', primary: [muscle], secondary: [], type: 'i', bw: isNaN(kg), inc: 2.5, custom: true };
    }
    if (!day.entries[id]) { day.entries[id] = []; day.order.push(id); }
    day.entries[id].push({ kg: isNaN(kg) ? 0 : kg, reps, note });
  }

  const exLookup = id => customs[id] || exById(id);
  // Varianten (z. B. „Liegend“, „Kurzhantel“, „Smith“) als eigene Übung führen,
  // sonst sieht ein Gerätewechsel wie Kraftverlust aus.
  let variants = 0;
  for (const day of Object.values(days)) {
    day.entryNotes = {};
    day.order = day.order.map(id => {
      const sets = day.entries[id];
      const v = sets.map(x => variantOf(x.note)).find(Boolean);
      const note = [...new Set(sets.map(x => x.note).filter(n => n && !/^dauer/i.test(n)))].join(' · ');
      for (const x of sets) delete x.note;
      let target = id;
      if (v && !(v.equip && v.equip === exLookup(id).equip)) {
        const before = Object.keys(customs).length;
        target = makeVariant(id, v.label, v.equip, customs);
        if (Object.keys(customs).length > before) variants++;
        day.entries[target] = (day.entries[target] || []).concat(sets);
        delete day.entries[id];
      }
      if (note) day.entryNotes[target] = [day.entryNotes[target], note].filter(Boolean).join(' · ');
      return target;
    }).filter((id, i, arr) => arr.indexOf(id) === i);
  }

  const workouts = [];
  for (const [key, day] of Object.entries(days)) {
    if (!day.order.length && !day.cardio.length) continue;
    const times = day.times.sort((a, b) => a - b);
    const start = times.length ? times[0] : 18 * 60;
    const span = times.length ? times[times.length - 1] - times[0] : 0;
    const t = new Date(day.y, day.m - 1, day.d, Math.floor(start / 60), start % 60).getTime();
    const entries = day.order.map(id => ({ exId: id, sets: day.entries[id], ...(day.entryNotes[id] ? { note: day.entryNotes[id] } : {}) }));
    // Name aus den trainierten Muskeln ableiten
    let lower = 0, upper = 0, core = 0;
    for (const e of entries) for (const mm of exLookup(e.exId).primary) {
      if (['quad', 'gesaess', 'beinbeuger', 'waden', 'adduktoren'].includes(mm)) lower += e.sets.length;
      else if (mm === 'bauch') core += e.sets.length;
      else upper += e.sets.length;
    }
    const total = lower + upper + core;
    const name = !total ? 'Cardio' : lower / total > 0.65 ? 'Beine & Po' : upper / total > 0.65 ? 'Oberkörper' : core / total > 0.65 ? 'Bauch' : 'Ganzkörper';
    const notes = [...day.cardio.map(c => 'Cardio: ' + c), ...new Set(day.notes)];
    workouts.push({ id: 'fo_' + key, t, name, durationMin: Math.min(180, Math.max(15, span + 5)), entries, notes, source: 'import' });
  }
  workouts.sort((a, b) => a.t - b.t);
  const strength = workouts.filter(w => w.entries.length);
  return {
    workouts: strength,
    customs: Object.values(customs),
    unmapped: [...unmapped],
    sets: strength.reduce((a, w) => a + workoutSetCount(w), 0),
    exercises: new Set(strength.flatMap(w => w.entries.map(e => e.exId))).size,
    from: strength[0]?.t, to: strength[strength.length - 1]?.t,
    skipped,
    variants,
    flags: detectFlags(strength, exLookup),
  };
}

/* Übernimmt den Import; ein erneuter Import ersetzt die zuvor importierten Trainings */
function applyImport(imp, choices = {}) {
  imp = JSON.parse(JSON.stringify(imp));
  const customs = Object.fromEntries(imp.customs.map(c => [c.id, c]));
  for (const f of imp.flags) {
    const c = choices[f.id];
    if (!c || c === 'ok') continue;
    const keys = new Set(f.keys);
    for (const w of imp.workouts) {
      if (!keys.has(w.id)) continue;
      const i = w.entries.findIndex(e => e.exId === f.exId);
      if (i < 0) continue;
      if (c === 'drop') { w.entries.splice(i, 1); continue; }
      const vc = VARIANT_CHOICES.find(v => v.label === c);
      const vid = makeVariant(f.exId, c, vc?.equip, customs);
      const other = w.entries.find(e => e.exId === vid);
      if (other) { other.sets.push(...w.entries[i].sets); w.entries.splice(i, 1); }
      else w.entries[i].exId = vid;
    }
  }
  imp.workouts = imp.workouts.filter(w => w.entries.length);
  imp.customs = Object.values(customs);
  const ids = new Set(imp.workouts.map(w => w.id));
  S.workouts = S.workouts.filter(w => !ids.has(w.id)).concat(imp.workouts).sort((a, b) => a.t - b.t);
  const have = new Set(S.customExercises.map(e => e.id));
  for (const c of imp.customs) if (!have.has(c.id)) S.customExercises.push(c);
  saveState();
}
