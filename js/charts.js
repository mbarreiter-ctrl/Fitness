/* Kleine SVG-Charts ohne Abhängigkeiten */

function niceTicks(min, max, count = 4) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= step0) || step0;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(6));
  return { lo, hi, ticks };
}

function lineChart({ series, w = 340, h = 180, yFmt = v => fmt(v, 0), xFmt = t => fmtDate(t), yPad = 0.08, area = true }) {
  const all = series.flatMap(s => s.pts);
  if (!all.length) return '<div class="empty-chart">Noch keine Daten</div>';
  const L = 36, R = 10, T = 12, B = 24;
  let xmin = Math.min(...all.map(p => p.x)), xmax = Math.max(...all.map(p => p.x));
  if (xmin === xmax) { xmin -= DAY * 3; xmax += DAY * 3; }
  let ymin = Math.min(...all.map(p => p.y)), ymax = Math.max(...all.map(p => p.y));
  const pad = (ymax - ymin || ymax * 0.1 || 1) * yPad;
  const { lo, hi, ticks } = niceTicks(ymin - pad, ymax + pad, 4);
  const X = x => L + (x - xmin) / (xmax - xmin) * (w - L - R);
  const Y = y => T + (1 - (y - lo) / (hi - lo)) * (h - T - B);
  let svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">`;
  for (const t of ticks) {
    svg += `<line x1="${L}" x2="${w - R}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/>`;
    svg += `<text x="${L - 6}" y="${Y(t) + 3.5}" class="axis" text-anchor="end">${yFmt(t)}</text>`;
  }
  const xt = 4;
  for (let i = 0; i < xt; i++) {
    const x = xmin + (xmax - xmin) * i / (xt - 1);
    svg += `<text x="${X(x)}" y="${h - 6}" class="axis" text-anchor="${i === 0 ? 'start' : i === xt - 1 ? 'end' : 'middle'}">${xFmt(x)}</text>`;
  }
  series.forEach((s, si) => {
    if (!s.pts.length) return;
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
    if (area && s.area) {
      const ad = d + `L${X(s.pts[s.pts.length - 1].x).toFixed(1)},${h - B}L${X(s.pts[0].x).toFixed(1)},${h - B}Z`;
      svg += `<defs><linearGradient id="g${si}${s.color.replace(/[^a-z0-9]/gi, '')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".28"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>`;
      svg += `<path d="${ad}" fill="url(#g${si}${s.color.replace(/[^a-z0-9]/gi, '')})"/>`;
    }
    svg += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.5}" stroke-linecap="round" stroke-linejoin="round" ${s.dash ? `stroke-dasharray="${s.dash}"` : ''}/>`;
    if (s.dots) for (const p of s.pts) svg += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" fill="var(--card)" stroke="${s.color}" stroke-width="2"/>`;
  });
  return svg + '</svg>';
}

function barChart({ labels, stacks, w = 340, h = 160, yFmt = v => fmt(v, 0), highlightLast = true }) {
  const L = 30, R = 6, T = 10, B = 22;
  const totals = labels.map((_, i) => stacks.reduce((a, s) => a + (s.values[i] || 0), 0));
  const max = Math.max(1, ...totals);
  const { hi, ticks } = niceTicks(0, max, 3);
  const n = labels.length;
  const bw = (w - L - R) / n;
  const Y = v => T + (1 - v / hi) * (h - T - B);
  let svg = `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">`;
  for (const t of ticks) {
    svg += `<line x1="${L}" x2="${w - R}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/>`;
    svg += `<text x="${L - 5}" y="${Y(t) + 3.5}" class="axis" text-anchor="end">${yFmt(t)}</text>`;
  }
  labels.forEach((lab, i) => {
    let acc = 0;
    const x = L + i * bw + bw * 0.18, bwi = bw * 0.64;
    stacks.forEach((s, si) => {
      const v = s.values[i] || 0;
      if (v <= 0) return;
      const y1 = Y(acc + v), y0 = Y(acc);
      const top = si === stacks.length - 1 || stacks.slice(si + 1).every(s2 => !(s2.values[i] > 0));
      const hh = Math.max(0, y0 - y1), rr = top ? Math.min(5, hh, bwi / 2) : 0;
      const d = `M${x},${y0}V${y1 + rr}Q${x},${y1} ${x + rr},${y1}H${x + bwi - rr}Q${x + bwi},${y1} ${x + bwi},${y1 + rr}V${y0}Z`;
      svg += `<path d="${d}" fill="${s.color}" ${highlightLast && i !== n - 1 ? 'opacity=".7"' : ''}/>`;
      acc += v;
    });
    if (n <= 6 || (n - 1 - i) % 2 === 0) svg += `<text x="${x + bwi / 2}" y="${h - 6}" class="axis" text-anchor="middle">${lab}</text>`;
  });
  return svg + '</svg>';
}

function ring(pct, color, size = 64, stroke = 8, inner = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
    ${p > 0 ? '' : '<!--'}<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c * p} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/>${p > 0 ? '' : '-->'}</svg>
    <div class="ring-inner">${inner}</div></div>`;
}

function sparkline(values, color, w = 84, h = 30) {
  if (values.length < 2) return `<svg class="spark" viewBox="0 0 ${w} ${h}"></svg>`;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [2 + i / (values.length - 1) * (w - 4), h - 3 - (v - min) / span * (h - 6)]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
  const lp = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}"><path d="${d}" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${lp[0]}" cy="${lp[1]}" r="3" fill="${color}"/></svg>`;
}
