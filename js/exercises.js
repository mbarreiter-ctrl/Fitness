/* Deutscher Übungskatalog.
   Format: [id, Name, Equipment, primäre Muskeln, sekundäre Muskeln, Typ (c = Grundübung, i = Isolation), Körpergewicht?] */

const MUSCLES = {
  brust:      { name: 'Brust',          view: 'front' },
  schultern:  { name: 'Schultern',      view: 'both'  },
  bizeps:     { name: 'Bizeps',         view: 'front' },
  trizeps:    { name: 'Trizeps',        view: 'back'  },
  unterarme:  { name: 'Unterarme',      view: 'both'  },
  bauch:      { name: 'Bauch',          view: 'front' },
  trapez:     { name: 'Nacken/Trapez',  view: 'back'  },
  lat:        { name: 'Latissimus',     view: 'back'  },
  ruecken_u:  { name: 'Unterer Rücken', view: 'back'  },
  gesaess:    { name: 'Gesäß',          view: 'back'  },
  quad:       { name: 'Oberschenkel vorne', view: 'front' },
  beinbeuger: { name: 'Beinbeuger',     view: 'back'  },
  waden:      { name: 'Waden',          view: 'both'  },
  adduktoren: { name: 'Adduktoren',     view: 'front' },
};

const EQUIP_INC = {
  'Langhantel': 2.5, 'Kurzhantel': 2, 'Maschine': 2.5, 'Kabelzug': 2.5,
  'SZ-Stange': 2.5, 'Kettlebell': 4, 'Körpergewicht': 2.5, 'Multipresse': 2.5, 'Band': 0,
};

