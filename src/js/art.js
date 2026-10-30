/* ============ Ícones e ilustrações de produto (SVG gerado) ============ */
const ICON_PATHS = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  bag: '<path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  home: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12v8h13v-8"/><path d="M10 20v-4.5h4V20"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.6"/>',
  wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 0-2-2Z"/><path d="M14.5 6.5 17 4l3 3-2.5 2.5"/>',
  chat: '<path d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5Z"/><path d="M9 10.5h6M9 13.5h4"/>',
  pin: '<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/>',
  chevR: '<path d="m9.5 6 6 6-6 6"/>',
  chevL: '<path d="m14.5 6-6 6 6 6"/>',
  chevD: '<path d="m6 9.5 6 6 6-6"/>',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  box: '<path d="M4 8 12 4l8 4v8l-8 4-8-4z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0"/><path d="M15.5 5.6a3.4 3.4 0 0 1 0 6.3M17.5 13.7a6.2 6.2 0 0 1 3.7 5.8"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M11 17.5h2"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17v.2"/>',
  chart: '<path d="M4 20h16"/><path d="M7 16v-5M12 16V7M17 16v-8"/>',
  dash: '<rect x="4" y="4" width="7" height="9" rx="1.5"/><rect x="13" y="4" width="7" height="5" rx="1.5"/><rect x="13" y="11" width="7" height="9" rx="1.5"/><rect x="4" y="15" width="7" height="5" rx="1.5"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  layers: '<path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4M4 16l8 4 8-4"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".8"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5v4h-4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>',
  power: '<path d="M12 3.5v8"/><path d="M7 6.6a7.5 7.5 0 1 0 10 0"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  shield: '<path d="M12 3.5 5 6v5.5c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  logout: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  kanban: '<rect x="4" y="4" width="4.5" height="16" rx="1.2"/><rect x="9.8" y="4" width="4.5" height="10" rx="1.2"/><rect x="15.6" y="4" width="4.5" height="13" rx="1.2"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.8" cy="6" r=".9"/><circle cx="4.8" cy="12" r=".9"/><circle cx="4.8" cy="18" r=".9"/>',
  /* serviços */
  screen: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.3"/><path d="m9 7 3 3.5-2 2 4 4.5"/>',
  battery: '<rect x="3" y="7.5" width="16" height="9" rx="2"/><path d="M21 10.5v3"/><path d="M10.5 9.5 8.5 12.5h3l-2 2.5"/>',
  plug: '<path d="M8 3v4M16 3v4M6 7h12v3a6 6 0 0 1-12 0z"/><path d="M12 16v5"/>',
  camera: '<path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.4"/>',
  volume: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M7.5 12h2l1.3-3 2.4 6 1.3-3h2"/>',
  code: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13"/>',
  film: '<rect x="6" y="2.5" width="12" height="19" rx="2.4"/><path d="M6.5 15 17.5 4M9 21 18 12"/>',
  puzzle: '<path d="M10 4h4v2.5a1.5 1.5 0 0 0 3 0V4h3v6h-2.5a1.5 1.5 0 0 0 0 3H20v7h-6v-2.5a1.5 1.5 0 0 0-3 0V20H4v-6h2.5a1.5 1.5 0 0 0 0-3H4V4z"/>',
  tool: '<path d="m4.5 19.5 6-6M9 7.5l7.5 7.5M14.5 4.5l5 5-3.5 3.5-5-5z"/><path d="m3.5 18.5 2 2 2.5-2.5-2-2z"/>',
};
function icon(name, size = 22, extra = '') {
  return `<svg class="ic ${extra}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

/* ---------- cor ---------- */
function hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(hex, amt) { // amt: -1..1  (negativo escurece)
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbToHex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt);
  return rgbToHex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
function lum(hex) { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }

let __gid = 0;
function uid(p) { __gid += 1; return p + __gid; }

/* sombra no chão */
function floorShadow(cx, cy, rx, ry, o = 0.28) {
  const id = uid('fs');
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#000" stop-opacity="${o}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id})"/>`;
}
function bodyGrad(color, id, dir = 'diag', k = 1) {
  const a = shade(color, 0.22 * k), b = color, c = shade(color, -0.22 * k);
  const coords = dir === 'diag' ? 'x1="0" y1="0" x2="1" y2="1"' : dir === 'h' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="0" x2="0" y2="1"';
  return `<linearGradient id="${id}" ${coords}><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`;
}
function lens(cx, cy, r) {
  const g1 = uid('lr'), g2 = uid('lg');
  return `<defs><linearGradient id="${g1}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a8d93"/><stop offset=".5" stop-color="#2b2d31"/><stop offset="1" stop-color="#6d7076"/></linearGradient><radialGradient id="${g2}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#2c3a52"/><stop offset=".55" stop-color="#0b0f17"/><stop offset="1" stop-color="#020306"/></radialGradient></defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g1})"/><circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="#0b0c0f"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="url(#${g2})"/><circle cx="${cx - r * 0.22}" cy="${cy - r * 0.24}" r="${r * 0.13}" fill="#fff" opacity=".55"/><circle cx="${cx + r * 0.2}" cy="${cy + r * 0.18}" r="${r * 0.07}" fill="#7fa8ff" opacity=".45"/>`;
}
function flash(cx, cy, r) { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#efe9cf" stroke="#9a9a90" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="#fffbe6"/>`; }

/* ---------- smartphone (verso) ---------- */
function phoneBack(x, y, w, h, color, cam, rot = 0) {
  const g = uid('pb'), gl = uid('pg');
  const r = w * 0.17, cx = x + w / 2, cy = y + h / 2;
  const edge = shade(color, -0.35);
  let camSvg = '';
  const mx = x + w * 0.09, my = y + h * 0.045;
  const modColor = shade(color, lum(color) > 0.6 ? -0.06 : 0.08);
  const mg = uid('mg');
  const modDefs = `<defs>${bodyGrad(modColor, mg, 'diag', 1.3)}</defs>`;
  if (cam === 'apple-d' || cam === 'apple-v') {
    const s = w * 0.42;
    if (cam === 'apple-d') {
      camSvg = `${modDefs}<rect x="${mx}" y="${my}" width="${s}" height="${s}" rx="${s * 0.27}" fill="url(#${mg})" stroke="${edge}" stroke-opacity=".5"/>${lens(mx + s * 0.3, my + s * 0.3, s * 0.2)}${lens(mx + s * 0.7, my + s * 0.7, s * 0.2)}${flash(mx + s * 0.72, my + s * 0.28, s * 0.07)}`;
    } else {
      camSvg = `${modDefs}<rect x="${mx}" y="${my}" width="${s * 0.52}" height="${s}" rx="${s * 0.26}" fill="url(#${mg})" stroke="${edge}" stroke-opacity=".5"/>${lens(mx + s * 0.26, my + s * 0.27, s * 0.19)}${lens(mx + s * 0.26, my + s * 0.73, s * 0.19)}${flash(mx + s * 0.72, my + s * 0.3, s * 0.07)}`;
    }
  } else if (cam === 'sam') {
    const lr = w * 0.085;
    camSvg = [0, 1, 2].map(i => lens(x + w * 0.2, y + h * 0.09 + i * lr * 2.6, lr)).join('') + flash(x + w * 0.38, y + h * 0.09, lr * 0.35);
  } else if (cam === 'moto') {
    const s = w * 0.44;
    camSvg = `${modDefs}<rect x="${mx}" y="${my}" width="${s}" height="${s * 0.95}" rx="${s * 0.18}" fill="url(#${mg})" stroke="${edge}" stroke-opacity=".5"/>${lens(mx + s * 0.3, my + s * 0.3, s * 0.2)}${lens(mx + s * 0.3, my + s * 0.68, s * 0.17)}${flash(mx + s * 0.72, my + s * 0.3, s * 0.07)}`;
  } else if (cam === 'moto-e') {
    const s = w * 0.3;
    camSvg = `${modDefs}<rect x="${mx}" y="${my}" width="${s * 0.62}" height="${s * 1.25}" rx="${s * 0.18}" fill="url(#${mg})" stroke="${edge}" stroke-opacity=".5"/>${lens(mx + s * 0.31, my + s * 0.33, s * 0.21)}${lens(mx + s * 0.31, my + s * 0.88, s * 0.15)}${flash(mx + s * 0.85, my + s * 0.2, s * 0.08)}`;
  } else if (cam === 'xi') {
    const s = w * 0.5;
    camSvg = `${modDefs}<rect x="${mx}" y="${my}" width="${s}" height="${s * 0.78}" rx="${s * 0.16}" fill="url(#${mg})" stroke="${edge}" stroke-opacity=".5"/>${lens(mx + s * 0.25, my + s * 0.24, s * 0.16)}${lens(mx + s * 0.25, my + s * 0.56, s * 0.13)}${lens(mx + s * 0.62, my + s * 0.24, s * 0.11)}${flash(mx + s * 0.62, my + s * 0.56, s * 0.06)}`;
  }
  return `<g transform="rotate(${rot} ${cx} ${cy})"><defs>${bodyGrad(color, g)}<linearGradient id="${gl}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="${r + 2}" fill="${edge}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#${g})"/>
  <clipPath id="${gl}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
  <path d="M${x + w * 0.55} ${y} L${x + w * 0.78} ${y} L${x + w * 0.2} ${y + h} L${x - 0.02 * w} ${y + h} Z" fill="url(#${gl})" opacity=".55" clip-path="url(#${gl}c)"/>
  <rect x="${x + 1.5}" y="${y + 1.5}" width="${w - 3}" height="${h - 3}" rx="${r - 1}" fill="none" stroke="#fff" stroke-opacity=".18"/>
  ${camSvg}</g>`;
}
/* ---------- smartphone (frente) ---------- */
function phoneFront(x, y, w, h, color, cam, rot = 0) {
  const r = w * 0.17, cx = x + w / 2, cy = y + h / 2, g = uid('sc'), g2 = uid('sw');
  const deep = shade(color, -0.55), mid = shade(color, lum(color) > 0.7 ? -0.25 : 0.05);
  const isApple = cam && cam.startsWith('apple');
  const notch = isApple ? `<rect x="${cx - w * 0.15}" y="${y + h * 0.04}" width="${w * 0.3}" height="${h * 0.035}" rx="${h * 0.0175}" fill="#000"/>` : `<circle cx="${cx}" cy="${y + h * 0.055}" r="${w * 0.03}" fill="#000"/>`;
  return `<g transform="rotate(${rot} ${cx} ${cy})"><defs><linearGradient id="${g}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${mid}"/><stop offset=".55" stop-color="${deep}"/><stop offset="1" stop-color="#07080b"/></linearGradient><linearGradient id="${g2}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFC800" stop-opacity=".9"/><stop offset="1" stop-color="${shade(color, 0.35)}" stop-opacity=".2"/></linearGradient></defs>
  <rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" rx="${r + 2}" fill="${shade(color, -0.25)}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#0a0a0c"/>
  <rect x="${x + w * 0.045}" y="${y + w * 0.045}" width="${w * 0.91}" height="${h - w * 0.09}" rx="${r * 0.8}" fill="url(#${g})"/>
  <path d="M${x + w * 0.045} ${y + h * 0.62} C ${x + w * 0.4} ${y + h * 0.45}, ${x + w * 0.6} ${y + h * 0.8}, ${x + w * 0.955} ${y + h * 0.55} L${x + w * 0.955} ${y + h * 0.7} C ${x + w * 0.6} ${y + h * 0.92}, ${x + w * 0.35} ${y + h * 0.6}, ${x + w * 0.045} ${y + h * 0.78} Z" fill="url(#${g2})" opacity=".55"/>
  <path d="M${x + w * 0.045} ${y + h * 0.4} C ${x + w * 0.45} ${y + h * 0.25}, ${x + w * 0.5} ${y + h * 0.6}, ${x + w * 0.955} ${y + h * 0.36}" stroke="${shade(color, 0.5)}" stroke-opacity=".35" stroke-width="${w * 0.02}" fill="none"/>
  <path d="M${x + w * 0.62} ${y + w * 0.045} L${x + w * 0.85} ${y + w * 0.045} L${x + w * 0.3} ${y + h - w * 0.045} L${x + w * 0.1} ${y + h - w * 0.045} Z" fill="#fff" opacity=".05"/>
  ${notch}</g>`;
}
function phoneArt(color, cam, view = 'main') {
  if (view === 'back') return wrapSvg(floorShadow(250, 286, 90, 10) + phoneBack(190, 18, 120, 258, color, cam, 0));
  if (view === 'front') return wrapSvg(floorShadow(250, 286, 90, 10) + phoneFront(190, 18, 120, 258, color, cam, 0));
  return wrapSvg(floorShadow(250, 284, 150, 12) + phoneFront(250, 26, 112, 240, color, cam, 9) + phoneBack(140, 30, 112, 240, color, cam, -8));
}
function wrapSvg(inner, vb = '0 0 500 300') { return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid meet">${inner}</svg>`; }

/* ---------- capas ---------- */
function caseArt(color, kind, view = 'main') {
  const x = 186, y = 24, w = 128, h = 252;
  const g = uid('cg'), t = uid('ct');
  const edge = shade(color, -0.3);
  const gloss = kind === 'silicone' ? 0.05 : 0.14;
  let extra = '';
  if (kind === 'antichoque') {
    extra = `<defs><pattern id="${t}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="none"/><path d="M0 0v8" stroke="${shade(color, -0.25)}" stroke-width="2.4" opacity=".45"/></pattern></defs>
    <rect x="${x + 14}" y="${y + 90}" width="${w - 28}" height="${h - 110}" rx="14" fill="url(#${t})"/>` +
      [[x - 4, y - 4], [x + w - 30, y - 4], [x - 4, y + h - 30], [x + w - 30, y + h - 30]].map(([a, b]) => `<rect x="${a}" y="${b}" width="34" height="34" rx="14" fill="${shade(color, -0.12)}" stroke="${edge}" stroke-width="1.5"/>`).join('');
  }
  if (kind === 'suporte') {
    const rg = uid('rg');
    extra = `<defs><linearGradient id="${rg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f4f6"/><stop offset=".5" stop-color="#8e9198"/><stop offset="1" stop-color="#e5e6ea"/></linearGradient></defs>
    <circle cx="${x + w / 2}" cy="${y + h * 0.6}" r="34" fill="none" stroke="url(#${rg})" stroke-width="9"/><circle cx="${x + w / 2}" cy="${y + h * 0.6}" r="17" fill="url(#${rg})"/><circle cx="${x + w / 2}" cy="${y + h * 0.6}" r="9" fill="${shade(color, -0.2)}"/>`;
  }
  const hole = `<rect x="${x + 12}" y="${y + 12}" width="62" height="64" rx="18" fill="#141517" stroke="${shade(color, 0.15)}" stroke-width="2.5"/>${lens(x + 31, y + 32, 11)}${lens(x + 55, y + 56, 11)}`;
  const cx = x + w / 2, cy = y + h / 2;
  const rot = view === 'main' ? -9 : 0;
  const side = view === 'main' ? `<g transform="rotate(7 330 160)"><rect x="300" y="40" width="${w}" height="${h - 10}" rx="24" fill="none" stroke="${shade(color, -0.1)}" stroke-width="10" opacity=".9"/><rect x="306" y="46" width="${w - 12}" height="${h - 22}" rx="20" fill="${shade(color, 0.55)}" opacity=".35"/><rect x="384" y="70" width="6" height="34" rx="3" fill="${shade(color, -0.25)}"/></g>` : '';
  return wrapSvg(`${floorShadow(250, 284, 150, 12)}${side}<g transform="rotate(${rot} ${cx} ${cy})"><defs>${bodyGrad(color, g, 'diag', 0.8)}</defs>
   <rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="27" fill="${edge}"/>
   <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="25" fill="url(#${g})"/>
   <clipPath id="${g}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="25"/></clipPath>
   <path d="M${x + w * 0.6} ${y} L${x + w * 0.85} ${y} L${x + w * 0.25} ${y + h} L${x} ${y + h} Z" fill="#fff" opacity="${gloss}" clip-path="url(#${g}c)"/>
   ${extra}${hole}
   <rect x="${x + w - 2}" y="${y + 60}" width="5" height="34" rx="2.5" fill="${shade(color, -0.2)}"/></g>`);
}

/* ---------- películas ---------- */
function packArt(label, sub) {
  return `<g><rect x="104" y="40" width="150" height="214" rx="10" fill="#131416"/><rect x="104" y="40" width="150" height="214" rx="10" fill="none" stroke="#2c2d31"/>
  <text x="122" y="88" fill="#fff" font-family="Archivo, Arial Black, sans-serif" font-weight="800" font-size="19">${label}</text>
  <text x="122" y="110" fill="#fff" font-family="Archivo, Arial Black, sans-serif" font-weight="800" font-size="19">${sub}</text>
  <rect x="122" y="124" width="54" height="5" rx="2" fill="#FFC800"/>
  ${[0, 1, 2].map(i => `<circle cx="132" cy="${160 + i * 28}" r="8" fill="none" stroke="#9a9ca2" stroke-width="1.6"/><rect x="148" y="${156 + i * 28}" width="${50 - i * 8}" height="7" rx="3" fill="#5a5c62"/>`).join('')}</g>`;
}
function filmArt(kind, view = 'main') {
  const g = uid('fg');
  const dark = kind === 'privacidade';
  const glass = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${dark ? '#3a3f48' : '#ffffff'}" stop-opacity="${dark ? '.9' : '.75'}"/><stop offset=".5" stop-color="${dark ? '#0d0f13' : '#dfe6ee'}" stop-opacity="${dark ? '.85' : '.35'}"/><stop offset="1" stop-color="${dark ? '#1b1e24' : '#ffffff'}" stop-opacity="${dark ? '.9' : '.6'}"/></linearGradient></defs>`;
  if (kind === 'camera') {
    const plate = (x, y, s) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.26}" fill="url(#${g})" stroke="#c9d0d8" stroke-width="2"/>${[[0.3, 0.3], [0.7, 0.7], [0.3, 0.72]].map(([a, b]) => `<circle cx="${x + s * a}" cy="${y + s * b}" r="${s * 0.15}" fill="#1a1c20" stroke="#b6bcc4" stroke-width="2.5"/><circle cx="${x + s * a - 3}" cy="${y + s * b - 3}" r="${s * 0.03}" fill="#fff" opacity=".6"/>`).join('')}`;
    return wrapSvg(glass + floorShadow(250, 280, 150, 12) + (view === 'main' ? packArt('PELÍCULA', 'DE CÂMERA') : '') + `<g transform="rotate(-8 330 170)">${plate(view === 'main' ? 268 : 175, view === 'main' ? 92 : 50, view === 'main' ? 150 : 180)}</g>`);
  }
  const sheet = (x, y, w, h, rot) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="url(#${g})" stroke="${dark ? '#5d636d' : '#cdd4dc'}" stroke-width="2.5"/><rect x="${x + w / 2 - 16}" y="${y + 9}" width="32" height="8" rx="4" fill="${dark ? '#000' : '#c3cad3'}"/><path d="M${x + w * 0.62} ${y + 4} L${x + w * 0.88} ${y + 4} L${x + w * 0.3} ${y + h - 4} L${x + w * 0.08} ${y + h - 4} Z" fill="#fff" opacity="${dark ? '.08' : '.5'}"/></g>`;
  if (view === 'main') return wrapSvg(glass + floorShadow(250, 282, 150, 12) + packArt('PELÍCULA', dark ? 'PRIVACIDADE' : 'DE VIDRO') + sheet(266, 28, 120, 248, 6));
  return wrapSvg(glass + floorShadow(250, 282, 120, 12) + sheet(188, 22, 124, 256, 0) + (dark ? `<path d="M120 150 h40 M340 150 h40" stroke="#888" stroke-width="2" stroke-dasharray="4 5"/><text x="96" y="140" font-size="13" fill="#6a6c72" font-family="Plus Jakarta Sans, sans-serif">visão lateral</text><text x="342" y="140" font-size="13" fill="#6a6c72" font-family="Plus Jakarta Sans, sans-serif">bloqueada</text>` : ''));
}

/* ---------- carregadores, cabos, energia ---------- */
function cube(x, y, w, h, d, color) {
  const top = shade(color, 0.12), front = color, side = shade(color, -0.14);
  return `<path d="M${x} ${y + d} L${x + d} ${y} L${x + d + w} ${y} L${x + w} ${y + d} Z" fill="${top}"/>
  <path d="M${x + w} ${y + d} L${x + d + w} ${y} L${x + d + w} ${y + h} L${x + w} ${y + h + d} Z" fill="${side}"/>
  <rect x="${x}" y="${y + d}" width="${w}" height="${h}" rx="6" fill="${front}"/>`;
}
function usbC(x, y, w = 26, h = 9, dark = false) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${dark ? '#0b0b0c' : '#1d1e21'}" stroke="#8b8e94" stroke-width="1.4"/><rect x="${x + 5}" y="${y + h / 2 - 1.2}" width="${w - 10}" height="2.4" rx="1.2" fill="#6d7076"/>`; }
function usbA(x, y) { return `<rect x="${x}" y="${y}" width="34" height="13" rx="2" fill="#1d1e21" stroke="#8b8e94" stroke-width="1.4"/><rect x="${x + 4}" y="${y + 3}" width="26" height="4" rx="1" fill="#2d6cdf"/>`; }
function brickArt(color, view = 'main') {
  const dark = lum(color) < 0.4;
  const pins = `<rect x="358" y="104" width="44" height="12" rx="6" fill="url(#pin)"/><rect x="358" y="160" width="44" height="12" rx="6" fill="url(#pin)"/>`;
  return wrapSvg(`<defs><linearGradient id="pin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f2f4"/><stop offset=".5" stop-color="#8f939a"/><stop offset="1" stop-color="#dfe1e5"/></linearGradient></defs>${floorShadow(255, 268, 140, 14)}${pins}${cube(150, 70, 190, 170, 26, color)}
  ${usbC(190, 150, 34, 12, dark)}${usbA(250, 150)}
  <text x="245" y="214" text-anchor="middle" font-size="12" font-family="Plus Jakarta Sans, sans-serif" fill="${dark ? '#8d9096' : '#9a9da3'}">USB-C · USB-A</text>`);
}
function cableArt(color, end = 'c', view = 'main') {
  const stroke = color, hi = shade(color, 0.35), lo = shade(color, lum(color) > 0.8 ? -0.3 : -0.2);
  const loops = [0, 1, 2, 3].map(i => `<ellipse cx="${246 + i * 4}" cy="${150 + i * 3}" rx="${108 - i * 6}" ry="${62 - i * 3}" fill="none" stroke="${lo}" stroke-width="12"/><ellipse cx="${246 + i * 4}" cy="${150 + i * 3}" rx="${108 - i * 6}" ry="${62 - i * 3}" fill="none" stroke="${stroke}" stroke-width="9"/><ellipse cx="${246 + i * 4}" cy="${147 + i * 3}" rx="${108 - i * 6}" ry="${62 - i * 3}" fill="none" stroke="${hi}" stroke-width="2.5" stroke-opacity=".7" stroke-dasharray="90 200"/>`).join('');
  const plug = (x, y, rot, type) => {
    const housing = `<rect x="${x}" y="${y}" width="58" height="26" rx="8" fill="${stroke}" stroke="${lo}" stroke-width="2"/><rect x="${x + 6}" y="${y + 4}" width="44" height="5" rx="2.5" fill="#fff" opacity=".35"/>`;
    const tip = type === 'l' ? `<rect x="${x + 56}" y="${y + 7}" width="28" height="12" rx="3" fill="url(#metal)"/><rect x="${x + 62}" y="${y + 10}" width="16" height="6" rx="2" fill="#c9a24a" opacity=".6"/>` : `<rect x="${x + 56}" y="${y + 5}" width="26" height="16" rx="8" fill="url(#metal)"/><rect x="${x + 62}" y="${y + 11}" width="14" height="4" rx="2" fill="#2a2b2e"/>`;
    return `<g transform="rotate(${rot} ${x + 29} ${y + 13})">${housing}${tip}</g>`;
  };
  return wrapSvg(`<defs><linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".5" stop-color="#9da1a8"/><stop offset="1" stop-color="#e3e5e8"/></linearGradient></defs>${floorShadow(250, 250, 170, 18, 0.2)}${loops}
   <path d="M150 170 C 120 200, 130 230, 170 236" stroke="${lo}" stroke-width="12" fill="none"/><path d="M150 170 C 120 200, 130 230, 170 236" stroke="${stroke}" stroke-width="9" fill="none"/>
   <path d="M350 140 C 380 120, 392 96, 380 74" stroke="${lo}" stroke-width="12" fill="none"/><path d="M350 140 C 380 120, 392 96, 380 74" stroke="${stroke}" stroke-width="9" fill="none"/>
   ${plug(166, 223, 0, 'c')}${plug(352, 38, -64, end)}`);
}
function padArt(color) {
  const g = uid('pd');
  return wrapSvg(`<defs><radialGradient id="${g}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="${shade(color, 0.25)}"/><stop offset="1" stop-color="${shade(color, -0.15)}"/></radialGradient></defs>${floorShadow(250, 222, 175, 22)}
   <path d="M88 168 C 60 224, 300 236, 300 236" stroke="#2b2c30" stroke-width="7" fill="none" opacity=".0"/>
   <ellipse cx="250" cy="176" rx="150" ry="52" fill="${shade(color, -0.3)}"/><rect x="100" y="158" width="300" height="18" fill="${shade(color, -0.3)}"/>
   <ellipse cx="250" cy="158" rx="150" ry="52" fill="url(#${g})"/>
   <ellipse cx="250" cy="158" rx="104" ry="35" fill="none" stroke="${lum(color) < 0.4 ? '#4a4c52' : '#cfd2d6'}" stroke-width="3"/>
   <ellipse cx="250" cy="158" rx="60" ry="20" fill="${shade(color, 0.08)}" stroke="${lum(color) < 0.4 ? '#3a3c41' : '#dfe1e4'}"/>
   <ellipse cx="250" cy="200" rx="10" ry="3" fill="#FFC800" opacity=".95"/>
   <path d="M395 178 C 440 186, 450 222, 470 240" stroke="${shade(color, -0.2)}" stroke-width="8" fill="none" stroke-linecap="round"/>`);
}
function bankArt(color, view = 'main') {
  const g = uid('bk'), dark = lum(color) < 0.4;
  return wrapSvg(`<defs>${bodyGrad(color, g, 'diag', 0.9)}</defs>${floorShadow(250, 270, 160, 14)}
   <g transform="rotate(-6 250 160)">
   <rect x="128" y="62" width="244" height="190" rx="30" fill="${shade(color, -0.28)}"/>
   <rect x="124" y="52" width="244" height="190" rx="30" fill="url(#${g})"/>
   <path d="M260 52 L320 52 L200 242 L140 242 Z" fill="#fff" opacity=".07"/>
   ${[0, 1, 2, 3].map(i => `<circle cx="${214 + i * 22}" cy="210" r="5" fill="${i < 3 ? '#FFC800' : (dark ? '#3c3e44' : '#c9ccd1')}"/>`).join('')}
   <rect x="168" y="96" width="156" height="52" rx="12" fill="none" stroke="${dark ? '#3e4046' : '#cfd2d7'}" stroke-width="2"/>
   <text x="246" y="129" text-anchor="middle" font-size="18" font-weight="700" font-family="Plus Jakarta Sans, sans-serif" fill="${dark ? '#8d9096' : '#7d8086'}">10.000 mAh</text>
   ${usbC(150, 62, 30, 9, dark)}${usbC(196, 62, 30, 9, dark)}
   </g>`);
}
function carChargerArt() {
  const g = uid('cc');
  return wrapSvg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b1c1f"/><stop offset=".45" stop-color="#3b3d42"/><stop offset="1" stop-color="#121315"/></linearGradient><linearGradient id="mt2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f939a"/><stop offset=".5" stop-color="#eceef1"/><stop offset="1" stop-color="#7d8188"/></linearGradient></defs>${floorShadow(250, 280, 110, 12)}
   <rect x="216" y="128" width="68" height="132" rx="14" fill="url(#mt2)"/><rect x="236" y="250" width="28" height="22" rx="6" fill="#cfd2d6"/>
   <rect x="204" y="60" width="92" height="84" rx="20" fill="url(#${g})"/>
   <ellipse cx="250" cy="62" rx="46" ry="16" fill="#26272b" stroke="#FFC800" stroke-width="3"/>
   ${usbC(222, 56, 24, 9)}${usbC(254, 56, 24, 9)}
   <rect x="216" y="170" width="68" height="4" fill="#fff" opacity=".2"/>`);
}

/* ---------- áudio ---------- */
function headphonesArt(color, view = 'main') {
  const g = uid('hp'), cush = shade(color, -0.45), dark = lum(color) < 0.4;
  return wrapSvg(`<defs>${bodyGrad(color, g, 'diag', 1)}</defs>${floorShadow(250, 280, 160, 14)}
   <path d="M130 190 C 120 60, 380 60, 370 190" fill="none" stroke="${shade(color, -0.3)}" stroke-width="26" stroke-linecap="round"/>
   <path d="M130 190 C 120 60, 380 60, 370 190" fill="none" stroke="url(#${g})" stroke-width="20" stroke-linecap="round"/>
   <path d="M156 104 C 200 66, 300 66, 344 104" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="4" stroke-linecap="round"/>
   <rect x="118" y="150" width="20" height="44" rx="6" fill="url(#mtl)"/><rect x="362" y="150" width="20" height="44" rx="6" fill="url(#mtl)"/>
   <defs><linearGradient id="mtl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9da1a8"/><stop offset=".5" stop-color="#f1f2f4"/><stop offset="1" stop-color="#8b8f96"/></linearGradient></defs>
   <ellipse cx="148" cy="214" rx="56" ry="64" fill="${cush}"/><ellipse cx="140" cy="212" rx="50" ry="58" fill="url(#${g})"/><ellipse cx="140" cy="212" rx="30" ry="36" fill="${shade(color, dark ? 0.1 : -0.08)}"/>
   <ellipse cx="352" cy="214" rx="56" ry="64" fill="${cush}"/><ellipse cx="360" cy="212" rx="50" ry="58" fill="url(#${g})"/><ellipse cx="360" cy="212" rx="30" ry="36" fill="${shade(color, dark ? 0.1 : -0.08)}"/>
   <circle cx="380" cy="186" r="4" fill="#FFC800"/>`);
}
function wiredArt(color) {
  const c = color, lo = shade(color, lum(color) > 0.8 ? -0.32 : -0.25);
  const bud = (x, y, r) => `<g transform="rotate(${r} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="30" ry="34" fill="${lo}"/><ellipse cx="${x - 3}" cy="${y - 2}" rx="28" ry="31" fill="${c}"/><ellipse cx="${x - 8}" cy="${y - 10}" rx="10" ry="6" fill="#fff" opacity=".35"/><rect x="${x - 8}" y="${y + 24}" width="16" height="44" rx="8" fill="${c}" stroke="${lo}"/></g>`;
  return wrapSvg(`<defs><linearGradient id="metal3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".5" stop-color="#9da1a8"/><stop offset="1" stop-color="#e3e5e8"/></linearGradient></defs>${floorShadow(250, 280, 170, 14, 0.18)}
   <path d="M175 160 C 190 230, 230 250, 260 220 C 290 190, 320 230, 330 160" stroke="${lo}" stroke-width="5" fill="none"/>
   <path d="M260 220 C 250 260, 300 268, 360 250" stroke="${lo}" stroke-width="5" fill="none"/>
   ${bud(170, 100, -18)}${bud(330, 100, 18)}
   <rect x="358" y="238" width="44" height="22" rx="7" fill="${c}" stroke="${lo}" stroke-width="2"/><rect x="400" y="242" width="24" height="14" rx="7" fill="url(#metal3)"/>`);
}
function speakerArt(color) {
  const g = uid('sp'), dot = uid('dt');
  return wrapSvg(`<defs>${bodyGrad(color, g, 'v', 1.1)}<pattern id="${dot}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="4.5" cy="4.5" r="1.8" fill="${shade(color, -0.45)}" opacity=".55"/></pattern></defs>${floorShadow(250, 262, 180, 16)}
   <rect x="96" y="96" width="308" height="150" rx="75" fill="${shade(color, -0.3)}"/>
   <rect x="92" y="88" width="308" height="150" rx="75" fill="url(#${g})"/>
   <rect x="122" y="104" width="248" height="118" rx="58" fill="url(#${dot})"/>
   <path d="M150 96 C 220 86, 300 86, 360 98" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>
   <ellipse cx="96" cy="163" rx="18" ry="74" fill="${shade(color, -0.2)}"/><ellipse cx="398" cy="163" rx="18" ry="74" fill="${shade(color, -0.35)}"/>
   <rect x="214" y="82" width="70" height="10" rx="5" fill="${shade(color, -0.4)}"/>
   ${[0, 1, 2].map(i => `<circle cx="${226 + i * 22}" cy="87" r="3" fill="${i === 1 ? '#FFC800' : '#ddd'}"/>`).join('')}`);
}

/* ---------- vestíveis ---------- */
function watchArt(color, band) {
  const g = uid('wc'), bg = uid('wb');
  band = band || color;
  return wrapSvg(`<defs>${bodyGrad(color, g, 'diag', 1.2)}${bodyGrad(band, bg, 'h', 0.6)}</defs>${floorShadow(250, 286, 110, 10)}
   <rect x="206" y="10" width="88" height="90" rx="22" fill="url(#${bg})"/><rect x="206" y="200" width="88" height="94" rx="22" fill="url(#${bg})"/>
   ${[0, 1, 2, 3].map(i => `<circle cx="250" cy="${222 + i * 16}" r="3.2" fill="${shade(band, -0.35)}"/>`).join('')}
   <rect x="180" y="70" width="140" height="160" rx="42" fill="${shade(color, -0.3)}"/>
   <rect x="182" y="70" width="136" height="156" rx="40" fill="url(#${g})"/>
   <rect x="194" y="82" width="112" height="132" rx="30" fill="#050506"/>
   <circle cx="250" cy="148" r="44" fill="none" stroke="#262729" stroke-width="7"/>
   <path d="M250 104 A 44 44 0 0 1 292 136" stroke="#FFC800" stroke-width="7" fill="none" stroke-linecap="round"/>
   <path d="M250 117 A 31 31 0 1 1 222 135" stroke="#3a74ff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>
   <text x="250" y="156" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="800" font-size="22" fill="#fff">10:09</text>
   <rect x="318" y="118" width="10" height="26" rx="4" fill="${shade(color, -0.15)}"/>
   <path d="M196 92 L230 82 L204 200 Z" fill="#fff" opacity=".05"/>`);
}
function bandArt(color) {
  const lo = shade(color, -0.3);
  return wrapSvg(`${floorShadow(250, 276, 170, 14, 0.18)}
   <path d="M120 70 C 80 130, 120 230, 250 238 C 380 230, 420 130, 380 70" fill="none" stroke="${lo}" stroke-width="58" stroke-linecap="round"/>
   <path d="M120 70 C 80 130, 120 230, 250 238 C 380 230, 420 130, 380 70" fill="none" stroke="${color}" stroke-width="52" stroke-linecap="round"/>
   <path d="M118 76 C 86 130, 124 214, 250 222" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="5" stroke-linecap="round"/>
   ${[0, 1, 2, 3, 4].map(i => `<circle cx="${300 + i * 15}" cy="${218 - i * 22}" r="4" fill="${shade(color, -0.45)}"/>`).join('')}
   <rect x="96" y="48" width="52" height="16" rx="5" fill="#b9bcc2"/><rect x="352" y="48" width="52" height="16" rx="5" fill="#b9bcc2"/>`);
}

/* ---------- suportes e foto ---------- */
function carMountArt() {
  return wrapSvg(`<defs><linearGradient id="mm1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a4c52"/><stop offset="1" stop-color="#141517"/></linearGradient></defs>${floorShadow(250, 282, 120, 12)}
   <rect x="232" y="176" width="36" height="72" rx="8" fill="#232428"/><path d="M226 240 h48 l-6 30 h-36z" fill="#1a1b1e"/>
   ${[0, 1, 2].map(i => `<rect x="${200 + i * 40}" y="250" width="20" height="26" rx="4" fill="#2c2d31"/>`).join('')}
   <circle cx="250" cy="122" r="86" fill="#0f1012"/><circle cx="250" cy="118" r="84" fill="url(#mm1)"/>
   <circle cx="250" cy="118" r="62" fill="none" stroke="#FFC800" stroke-width="3" opacity=".9"/>
   <circle cx="250" cy="118" r="44" fill="#2a2c30"/><path d="M196 70 C 220 50, 270 46, 300 66" stroke="#fff" stroke-opacity=".18" stroke-width="5" fill="none" stroke-linecap="round"/>`);
}
function deskStandArt() {
  return wrapSvg(`<defs><linearGradient id="al" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f3"/><stop offset=".5" stop-color="#a9adb4"/><stop offset="1" stop-color="#d9dce0"/></linearGradient></defs>${floorShadow(250, 270, 170, 14)}
   <path d="M120 250 L380 250 L392 262 L108 262 Z" fill="#8f939a"/><rect x="110" y="238" width="280" height="16" rx="6" fill="url(#al)"/>
   <path d="M260 244 L300 110" stroke="#8f939a" stroke-width="24" stroke-linecap="round"/><path d="M260 244 L300 110" stroke="url(#al)" stroke-width="18" stroke-linecap="round"/>
   <path d="M300 110 L220 70" stroke="#8f939a" stroke-width="22" stroke-linecap="round"/><path d="M300 110 L220 70" stroke="url(#al)" stroke-width="16" stroke-linecap="round"/>
   <circle cx="300" cy="110" r="14" fill="#7d8188"/><circle cx="260" cy="244" r="11" fill="#7d8188"/>
   <path d="M196 56 L180 102" stroke="#7d8188" stroke-width="12" stroke-linecap="round"/>`);
}
function ringArt() {
  return wrapSvg(`<defs><radialGradient id="glow"><stop offset=".6" stop-color="#fff7d1" stop-opacity=".9"/><stop offset="1" stop-color="#FFC800" stop-opacity="0"/></radialGradient></defs>${floorShadow(250, 288, 150, 10)}
   <path d="M250 190 L180 288 M250 190 L320 288 M250 190 L250 290" stroke="#1d1e21" stroke-width="7" stroke-linecap="round"/>
   <rect x="244" y="150" width="12" height="60" rx="4" fill="#2a2b2f"/>
   <circle cx="250" cy="96" r="88" fill="url(#glow)" opacity=".55"/>
   <circle cx="250" cy="96" r="70" fill="none" stroke="#1d1e21" stroke-width="20"/><circle cx="250" cy="96" r="70" fill="none" stroke="#fffdf2" stroke-width="13"/>
   <rect x="226" y="58" width="48" height="84" rx="10" fill="#141517"/><rect x="230" y="62" width="40" height="76" rx="7" fill="#2b3442"/>`);
}
function hubArt() {
  return wrapSvg(`<defs><linearGradient id="hb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a9ea6"/><stop offset=".5" stop-color="#6a6e76"/><stop offset="1" stop-color="#4b4e55"/></linearGradient><linearGradient id="metal4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".5" stop-color="#9da1a8"/><stop offset="1" stop-color="#e3e5e8"/></linearGradient></defs>${floorShadow(240, 230, 190, 16)}
   <g transform="rotate(-8 240 170)"><rect x="70" y="128" width="300" height="80" rx="20" fill="#3d4046"/><rect x="66" y="120" width="300" height="80" rx="20" fill="url(#hb)"/>
   <rect x="96" y="150" width="40" height="18" rx="3" fill="#1d1e21"/><rect x="152" y="152" width="36" height="14" rx="2" fill="#1d1e21"/><rect x="200" y="152" width="36" height="14" rx="2" fill="#1d1e21"/>${usbC(252, 154, 28, 10)}
   <circle cx="320" cy="160" r="5" fill="#FFC800"/>
   <path d="M366 160 C 410 160, 420 110, 440 100" stroke="#3d4046" stroke-width="10" fill="none" stroke-linecap="round"/></g>
   <rect x="420" y="70" width="40" height="22" rx="7" fill="#4b4e55" transform="rotate(-60 440 81)"/>`);
}

/* ---------- serviços ---------- */
function serviceArt(iconName) {
  return `<div class="svc-art">${icon(iconName, 56)}</div>`;
}

/* ---------- produto genérico (novos produtos do painel) ---------- */
function genericArt(color, sub) {
  const g = uid('gn');
  return wrapSvg(`<defs>${bodyGrad(color, g, 'diag', 1)}</defs>${floorShadow(250, 270, 140, 14)}<rect x="160" y="60" width="180" height="190" rx="28" fill="url(#${g})"/><rect x="186" y="96" width="128" height="10" rx="5" fill="#fff" opacity=".35"/><rect x="186" y="116" width="80" height="10" rx="5" fill="#fff" opacity=".25"/><circle cx="250" cy="190" r="26" fill="none" stroke="#FFC800" stroke-width="5"/>`);
}
