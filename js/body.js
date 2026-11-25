/* Stilisierte Muskelkarte (vorne + hinten) */

const BODY_FRONT = [
  ['schultern', 'ellipse', { cx: 35, cy: 57, rx: 11, ry: 10 }],
  ['schultern', 'ellipse', { cx: 85, cy: 57, rx: 11, ry: 10 }],
  ['brust', 'path', { d: 'M45,49 Q52,46 59,48 L59,72 Q50,76 43,70 Q41,58 45,49Z' }],
  ['brust', 'path', { d: 'M75,49 Q68,46 61,48 L61,72 Q70,76 77,70 Q79,58 75,49Z' }],
  ['bauch', 'path', { d: 'M48,77 L72,77 Q74,98 70,120 L50,120 Q46,98 48,77Z' }],
  ['bizeps', 'ellipse', { cx: 29, cy: 83, rx: 7, ry: 14 }],
  ['bizeps', 'ellipse', { cx: 91, cy: 83, rx: 7, ry: 14 }],
  ['unterarme', 'ellipse', { cx: 24, cy: 115, rx: 6, ry: 16 }],
  ['unterarme', 'ellipse', { cx: 96, cy: 115, rx: 6, ry: 16 }],
  ['adduktoren', 'ellipse', { cx: 56.5, cy: 146, rx: 4.5, ry: 16 }],
  ['adduktoren', 'ellipse', { cx: 63.5, cy: 146, rx: 4.5, ry: 16 }],
  ['quad', 'path', { d: 'M41,128 Q50,124 54,132 Q57,160 54,188 Q47,192 43,186 Q37,158 41,128Z' }],
  ['quad', 'path', { d: 'M79,128 Q70,124 66,132 Q63,160 66,188 Q73,192 77,186 Q83,158 79,128Z' }],
  ['waden', 'ellipse', { cx: 48, cy: 216, rx: 6.5, ry: 19 }],
  ['waden', 'ellipse', { cx: 72, cy: 216, rx: 6.5, ry: 19 }],
];
const BODY_BACK = [
  ['trapez', 'path', { d: 'M60,38 L80,52 Q70,58 60,82 Q50,58 40,52Z' }],
  ['schultern', 'ellipse', { cx: 35, cy: 57, rx: 11, ry: 10 }],
  ['schultern', 'ellipse', { cx: 85, cy: 57, rx: 11, ry: 10 }],
  ['lat', 'path', { d: 'M44,64 Q52,66 58,84 L56,104 Q47,100 43,90 Q41,76 44,64Z' }],
  ['lat', 'path', { d: 'M76,64 Q68,66 62,84 L64,104 Q73,100 77,90 Q79,76 76,64Z' }],
  ['ruecken_u', 'path', { d: 'M52,100 L68,100 L70,120 L50,120Z' }],
  ['trizeps', 'ellipse', { cx: 29, cy: 83, rx: 7, ry: 14 }],
  ['trizeps', 'ellipse', { cx: 91, cy: 83, rx: 7, ry: 14 }],
  ['unterarme', 'ellipse', { cx: 24, cy: 115, rx: 6, ry: 16 }],
  ['unterarme', 'ellipse', { cx: 96, cy: 115, rx: 6, ry: 16 }],
  ['gesaess', 'ellipse', { cx: 51, cy: 134, rx: 10, ry: 12 }],
  ['gesaess', 'ellipse', { cx: 69, cy: 134, rx: 10, ry: 12 }],
  ['beinbeuger', 'path', { d: 'M42,148 Q50,144 56,150 Q57,170 54,190 Q47,193 43,188 Q39,168 42,148Z' }],
  ['beinbeuger', 'path', { d: 'M78,148 Q70,144 64,150 Q63,170 66,190 Q73,193 77,188 Q81,168 78,148Z' }],
  ['waden', 'ellipse', { cx: 48, cy: 214, rx: 8, ry: 18 }],
  ['waden', 'ellipse', { cx: 72, cy: 214, rx: 8, ry: 18 }],
];

function bodySilhouette(dx) {
  // neutrale Grundform
  return `<g transform="translate(${dx},0)" class="silhouette">
    <circle cx="60" cy="22" r="13"/>
    <rect x="54" y="33" width="12" height="10" rx="4"/>
    <path d="M38,46 Q60,40 82,46 Q90,50 92,60 L98,100 L102,132 Q98,136 94,132 L86,100 L80,76 Q78,100 76,122 Q82,150 80,190 L78,236 Q72,242 66,236 L64,190 L61,140 L59,140 L56,190 L54,236 Q48,242 42,236 L40,190 Q38,150 44,122 Q42,100 40,76 L34,100 L26,132 Q22,136 18,132 L22,100 L28,60 Q30,50 38,46Z"/>
  </g>`;
}

function bodyMap(values, { max = null, accent = 'var(--rose-deep)' } = {}) {
  const m = max ?? Math.max(1, ...Object.values(values));
  const shape = ([key, tag, attrs], dx) => {
    const v = Math.min(1, (values[key] || 0) / m);
    const a = Object.entries(attrs).map(([k, val]) => `${k}="${val}"`).join(' ');
    const op = v > 0 ? (0.25 + 0.75 * v).toFixed(2) : 0;
    return `<${tag} ${a} transform="translate(${dx},0)" class="muscle" data-m="${key}" fill="${v > 0 ? accent : 'var(--muscle-off)'}" fill-opacity="${v > 0 ? op : 1}"><title>${MUSCLES[key].name}</title></${tag}>`;
  };
  return `<svg class="bodymap" viewBox="0 0 260 250" role="img" aria-label="Muskelkarte">
    ${bodySilhouette(0)}${bodySilhouette(140)}
    ${BODY_FRONT.map(s => shape(s, 0)).join('')}
    ${BODY_BACK.map(s => shape(s, 140)).join('')}
    <text x="60" y="249" class="axis" text-anchor="middle">Vorne</text>
    <text x="200" y="249" class="axis" text-anchor="middle">Hinten</text>
  </svg>`;
}

/* Kleine Karte für eine einzelne Übung: primär kräftig, sekundär hell */
function exerciseBodyMap(ex) {
  const vals = {};
  for (const m of ex.secondary) vals[m] = 0.4;
  for (const m of ex.primary) vals[m] = 1;
  return bodyMap(vals, { max: 1 });
}