const RAW_EXERCISES = [
  // Brust
  ['bankdruecken', 'Bankdrücken', 'Langhantel', ['brust'], ['trizeps', 'schultern'], 'c'],
  ['schraegbank_lh', 'Schrägbankdrücken', 'Langhantel', ['brust'], ['schultern', 'trizeps'], 'c'],
  ['negativbank_lh', 'Negativ-Bankdrücken', 'Langhantel', ['brust'], ['trizeps'], 'c'],
  ['bankdruecken_kh', 'Kurzhantel-Bankdrücken', 'Kurzhantel', ['brust'], ['trizeps', 'schultern'], 'c'],
  ['schraegbank_kh', 'Kurzhantel-Schrägbankdrücken', 'Kurzhantel', ['brust'], ['schultern', 'trizeps'], 'c'],
  ['fliegende_kh', 'Kurzhantel-Fliegende', 'Kurzhantel', ['brust'], ['schultern'], 'i'],
  ['butterfly', 'Butterfly', 'Maschine', ['brust'], [], 'i'],
  ['brustpresse', 'Brustpresse', 'Maschine', ['brust'], ['trizeps', 'schultern'], 'c'],
  ['kabel_crossover', 'Kabel-Crossover', 'Kabelzug', ['brust'], ['schultern'], 'i'],
  ['kabel_fliegende_tief', 'Kabelfliegende von unten', 'Kabelzug', ['brust'], ['schultern'], 'i'],
  ['liegestuetz', 'Liegestütze', 'Körpergewicht', ['brust'], ['trizeps', 'schultern', 'bauch'], 'c', true],
  ['dips_brust', 'Dips (Brust)', 'Körpergewicht', ['brust', 'trizeps'], ['schultern'], 'c', true],
  ['bankdruecken_multi', 'Bankdrücken an der Multipresse', 'Multipresse', ['brust'], ['trizeps', 'schultern'], 'c'],
  ['ueberzuege', 'Überzüge', 'Kurzhantel', ['brust', 'lat'], ['trizeps'], 'i'],

  // Rücken
  ['kreuzheben', 'Kreuzheben', 'Langhantel', ['ruecken_u', 'gesaess', 'beinbeuger'], ['trapez', 'quad', 'unterarme', 'lat'], 'c'],
  ['rumaenisches_kh', 'Rumänisches Kreuzheben', 'Langhantel', ['beinbeuger', 'gesaess'], ['ruecken_u', 'unterarme'], 'c'],
  ['sumo_kreuzheben', 'Sumo-Kreuzheben', 'Langhantel', ['gesaess', 'quad', 'adduktoren'], ['ruecken_u', 'beinbeuger', 'trapez'], 'c'],
  ['rudern_lh', 'Langhantelrudern', 'Langhantel', ['lat', 'trapez'], ['bizeps', 'schultern', 'ruecken_u'], 'c'],
  ['rudern_kh', 'Einarmiges Kurzhantelrudern', 'Kurzhantel', ['lat'], ['trapez', 'bizeps', 'schultern'], 'c'],
  ['tbar_rudern', 'T-Bar-Rudern', 'Langhantel', ['lat', 'trapez'], ['bizeps', 'schultern'], 'c'],
  ['kabelrudern', 'Rudern am Kabel (sitzend)', 'Kabelzug', ['lat', 'trapez'], ['bizeps', 'schultern'], 'c'],
  ['rudermaschine', 'Rudern an der Maschine', 'Maschine', ['lat', 'trapez'], ['bizeps', 'schultern'], 'c'],
  ['klimmzuege', 'Klimmzüge', 'Körpergewicht', ['lat'], ['bizeps', 'trapez', 'unterarme'], 'c', true],
  ['chinups', 'Klimmzüge im Untergriff', 'Körpergewicht', ['lat', 'bizeps'], ['trapez', 'unterarme'], 'c', true],
  ['latzug', 'Latzug', 'Kabelzug', ['lat'], ['bizeps', 'trapez'], 'c'],
  ['latzug_eng', 'Latzug eng', 'Kabelzug', ['lat'], ['bizeps', 'trapez'], 'c'],
  ['latzug_gestreckt', 'Latziehen mit gestreckten Armen', 'Kabelzug', ['lat'], ['trizeps'], 'i'],
  ['klimmzug_maschine', 'Klimmzugmaschine (unterstützt)', 'Maschine', ['lat'], ['bizeps', 'trapez'], 'c'],
  ['rueckenstrecker', 'Rückenstrecker (Hyperextensions)', 'Körpergewicht', ['ruecken_u'], ['gesaess', 'beinbeuger'], 'i', true],
  ['good_morning', 'Good Morning', 'Langhantel', ['beinbeuger', 'ruecken_u'], ['gesaess'], 'c'],
  ['shrugs_lh', 'Shrugs (Langhantel)', 'Langhantel', ['trapez'], ['unterarme'], 'i'],
  ['shrugs_kh', 'Shrugs (Kurzhantel)', 'Kurzhantel', ['trapez'], ['unterarme'], 'i'],
  ['inverted_row', 'Rudern am Körper (Inverted Row)', 'Körpergewicht', ['lat', 'trapez'], ['bizeps'], 'c', true],
  ['meadows_rudern', 'Meadows-Rudern', 'Langhantel', ['lat'], ['trapez', 'bizeps'], 'c'],

  // Schultern
  ['schulterdruecken', 'Schulterdrücken (stehend)', 'Langhantel', ['schultern'], ['trizeps', 'trapez', 'bauch'], 'c'],
  ['schulterdruecken_kh', 'Kurzhantel-Schulterdrücken', 'Kurzhantel', ['schultern'], ['trizeps'], 'c'],
  ['schulterpresse', 'Schulterpresse', 'Maschine', ['schultern'], ['trizeps'], 'c'],
  ['arnold_press', 'Arnold Press', 'Kurzhantel', ['schultern'], ['trizeps'], 'c'],
  ['seitheben', 'Seitheben', 'Kurzhantel', ['schultern'], ['trapez'], 'i'],
  ['seitheben_kabel', 'Seitheben am Kabel', 'Kabelzug', ['schultern'], ['trapez'], 'i'],
  ['seitheben_maschine', 'Seitheben an der Maschine', 'Maschine', ['schultern'], [], 'i'],
  ['frontheben', 'Frontheben', 'Kurzhantel', ['schultern'], ['brust'], 'i'],
  ['reverse_butterfly', 'Reverse Butterfly', 'Maschine', ['schultern'], ['trapez'], 'i'],
  ['vorgebeugtes_seitheben', 'Vorgebeugtes Seitheben', 'Kurzhantel', ['schultern'], ['trapez'], 'i'],
  ['face_pulls', 'Face Pulls', 'Kabelzug', ['schultern', 'trapez'], [], 'i'],
  ['aufrechtes_rudern', 'Aufrechtes Rudern', 'SZ-Stange', ['schultern', 'trapez'], ['bizeps'], 'c'],
  ['pike_pushup', 'Pike-Liegestütze', 'Körpergewicht', ['schultern'], ['trizeps'], 'c', true],
  ['handstand_pushup', 'Handstand-Liegestütze', 'Körpergewicht', ['schultern', 'trizeps'], ['trapez'], 'c', true],
  ['landmine_press', 'Landmine Press', 'Langhantel', ['schultern'], ['brust', 'trizeps'], 'c'],

  // Bizeps
  ['curls_lh', 'Langhantel-Curls', 'Langhantel', ['bizeps'], ['unterarme'], 'i'],
  ['curls_sz', 'SZ-Curls', 'SZ-Stange', ['bizeps'], ['unterarme'], 'i'],
  ['curls_kh', 'Kurzhantel-Curls', 'Kurzhantel', ['bizeps'], ['unterarme'], 'i'],
  ['hammercurls', 'Hammer-Curls', 'Kurzhantel', ['bizeps', 'unterarme'], [], 'i'],
  ['konzentrationscurls', 'Konzentrationscurls', 'Kurzhantel', ['bizeps'], [], 'i'],
  ['schraegbankcurls', 'Schrägbank-Curls', 'Kurzhantel', ['bizeps'], [], 'i'],
  ['scottcurls', 'Scott-Curls', 'SZ-Stange', ['bizeps'], [], 'i'],
  ['bizeps_maschine', 'Bizepsmaschine', 'Maschine', ['bizeps'], [], 'i'],
  ['kabelcurls', 'Kabel-Curls', 'Kabelzug', ['bizeps'], ['unterarme'], 'i'],
  ['spider_curls', 'Spider-Curls', 'Kurzhantel', ['bizeps'], [], 'i'],

  // Trizeps
  ['trizepsdruecken_kabel', 'Trizepsdrücken am Kabel', 'Kabelzug', ['trizeps'], [], 'i'],
  ['trizeps_seil', 'Trizepsdrücken mit Seil', 'Kabelzug', ['trizeps'], [], 'i'],
  ['ueberkopf_trizeps_kabel', 'Überkopf-Trizepsstrecken am Kabel', 'Kabelzug', ['trizeps'], [], 'i'],
  ['french_press', 'French Press (SZ)', 'SZ-Stange', ['trizeps'], [], 'i'],
  ['ueberkopf_trizeps_kh', 'Überkopf-Trizepsstrecken (Kurzhantel)', 'Kurzhantel', ['trizeps'], [], 'i'],
  ['enges_bankdruecken', 'Enges Bankdrücken', 'Langhantel', ['trizeps', 'brust'], ['schultern'], 'c'],
  ['dips', 'Dips', 'Körpergewicht', ['trizeps'], ['brust', 'schultern'], 'c', true],
  ['bankdips', 'Bank-Dips', 'Körpergewicht', ['trizeps'], ['schultern'], 'i', true],
  ['kickbacks', 'Trizeps-Kickbacks', 'Kurzhantel', ['trizeps'], [], 'i'],
  ['trizeps_maschine', 'Trizepsmaschine', 'Maschine', ['trizeps'], [], 'i'],
  ['diamant_liegestuetz', 'Diamant-Liegestütze', 'Körpergewicht', ['trizeps'], ['brust', 'schultern'], 'c', true],

  // Unterarme
  ['handgelenkcurls', 'Handgelenk-Curls', 'Kurzhantel', ['unterarme'], [], 'i'],
  ['reverse_curls', 'Reverse Curls', 'SZ-Stange', ['unterarme'], ['bizeps'], 'i'],
  ['farmers_walk', 'Farmer’s Walk', 'Kurzhantel', ['unterarme', 'trapez'], ['bauch', 'gesaess'], 'c'],
  ['dead_hang', 'Hängen an der Stange', 'Körpergewicht', ['unterarme'], ['lat'], 'i', true],

  // Beine
  ['kniebeuge', 'Kniebeuge', 'Langhantel', ['quad', 'gesaess'], ['adduktoren', 'ruecken_u', 'beinbeuger'], 'c'],
  ['frontkniebeuge', 'Frontkniebeuge', 'Langhantel', ['quad'], ['gesaess', 'bauch', 'ruecken_u'], 'c'],
  ['goblet_squat', 'Goblet Squat', 'Kurzhantel', ['quad', 'gesaess'], ['adduktoren', 'bauch'], 'c'],
  ['kniebeuge_multi', 'Kniebeuge an der Multipresse', 'Multipresse', ['quad', 'gesaess'], ['adduktoren'], 'c'],
  ['hackenschmidt', 'Hackenschmidt-Kniebeuge', 'Maschine', ['quad'], ['gesaess'], 'c'],
  ['beinpresse', 'Beinpresse', 'Maschine', ['quad', 'gesaess'], ['adduktoren', 'beinbeuger'], 'c'],
  ['beinstrecker', 'Beinstrecker', 'Maschine', ['quad'], [], 'i'],
  ['beinbeuger_liegend', 'Beinbeuger liegend', 'Maschine', ['beinbeuger'], ['waden'], 'i'],
  ['beinbeuger_sitzend', 'Beinbeuger sitzend', 'Maschine', ['beinbeuger'], [], 'i'],
  ['ausfallschritte', 'Ausfallschritte', 'Kurzhantel', ['quad', 'gesaess'], ['adduktoren', 'beinbeuger'], 'c'],
  ['ausfallschritte_lh', 'Ausfallschritte (Langhantel)', 'Langhantel', ['quad', 'gesaess'], ['adduktoren', 'beinbeuger'], 'c'],
  ['bulgarian_split', 'Bulgarische Kniebeuge', 'Kurzhantel', ['quad', 'gesaess'], ['adduktoren'], 'c'],
  ['step_ups', 'Step-ups', 'Kurzhantel', ['quad', 'gesaess'], ['beinbeuger'], 'c'],
  ['hip_thrust', 'Hip Thrust', 'Langhantel', ['gesaess'], ['beinbeuger', 'quad'], 'c'],
  ['glute_bridge', 'Glute Bridge', 'Körpergewicht', ['gesaess'], ['beinbeuger'], 'i', true],
  ['hip_thrust_maschine', 'Hip-Thrust-Maschine', 'Maschine', ['gesaess'], ['beinbeuger'], 'i'],
  ['abduktoren_maschine', 'Abduktorenmaschine', 'Maschine', ['gesaess'], [], 'i'],
  ['adduktoren_maschine', 'Adduktorenmaschine', 'Maschine', ['adduktoren'], [], 'i'],
  ['kabel_kickback', 'Gesäß-Kickback am Kabel', 'Kabelzug', ['gesaess'], ['beinbeuger'], 'i'],
  ['wadenheben_stehend', 'Wadenheben stehend', 'Maschine', ['waden'], [], 'i'],
  ['wadenheben_sitzend', 'Wadenheben sitzend', 'Maschine', ['waden'], [], 'i'],
  ['wadenheben_beinpresse', 'Wadenheben an der Beinpresse', 'Maschine', ['waden'], [], 'i'],
  ['wadenheben_kh', 'Einbeiniges Wadenheben', 'Kurzhantel', ['waden'], [], 'i'],
  ['nordic_curls', 'Nordic Hamstring Curls', 'Körpergewicht', ['beinbeuger'], ['gesaess'], 'i', true],
  ['kettlebell_swing', 'Kettlebell Swings', 'Kettlebell', ['gesaess', 'beinbeuger'], ['ruecken_u', 'schultern', 'bauch'], 'c'],
  ['kniebeuge_kg', 'Kniebeuge (ohne Gewicht)', 'Körpergewicht', ['quad', 'gesaess'], ['adduktoren'], 'c', true],
  ['pistol_squat', 'Pistol Squat', 'Körpergewicht', ['quad', 'gesaess'], ['bauch'], 'c', true],
  ['sissy_squat', 'Sissy Squat', 'Körpergewicht', ['quad'], [], 'i', true],
  ['wall_sit', 'Wandsitzen', 'Körpergewicht', ['quad'], ['gesaess'], 'i', true],

  // Bauch
  ['crunches', 'Crunches', 'Körpergewicht', ['bauch'], [], 'i', true],
  ['kabelcrunch', 'Kabel-Crunch', 'Kabelzug', ['bauch'], [], 'i'],
  ['bauchmaschine', 'Bauchmaschine', 'Maschine', ['bauch'], [], 'i'],
  ['beinheben_haengend', 'Hängendes Beinheben', 'Körpergewicht', ['bauch'], ['unterarme'], 'i', true],
  ['beinheben_liegend', 'Beinheben liegend', 'Körpergewicht', ['bauch'], [], 'i', true],
  ['plank', 'Unterarmstütz (Plank)', 'Körpergewicht', ['bauch'], ['schultern'], 'i', true],
  ['seitstuetz', 'Seitstütz', 'Körpergewicht', ['bauch'], ['schultern'], 'i', true],
  ['russian_twist', 'Russian Twist', 'Körpergewicht', ['bauch'], [], 'i', true],
  ['ab_wheel', 'Ab Wheel Rollout', 'Körpergewicht', ['bauch'], ['lat', 'schultern'], 'i', true],
  ['pallof_press', 'Pallof Press', 'Kabelzug', ['bauch'], [], 'i'],
  ['mountain_climbers', 'Mountain Climbers', 'Körpergewicht', ['bauch'], ['schultern', 'quad'], 'i', true],
  ['dead_bug', 'Dead Bug', 'Körpergewicht', ['bauch'], [], 'i', true],
  ['holzhacker', 'Holzhacker am Kabel', 'Kabelzug', ['bauch'], ['schultern'], 'i'],
  ['sit_ups', 'Sit-ups', 'Körpergewicht', ['bauch'], [], 'i', true],

  // Ganzkörper / Kettlebell / Sonstiges
  ['thruster', 'Thruster', 'Langhantel', ['quad', 'schultern'], ['gesaess', 'trizeps'], 'c'],
  ['umsetzen', 'Umsetzen (Power Clean)', 'Langhantel', ['gesaess', 'trapez', 'quad'], ['beinbeuger', 'schultern', 'ruecken_u'], 'c'],
  ['burpees', 'Burpees', 'Körpergewicht', ['quad', 'brust'], ['schultern', 'bauch'], 'c', true],
  ['turkish_getup', 'Turkish Get-up', 'Kettlebell', ['schultern', 'bauch'], ['gesaess', 'quad'], 'c'],
  ['kb_goblet', 'Kettlebell Goblet Squat', 'Kettlebell', ['quad', 'gesaess'], ['bauch'], 'c'],
  ['kb_press', 'Kettlebell-Schulterdrücken', 'Kettlebell', ['schultern'], ['trizeps'], 'c'],
  ['kb_rudern', 'Kettlebell-Rudern', 'Kettlebell', ['lat'], ['bizeps', 'trapez'], 'c'],
  ['band_pull_apart', 'Band Pull-Aparts', 'Band', ['schultern', 'trapez'], [], 'i'],
  ['band_rotation', 'Außenrotation mit Band', 'Band', ['schultern'], [], 'i'],
  ['kh_kreuzheben', 'Kurzhantel-Kreuzheben', 'Kurzhantel', ['gesaess', 'beinbeuger'], ['ruecken_u', 'quad'], 'c'],
  ['kh_rdl', 'Rumänisches Kreuzheben (Kurzhantel)', 'Kurzhantel', ['beinbeuger', 'gesaess'], ['ruecken_u'], 'c'],
  ['sled_push', 'Schlitten schieben', 'Maschine', ['quad', 'gesaess'], ['waden'], 'c'],
];

const EXERCISES = RAW_EXERCISES.map(([id, name, equip, primary, secondary, type, bw]) => ({
  id, name, equip, primary, secondary, type, bw: !!bw,
  inc: EQUIP_INC[equip] ?? 2.5,
}));

const EX_BY_ID = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

/* Kraft-Richtwerte (geschätztes 1RM ÷ Körpergewicht) für die großen Grundübungen.
   Grobe Konsenswerte aus gängigen Kraftstandard-Tabellen, gerundet.
   Untrainiert/Anfänger/Fortgeschritten/Erfahren/Elite. */
const STRENGTH_STANDARDS = {
  m: {
    kniebeuge:        [0.75, 1.0, 1.5, 2.0, 2.5],
    bankdruecken:     [0.5, 0.75, 1.15, 1.5, 1.9],
    kreuzheben:       [1.0, 1.25, 1.75, 2.25, 2.9],
    schulterdruecken: [0.35, 0.5, 0.7, 0.9, 1.15],
    rudern_lh:        [0.5, 0.65, 0.9, 1.2, 1.5],
  },
  w: {
    kniebeuge:        [0.5, 0.75, 1.1, 1.5, 1.9],
    bankdruecken:     [0.3, 0.45, 0.65, 0.9, 1.15],
    kreuzheben:       [0.6, 0.9, 1.3, 1.7, 2.2],
    schulterdruecken: [0.2, 0.3, 0.45, 0.6, 0.8],
    rudern_lh:        [0.3, 0.4, 0.6, 0.8, 1.0],
  },
};
const STANDARD_LABELS = ['Untrainiert', 'Anfänger', 'Fortgeschritten', 'Erfahren', 'Elite'];

const ACTIVITY_TYPES = [
  { id: 'krafttraining', name: 'Krafttraining', emoji: '🏋️' },
  { id: 'laufen', name: 'Laufen', emoji: '🏃' },
  { id: 'radfahren', name: 'Radfahren', emoji: '🚴' },
  { id: 'schwimmen', name: 'Schwimmen', emoji: '🏊' },
  { id: 'yoga', name: 'Yoga', emoji: '🧘' },
  { id: 'kurs', name: 'Fitnesskurs', emoji: '🤸' },
  { id: 'hiit', name: 'HIIT', emoji: '⚡' },
  { id: 'wandern', name: 'Wandern', emoji: '🥾' },
  { id: 'ballsport', name: 'Ballsport', emoji: '⚽' },
  { id: 'klettern', name: 'Klettern/Bouldern', emoji: '🧗' },
  { id: 'kampfsport', name: 'Kampfsport', emoji: '🥊' },
  { id: 'sonstiges', name: 'Sonstiges', emoji: '✨' },
];
