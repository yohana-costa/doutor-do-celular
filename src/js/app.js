/* ============ Núcleo: utilitários, estado, regras ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl = v => BRL.format(v || 0).replace(/ /g, ' ');
const brlCompact = v => v >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : 'R$ ' + Math.round(v);
const pad2 = n => String(n).padStart(2, '0');
const fmtDate = t => { const d = new Date(t); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const fmtDateTime = t => { const d = new Date(t); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const stem = w => { const syn = { capinha: 'capa', capinhas: 'capa', case: 'capa', cases: 'capa', celulares: 'celular', smartphone: 'celular', smartphones: 'celular', fones: 'fone', headphone: 'fone', vidro: 'pelicula', carregadores: 'carregador', tipo: 'usb-c', typec: 'usb-c', 'type-c': 'usb-c', usbc: 'usb-c', relogio: 'smartwatch', caixinha: 'caixa', bateria: 'power' }; w = syn[w] || w; return w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w; };
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const digits = s => String(s || '').replace(/\D/g, '');
function maskPhone(v) { const d = digits(v).slice(0, 11); if (d.length <= 2) return d.length ? `(${d}` : ''; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; }

const STORE_KEY = 'kc-doutor-demo-v3';
let S; // estado persistente
const UI = {
  cat: { group: 'all', sub: null, brand: null, q: '', brands: [], price: null, avail: false, compat: null, sort: 'rel' },
  sel: {}, pdView: {}, qty: {}, menu: false, modal: null, ck: null, svc: null, track: '', trackErr: '',
  adm: { period: '30', unit: 'all', admNav: false, drawer: null, ord: { q: '', status: 'all', unit: 'all' }, prod: { q: '', sub: 'all', brand: 'all', inactive: false }, stk: { unit: 'all', sub: 'all', sit: 'all', q: '', limit: 40 }, cli: { q: '' }, svc: { status: 'open', unit: 'all', view: 'board' }, edit: null, np: null, quote: {} },
};
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const d = JSON.parse(raw); if (d && d.v === 3) { S = d; return; } } } catch (e) { }
  S = buildSeed();
}
let saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { } }, 120); }
function resetAll() { S = buildSeed(); UI.ck = null; UI.svc = null; UI.sel = {}; UI.adm.drawer = null; save(); }

/* ---------- consultas ---------- */
const P = id => S.products.find(p => p.id === id);
const activeProducts = () => S.products.filter(p => p.active);
const stockOf = (pid, vkey, unit) => S.stock[`${pid}|${vkey}|${unit}`] || 0;
const custById = id => S.customers.find(c => c.id === id);
function unitStock(p, unit) { return variantsOf(p).reduce((s, sel) => s + stockOf(p.id, vkeyOf(p, sel), unit), 0); }
function availState(p, unit) {
  const vs = variantsOf(p).map(sel => stockOf(p.id, vkeyOf(p, sel), unit));
  if (!vs.some(q => q > 0)) return 'out';
  if (vs.filter(q => q > 0).every(q => q <= 3)) return 'low';
  return 'ok';
}
function priceRange(p) { const ps = variantsOf(p).map(s => variantPrice(p, s)); return [Math.min(...ps), Math.max(...ps)]; }
function firstColor(p) { const o = (p.options || []).find(o => o.name === 'Cor'); return o ? o.values[0].v : null; }
function cartCount() { return S.cart.reduce((s, i) => s + i.qty, 0); }
function cartLines() {
  return S.cart.map(i => { const p = P(i.pid); if (!p) return null; const sel = selFromKey(p, i.vkey); const price = variantPrice(p, sel); return { ...i, p, sel, price, sub: price * i.qty, label: variantLabel(p, sel) }; }).filter(Boolean);
}
const cartTotal = () => cartLines().reduce((s, l) => s + l.sub, 0);
const orderStatusLabel = (o, s) => { s = s || o.status; if (s === 'pronto' && o.mode === 'entrega') return 'Pronto para envio'; return (ORDER_STATUS.find(x => x.id === s) || {}).label || s; };
const orderTone = s => (ORDER_STATUS.find(x => x.id === s) || {}).tone || 'info';
const svcLabel = s => (SVC_STATUS.find(x => x.id === s) || {}).label || s;
const svcTone = s => (SVC_STATUS.find(x => x.id === s) || {}).tone || 'info';

/* ---------- regras de negócio ---------- */
function upsertCustomer(name, phone, email) {
  const d = digits(phone);
  let c = S.customers.find(x => digits(x.phone) === d);
  if (c) { c.name = name || c.name; if (email) c.email = email; }
  else { c = { id: 'c' + pad2(S.seq.customer++), name, phone: maskPhone(phone), email: email || '', createdAt: Date.now(), source: 'site' }; S.customers.push(c); }
  S.currentCustomerId = c.id;
  return c;
}
function addToCart(pid, sel, qty = 1) {
  const p = P(pid); const vkey = vkeyOf(p, sel);
  const max = stockOf(pid, vkey, S.unitId);
  const ex = S.cart.find(i => i.pid === pid && i.vkey === vkey);
  const cur = ex ? ex.qty : 0;
  const add = Math.min(qty, max - cur);
  if (add <= 0) { toast(max ? `Você já tem todo o estoque demonstrativo deste item em ${unitName(S.unitId)}.` : `Sem estoque demonstrativo em ${unitName(S.unitId)}.`, 'warn'); return false; }
  if (ex) ex.qty += add; else S.cart.push({ pid, vkey, qty: add, addedAt: Date.now() });
  save();
  toast(`${p.name} adicionado à sacola`, 'ok', { label: 'Ver sacola', to: 'sacola' });
  return true;
}
function stockShortfall(items, unit) { return items.filter(l => stockOf(l.pid, l.vkey, unit) < l.qty); }
function createOrder(ck) {
  const lines = cartLines();
  const c = upsertCustomer(ck.name.trim(), ck.phone, ck.email.trim());
  const now = Date.now();
  const num = S.seq.order++;
  const o = {
    id: 'PED-' + num, num, customerId: c.id, createdAt: now, unitId: ck.unitId, mode: ck.mode, address: ck.mode === 'entrega' ? ck.address.trim() : '', pay: ck.pay,
    items: lines.map(l => ({ pid: l.pid, vkey: l.vkey, name: l.p.name, variant: l.label, price: l.price, qty: l.qty, sku: skuOf(l.p, l.sel) })),
    total: Math.round(lines.reduce((s, l) => s + l.sub, 0) * 100) / 100, status: 'recebido', history: [{ s: 'recebido', at: now }], stockApplied: false, completedAt: null, source: 'site',
  };
  S.orders.push(o); S.cart = []; S.unitId = ck.unitId; save();
  return o;
}
/* Regra única de estoque: a baixa acontece quando o pedido chega a "Confirmado" (ou etapa posterior) e é devolvida se ele volta ou é cancelado. */
function setOrderStatus(o, s) {
  if (o.status === s) return true;
  const needs = STOCK_APPLIED.has(s);
  if (needs && !o.stockApplied) {
    const short = stockShortfall(o.items, o.unitId);
    if (short.length) { toast(`Estoque demonstrativo insuficiente em ${unitName(o.unitId)} para ${short[0].name}. Ajuste o estoque antes de confirmar.`, 'bad'); return false; }
    o.items.forEach(l => { S.stock[`${l.pid}|${l.vkey}|${o.unitId}`] -= l.qty; });
    o.stockApplied = true;
  } else if (!needs && o.stockApplied) {
    o.items.forEach(l => { S.stock[`${l.pid}|${l.vkey}|${o.unitId}`] = stockOf(l.pid, l.vkey, o.unitId) + l.qty; });
    o.stockApplied = false;
  }
  o.status = s;
  o.completedAt = s === 'concluido' ? Date.now() : null;
  o.history.push({ s, at: Date.now() });
  save();
  return true;
}
function createService(f) {
  const c = upsertCustomer(f.name.trim(), f.phone, '');
  const now = Date.now(); const num = S.seq.service++;
  const sv = { id: 'OS-' + num, num, customerId: c.id, brand: f.brand, model: f.model.trim(), service: f.service, unitId: f.unitId, status: 'recebida', createdAt: now, desc: f.desc.trim(), quote: null, history: [{ s: 'recebida', at: now }], source: 'site' };
  S.services.push(sv); save();
  return sv;
}
function setServiceStatus(sv, s) {
  if (sv.status === s) return;
  sv.status = s; sv.history.push({ s, at: Date.now() }); save();
}

/* ---------- indicadores derivados ---------- */
function periodStart(per) {
  const now = Date.now();
  if (per === 'hoje') return startOfDay(now);
  if (per === '7') return startOfDay(now - 6 * 864e5);
  if (per === '30') return startOfDay(now - 29 * 864e5);
  return Math.min(...S.orders.map(o => startOfDay(o.createdAt)), startOfDay(now));
}
function metrics(per, unit) {
  const from = periodStart(per), now = Date.now();
  const inUnit = o => unit === 'all' || o.unitId === unit;
  const done = S.orders.filter(o => inUnit(o) && o.status === 'concluido' && o.completedAt >= from);
  const revenue = done.reduce((s, o) => s + o.total, 0);
  const unitsSold = done.reduce((s, o) => s + o.items.reduce((a, l) => a + l.qty, 0), 0);
  const created = S.orders.filter(o => inUnit(o) && o.createdAt >= from);
  const open = S.orders.filter(o => inUnit(o) && ORDER_OPEN.has(o.status));
  const today = S.orders.filter(o => inUnit(o) && o.status === 'concluido' && o.completedAt >= startOfDay(now));
  const svcOpen = S.services.filter(s => (unit === 'all' || s.unitId === unit) && SVC_OPEN.has(s.status));
  const svcNew = S.services.filter(s => (unit === 'all' || s.unitId === unit) && s.createdAt >= from);
  let low = 0, out = 0;
  activeProducts().forEach(p => variantsOf(p).forEach(sel => UNITS.forEach(u => { if (unit !== 'all' && u.id !== unit) return; const q = stockOf(p.id, vkeyOf(p, sel), u.id); if (q === 0) out++; else if (q <= 3) low++; })));
  /* série */
  let series = [];
  if (per === 'hoje') {
    for (let h = 8; h < 22; h += 2) { const a = from + h * 36e5, b = a + 2 * 36e5; series.push({ label: `${pad2(h)}h`, full: `${pad2(h)}h–${pad2(h + 2)}h`, v: done.filter(o => o.completedAt >= a && o.completedAt < b).reduce((s, o) => s + o.total, 0) }); }
  } else {
    for (let t = from; t <= now; t += 864e5) { const a = startOfDay(t), b = a + 864e5; series.push({ label: fmtDate(a), full: fmtDate(a), v: done.filter(o => o.completedAt >= a && o.completedAt < b).reduce((s, o) => s + o.total, 0), today: a === startOfDay(now) }); }
  }
  const byUnit = UNITS.map(u => ({ id: u.id, name: u.name, v: S.orders.filter(o => o.unitId === u.id && o.status === 'concluido' && o.completedAt >= from).reduce((s, o) => s + o.total, 0), n: S.orders.filter(o => o.unitId === u.id && o.status === 'concluido' && o.completedAt >= from).length }));
  const prodMap = {};
  done.forEach(o => o.items.forEach(l => { prodMap[l.pid] = prodMap[l.pid] || { pid: l.pid, name: l.name, qty: 0, v: 0 }; prodMap[l.pid].qty += l.qty; prodMap[l.pid].v += l.qty * l.price; }));
  const top = Object.values(prodMap).sort((a, b) => b.qty - a.qty || b.v - a.v).slice(0, 5);
  return { from, done, revenue, unitsSold, ticket: done.length ? revenue / done.length : 0, created, open, today, todayRevenue: today.reduce((s, o) => s + o.total, 0), svcOpen, svcNew, low, out, series, byUnit, top };
}

/* ---------- arte do produto ---------- */
const AUTO_ART = { smartphones: { kind: 'phone', cam: 'sam' }, capinhas: { kind: 'case', style: 'silicone' }, peliculas: { kind: 'film', style: 'privacidade' }, carregadores: { kind: 'brick' }, cabos: { kind: 'cable', end: 'c' }, fones: { kind: 'wired' }, caixas: { kind: 'speaker' }, smartwatches: { kind: 'watch' }, pulseiras: { kind: 'band' }, powerbanks: { kind: 'bank' }, suportes: { kind: 'desk' }, veicular: { kind: 'carmount' }, foto: { kind: 'ring' }, adaptadores: { kind: 'hub' } };
function artViews(p) { const k = (p.art || {}).kind; if (k === 'phone') return ['main', 'back', 'front']; if (k === 'case') return ['main', 'flat', 'zoom']; if (k === 'film') return ['main', 'sheet']; return ['main', 'zoom']; }
const VIEW_LABEL = { main: 'Principal', back: 'Verso', front: 'Frente', flat: 'Traseira', zoom: 'Detalhe', sheet: 'Película' };
function productArt(p, sel = {}, view = 'main') {
  const a = p.art || {};
  const colorName = sel['Cor'] || firstColor(p);
  const color = colorName ? colorHex(p, colorName) : '#3b3d42';
  let svg;
  switch (a.kind) {
    case 'photo': return `<img class="${view === 'zoom' ? 'zoomed' : ''}" src="${ASSETS[a.key]}" alt="" draggable="false">`;
    case 'phone': svg = phoneArt(color, a.cam, view); break;
    case 'case': svg = caseArt(color, a.style, view === 'flat' ? 'flat' : 'main'); break;
    case 'film': svg = filmArt(a.style, view === 'sheet' ? 'sheet' : 'main'); break;
    case 'brick': svg = brickArt(color); break;
    case 'cable': svg = cableArt(color, a.end); break;
    case 'pad': svg = padArt(color); break;
    case 'bank': svg = bankArt(color).replace('10.000 mAh', esc(sel['Capacidade'] || '10.000 mAh')); break;
    case 'headphones': svg = headphonesArt(color); break;
    case 'wired': svg = wiredArt(color); break;
    case 'speaker': svg = speakerArt(color); break;
    case 'watch': svg = watchArt(color); break;
    case 'band': svg = bandArt(color); break;
    case 'carmount': svg = carMountArt(); break;
    case 'carcharger': svg = carChargerArt(); break;
    case 'ring': svg = ringArt(); break;
    case 'hub': svg = hubArt(); break;
    case 'desk': svg = deskStandArt(); break;
    default: svg = genericArt(color);
  }
  if (view === 'zoom') svg = svg.replace('viewBox="0 0 500 300"', 'viewBox="110 50 280 168"');
  return svg;
}

/* ---------- busca e filtros ---------- */
function haystack(p) {
  const opts = (p.options || []).map(o => o.values.map(v => v.v).join(' ')).join(' ');
  return norm([p.name, p.brand, p.model, subLabel(p.sub), GROUPS[p.group] && GROUPS[p.group].label, p.tags, opts, (p.compat || []).join(' ')].join(' ')).split(/[\s/·,()]+/).map(stem).join(' ');
}
function matchQuery(text, q) {
  const toks = norm(q).split(/\s+/).filter(Boolean).map(stem);
  if (!toks.length) return true;
  const hs = ' ' + text + ' ';
  return toks.every(t => hs.includes(t));
}
const PRICE_BANDS = [
  { id: 'a', label: 'Até R$ 50', min: 0, max: 50 }, { id: 'b', label: 'R$ 50 a R$ 150', min: 50, max: 150 }, { id: 'c', label: 'R$ 150 a R$ 500', min: 150, max: 500 },
  { id: 'd', label: 'R$ 500 a R$ 2.000', min: 500, max: 2000 }, { id: 'e', label: 'Acima de R$ 2.000', min: 2000, max: Infinity },
];
function filteredProducts() {
  const f = UI.cat;
  let list = activeProducts();
  if (f.group !== 'all' && f.group !== 'assistencia') list = list.filter(p => p.group === f.group);
  if (f.group === 'assistencia') list = [];
  if (f.sub) list = list.filter(p => p.sub === f.sub);
  if (f.brand) list = list.filter(p => p.brand === f.brand);
  if (f.q) list = list.filter(p => matchQuery(haystack(p), f.q));
  if (f.brands.length) list = list.filter(p => f.brands.includes(p.brand));
  if (f.price) { const b = PRICE_BANDS.find(x => x.id === f.price); list = list.filter(p => { const [mn, mx] = priceRange(p); return mx >= b.min && mn < b.max; }); }
  if (f.avail) list = list.filter(p => availState(p, S.unitId) !== 'out');
  if (f.compat) list = list.filter(p => (p.compat || []).includes(f.compat));
  const s = f.sort;
  list = list.slice();
  if (s === 'asc') list.sort((a, b) => priceRange(a)[0] - priceRange(b)[0]);
  else if (s === 'desc') list.sort((a, b) => priceRange(b)[0] - priceRange(a)[0]);
  else if (s === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  else if (s === 'new') list.sort((a, b) => (b.createdAt - a.createdAt) || (a.rank - b.rank));
  else {
    const strong = p => f.q && matchQuery(norm(p.name + ' ' + p.brand + ' ' + subLabel(p.sub)).split(/\s+/).map(stem).join(' '), f.q) ? 0 : 1;
    list.sort((a, b) => (strong(a) - strong(b)) || (a.rank - b.rank) || a.name.localeCompare(b.name, 'pt-BR'));
  }
  return list;
}
function filteredServices() {
  const f = UI.cat;
  if (f.sub || f.brand || f.brands.length || f.price || f.compat || f.avail) return [];
  if (f.group !== 'all' && f.group !== 'assistencia') return [];
  if (f.q) return SERVICES.filter(s => matchQuery(norm(s.name + ' ' + s.desc + ' assistencia conserto reparo').split(/\s+/).map(stem).join(' '), f.q));
  return f.group === 'assistencia' ? SERVICES : [];
}
function activeFilterCount() { const f = UI.cat; return f.brands.length + (f.price ? 1 : 0) + (f.avail ? 1 : 0) + (f.compat ? 1 : 0); }

/* ============ Componentes ============ */
function brand(variant) {
  if (variant === 'home') return `<a class="brand brand--stack" href="#inicio" aria-label="Doutor do Celular — Kauan Cell, início"><img src="${ASSETS.emblem}" alt=""><span class="brand__stack"><b>DOUTOR</b><b class="y">DO CELULAR</b><small>KAUAN CELL</small></span></a>`;
  return `<a class="brand brand--line" href="#inicio" aria-label="Doutor do Celular — Kauan Cell, início"><img src="${ASSETS.emblem}" alt=""><span class="brand__line"><b>Doutor do Celular</b><small>KAUAN CELL</small></span></a>`;
}
function header(variant, route) {
  const n = cartCount();
  const nav = [['inicio', 'Início'], ['loja', 'Loja'], ['loja-celulares', 'Celulares'], ['loja-acessorios', 'Acessórios'], ['assistencia', 'Assistência'], ['atendimento', 'Atendimento']];
  const cur = route.name === 'loja' ? (UI.cat.group === 'all' ? 'loja' : 'loja-' + UI.cat.group) : route.name;
  return `<header class="hd hd--${variant}">
    <div class="hd__in">
      <button class="hd__btn hd__menu" data-act="menu" aria-label="Abrir menu">${icon('menu', 26)}</button>
      ${brand(variant)}
      <nav class="hd__nav" aria-label="Principal">${nav.map(([h, l]) => `<a href="#${h}" class="${cur === h || (h === 'loja-acessorios' && route.name === 'loja' && UI.cat.group === 'acessorios') ? 'on' : ''}">${l}</a>`).join('')}</nav>
      <div class="hd__actions">
        <a class="unitchip" href="#unidades" title="Unidade selecionada">${icon('pin', 16)}<span>${esc(unitName(S.unitId))}</span>${icon('chevD', 14)}</a>
        <button class="hd__btn hd__search ${variant === 'home' ? 'only-wide' : ''}" data-act="focus-search" aria-label="Buscar produtos">${icon('search', 25)}</button>
        <a class="hd__btn hd__bag" href="#sacola" aria-label="Sacola, ${plural(n, 'item', 'itens')}">${icon('bag', 26)}${n ? `<span class="badge">${n}</span>` : ''}</a>
      </div>
    </div>
  </header>`;
}
function bottomNav(route) {
  const n = cartCount();
  const storeCtx = ['loja', 'produto', 'sacola', 'checkout', 'assistencia', 'os'].includes(route.name);
  const g = UI.cat.group;
  const items = storeCtx
    ? [['inicio', 'home', 'Início'], ['loja', 'grid', route.name === 'loja' && g !== 'all' ? GROUPS[g].label : 'Loja'], ['assistencia', 'wrench', 'Consertos'], ['sacola', 'bag', 'Sacola']]
    : [['inicio', 'home', 'Início'], ['loja', 'store', 'Loja'], ['atendimento', 'chat', 'Atendimento'], ['sacola', 'bag', 'Sacola']];
  const activeOf = h => {
    const r = route.name;
    if (h === 'inicio') return r === 'inicio';
    if (h === 'loja') return r === 'loja' || r === 'produto';
    if (h === 'assistencia') return r === 'assistencia' || r === 'os';
    if (h === 'atendimento') return ['atendimento', 'acompanhar', 'unidades', 'conta', 'pedido'].includes(r);
    if (h === 'sacola') return r === 'sacola' || r === 'checkout';
  };
  return `<nav class="bn" aria-label="Navegação inferior">${items.map(([h, ic, l]) => `<a href="#${h}" class="bn__it ${activeOf(h) ? 'on' : ''}" ${activeOf(h) ? 'aria-current="page"' : ''}><span class="bn__ic">${ic === 'grid' && activeOf(h) ? `<svg class="ic" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.6" fill="currentColor"/><rect x="13" y="4" width="7" height="7" rx="1.6" fill="currentColor"/><rect x="4" y="13" width="7" height="7" rx="1.6" fill="currentColor"/><rect x="13" y="13" width="7" height="7" rx="1.6" fill="currentColor"/></svg>` : icon(ic, 24)}${h === 'sacola' && n ? `<span class="badge">${n}</span>` : ''}</span><span class="bn__l">${l}</span></a>`).join('')}</nav>`;
}
function bagBar() {
  const n = cartCount(); if (!n) return '';
  return `<div class="bagbar" role="region" aria-label="Resumo da sacola"><div class="bagbar__in">
    <span class="bagbar__ic">${icon('bag', 26)}<span class="badge">${n}</span></span><span class="bagbar__sep"></span>
    <span class="bagbar__t"><b>${n} ${n === 1 ? 'item' : 'itens'}<span class="bb-x"> ${n === 1 ? 'selecionado' : 'selecionados'}</span></b><small>${brl(cartTotal())}</small></span>
    <a class="btn btn--y bagbar__go" href="#sacola">Ver sacola ${icon('chevR', 18)}</a></div></div>`;
}
function footer() {
  return `<footer class="ft"><div class="ft__in">
    <div class="ft__brand">${brand('line')}<p>Celulares, acessórios e assistência técnica. Unidades Itaim Paulista, Suzano e Carrão.</p></div>
    <div class="ft__cols">
      <div><h4>Loja</h4><a href="#loja-celulares">Celulares</a><a href="#loja-acessorios">Acessórios</a><a href="#loja">Todos os produtos</a><a href="#sacola">Sacola</a></div>
      <div><h4>Atendimento</h4><a href="#assistencia">Assistência técnica</a><a href="#acompanhar">Acompanhar pedido</a><a href="#unidades">Unidades</a><a href="#conta">Minha conta</a></div>
      <div><h4>Demonstração</h4><p class="ft__note">Protótipo navegável da SMG. Produtos, preços, estoques, pedidos e contatos são fictícios.</p><a href="#gestao" class="ft__adm">Área da equipe ${icon('arrowR', 14)}</a></div>
    </div></div>
    <div class="ft__base">Protótipo demonstrativo · Smart Management Group</div></footer>`;
}
function pill(label, tone) { return `<span class="st st--${tone}"><i></i>${esc(label)}</span>`; }
function availChip(p, unit) {
  const st = availState(p, unit);
  const t = { ok: 'Disponível', low: 'Últimas unidades', out: 'Indisponível aqui' }[st];
  return `<span class="av av--${st}" title="Disponibilidade demonstrativa em ${esc(unitName(unit))}"><i></i>${t}</span>`;
}
function variantSummary(p) {
  const parts = [];
  (p.options || []).forEach(o => {
    if (o.values.length < 2) return;
    if (o.name === 'Cor') parts.push(plural(o.values.length, 'cor', 'cores'));
    else if (o.name === 'Armazenamento') parts.push(plural(o.values.length, 'capacidade', 'capacidades'));
    else if (o.name === COMPAT) parts.push(plural(o.values.length, 'modelo', 'modelos'));
    else parts.push(`${o.values.length} opções de ${o.name.toLowerCase()}`);
  });
  return parts.join(' · ') || 'Opção única';
}
function productCard(p) {
  const [mn, mx] = priceRange(p);
  return `<article class="pc">
    <a class="pc__img" href="#produto-${p.id}" aria-label="Ver ${esc(p.name)}">${productArt(p, {}, 'main')}${p.isNew ? '<span class="pc__new">Novo</span>' : ''}${availChip(p, S.unitId)}</a>
    <div class="pc__body">
      <h3 class="pc__name"><a href="#produto-${p.id}">${esc(p.name)}</a></h3>
      <div class="pc__price">${mn !== mx ? '<small>a partir de</small>' : ''}<b>${brl(mn)}</b></div>
      <p class="pc__meta">${esc(variantSummary(p))}</p>
      <div class="pc__acts"><a class="btn btn--soft btn--sm" href="#produto-${p.id}">Ver opções</a>
      <button class="addbtn" data-act="quickadd" data-id="${p.id}" aria-label="Adicionar ${esc(p.name)} à sacola">${icon('plus', 26)}</button></div>
    </div></article>`;
}
function serviceCard(s) {
  return `<article class="svc"><div class="svc__ic">${icon(s.icon, 34)}</div><div class="svc__b"><span class="svc__tag">Assistência</span><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p><div class="svc__f"><span>Sob avaliação</span><button class="btn btn--y btn--sm" data-act="svc-request" data-svc="${s.name}">Solicitar</button></div></div></article>`;
}
function unitPills(cur, act, opts = {}) {
  return `<div class="units ${opts.compact ? 'units--compact' : ''} ${opts.stack ? 'units--stack' : ''}" role="radiogroup" aria-label="Unidade">${UNITS.map(u => `<button type="button" role="radio" aria-checked="${cur === u.id}" class="unit ${cur === u.id ? 'on' : ''}" data-act="${act}" data-unit="${u.id}">${icon('pin', 18)}<span>${u.name}${opts.extra ? opts.extra(u) : ''}</span></button>`).join('')}</div>`;
}
function demoNote(t) { return `<p class="demo-note">${icon('alert', 14)}${t}</p>`; }
function qtyStepper(id, q, max, act = 'qty') {
  return `<div class="qty" role="group" aria-label="Quantidade"><button type="button" data-act="${act}" data-id="${id}" data-d="-1" ${q <= 1 ? 'disabled' : ''} aria-label="Diminuir">${icon('minus', 18)}</button><output aria-live="polite">${q}</output><button type="button" data-act="${act}" data-id="${id}" data-d="1" ${q >= max ? 'disabled' : ''} aria-label="Aumentar">${icon('plus', 18)}</button></div>`;
}

/* ---------- seleção de variações ---------- */
function getSel(p) {
  if (!UI.sel[p.id]) { const s = {}; (p.options || []).forEach(o => { if (o.values.length === 1) s[o.name] = o.values[0].v; }); UI.sel[p.id] = s; }
  return UI.sel[p.id];
}
function valueAllowed(p, sel, name, value) {
  const test = { ...sel, [name]: value };
  return variantsOf(p).some(v => Object.keys(test).every(k => !test[k] || v[k] === test[k]));
}
function selComplete(p, sel) { return (p.options || []).every(o => sel[o.name]); }
function missingOpts(p, sel) { return (p.options || []).filter(o => !sel[o.name]).map(o => o.name === COMPAT ? 'o modelo' : o.name.toLowerCase()); }
function optionSelector(p, ctx = 'pd') {
  const sel = getSel(p);
  return (p.options || []).map(o => {
    const single = o.values.length === 1;
    const val = sel[o.name];
    const label = `<div class="opt__h"><span>${esc(o.name)}</span>${val ? `<b>${esc(val)}</b>` : '<em>Selecione</em>'}</div>`;
    if (single) return `<div class="opt">${label.replace('<em>Selecione</em>', '')}</div>`;
    const btns = o.values.map(v => {
      const ok = valueAllowed(p, { ...sel, [o.name]: undefined }, o.name, v.v);
      const on = val === v.v;
      const delta = v.d ? `<small>${v.d > 0 ? '+' : '−'} ${brl(Math.abs(v.d))}</small>` : '';
      if (o.type === 'color') return `<button type="button" class="sw ${on ? 'on' : ''}" ${ok ? '' : 'disabled'} data-act="pick" data-ctx="${ctx}" data-id="${p.id}" data-o="${esc(o.name)}" data-v="${esc(v.v)}" aria-pressed="${on}" title="${esc(v.v)}${ok ? '' : ' — combinação indisponível'}"><i style="background:${colorHex(p, v.v)}"></i><span>${esc(v.v)}</span></button>`;
      return `<button type="button" class="chip ${on ? 'on' : ''}" ${ok ? '' : 'disabled'} data-act="pick" data-ctx="${ctx}" data-id="${p.id}" data-o="${esc(o.name)}" data-v="${esc(v.v)}" aria-pressed="${on}" title="${ok ? '' : 'Combinação indisponível nesta configuração'}">${esc(v.v)}${delta}</button>`;
    }).join('');
    return `<div class="opt">${label}<div class="opt__vals ${o.type === 'color' ? 'opt__vals--sw' : ''}">${btns}</div></div>`;
  }).join('');
}

/* ============ Telas da loja ============ */
function viewHome() {
  const feat = ['p01', 'a01', 'a08', 'a14', 'p05', 'a17', 'a05', 'a18'].map(P).filter(p => p && p.active);
  return `<section class="hero"><div class="hero__in">
      <div class="hero__txt">
        <span class="locpill">${icon('pin', 15)}CIDADE NOBRE · CONEXÃO DE RESPEITO</span>
        <h1>O DOUTOR<br>DO SEU PRÓXIMO<br><span class="y">UPGRADE.</span></h1>
        <p>Celulares, acessórios e cuidado especializado. Tudo em um só lugar.</p>
        <div class="hero__ctas"><a class="btn btn--y btn--lg" href="#loja">Explorar a loja ${icon('arrowR', 20)}</a><a class="btn btn--outline btn--lg" href="#atendimento">Falar com o Doutor ${icon('chat', 20)}</a></div>
      </div>
      <div class="hero__art"><img src="${ASSETS.hero}" alt="Smartphones, fones, relógio e capinhas em vitrine iluminada"></div>
    </div></section>
    <section class="sec sec--white"><div class="wrap">
      <h2 class="sec__title">QUAL É O SEU PRÓXIMO <span class="y">UPGRADE?</span></h2>
      <div class="cats">
        ${[['loja-celulares', 'Celulares', ASSETS.cat_cel], ['loja-acessorios', 'Acessórios', ASSETS.cat_ace], ['assistencia', 'Assistência', ASSETS.cat_ast]].map(([h, l, img]) => `<a class="catc" href="#${h}"><span class="catc__img" style="background-image:url('${img}')"></span><span class="catc__l">${l}<i>${icon('chevR', 16)}</i></span></a>`).join('')}
      </div>
      <a class="banner" href="#loja">
        <span class="banner__l" style="background-image:url('${ASSETS.ban_left}')"></span>
        <span class="banner__t"><b>DA NOSSA</b><b class="y">COMUNIDADE</b><b>PARA O SEU DIA A DIA.</b><small>Conheça a Doutor do Celular.</small><span class="btn btn--y btn--sm">Conhecer a loja ${icon('arrowR', 16)}</span></span>
        <span class="banner__r" style="background-image:url('${ASSETS.ban_right}')"></span>
      </a>
      <div class="unitsel"><h3>ESCOLHA SUA UNIDADE</h3>${unitPills(S.unitId, 'set-unit')}</div>
    </div></section>
    <section class="sec sec--paper"><div class="wrap">
      <div class="sec__head"><h2 class="sec__t2">Mais procurados</h2><a href="#loja" class="lnk">Ver toda a loja ${icon('arrowR', 16)}</a></div>
      <div class="grid grid--home">${feat.map(productCard).join('')}</div>
      <p class="tiny-note">Produtos e preços ilustrativos</p>
    </div></section>
    <section class="sec sec--dark"><div class="wrap astband">
      <div><span class="eyebrow">ASSISTÊNCIA TÉCNICA</span><h2>Seu celular deu problema?</h2><p>Conte o que aconteceu, escolha a unidade e acompanhe cada etapa da sua solicitação.</p><div class="row"><a class="btn btn--y" href="#assistencia">Solicitar orçamento ${icon('arrowR', 18)}</a><a class="btn btn--outline" href="#acompanhar">Acompanhar solicitação</a></div></div>
      <ul class="astband__list">${SERVICES.slice(0, 6).map(s => `<li>${icon(s.icon, 22)}<span>${s.name}</span></li>`).join('')}</ul>
    </div></section>`;
}

function viewCatalog() {
  const f = UI.cat;
  const prods = filteredProducts(), svcs = filteredServices();
  const g = f.group;
  const title = g === 'acessorios' ? 'Acessórios para o seu dia.' : g === 'celulares' ? 'Celulares para o seu próximo upgrade.' : g === 'assistencia' ? 'Assistência para o seu aparelho.' : 'Tudo para o seu celular.';
  let pills;
  if (g === 'celulares') pills = [[null, 'Todos'], ...PHONE_BRANDS.map(b => ['brand:' + b, b])];
  else if (g === 'acessorios') pills = [[null, 'Todos'], ...SUBS.filter(s => s.group === 'acessorios').map(s => [s.id, s.label])];
  else if (g === 'assistencia') pills = [];
  else pills = [[null, 'Todos'], ...SUBS.map(s => [s.id, s.label]), ['grp:assistencia', 'Assistência']];
  const curPill = f.brand ? 'brand:' + f.brand : f.sub;
  return `<div class="cat-page"><div class="wrap">
    <div class="cat-head"><div><h1 class="ptitle">${title}</h1><p class="psub">Escolha seus favoritos e monte seu pedido.</p></div>
      ${g !== 'all' ? `<a class="lnk lnk--muted" href="#loja" data-act="cat-all">Ver toda a loja ${icon('arrowR', 15)}</a>` : ''}</div>
    <label class="searchbox" for="q"><span>${icon('search', 24)}</span><input id="q" type="search" placeholder="O que você procura?" value="${esc(f.q)}" data-in="cat-q" autocomplete="off" enterkeyhint="search"><button type="button" class="searchbox__x" data-act="clear-q" aria-label="Limpar busca" ${f.q ? '' : 'hidden'}>${icon('x', 18)}</button></label>
    ${pills.length ? `<div class="pills" role="tablist" aria-label="Categorias">${pills.map(([id, l]) => `<button role="tab" aria-selected="${curPill === id}" class="pillb ${curPill === id ? 'on' : ''}" data-act="cat-pill" data-p="${id || ''}">${l}</button>`).join('')}</div>` : ''}
    <div class="cat-body">
      <aside class="filters-side" aria-label="Filtros">${filterPanel()}</aside>
      <div class="cat-main" id="cat-results">${catalogResults(prods, svcs)}</div>
    </div>
  </div></div>`;
}
function catalogResults(prods, svcs) {
  prods = prods || filteredProducts(); svcs = svcs || filteredServices();
  const f = UI.cat, n = prods.length + svcs.length;
  const fc = activeFilterCount();
  const toolbar = `<div class="toolbar"><button class="btn btn--soft btn--sm filters-btn" data-act="open-filters">${icon('filter', 18)}Filtros${fc ? ` <span class="cnt">${fc}</span>` : ''}</button>
    <span class="toolbar__n" aria-live="polite">${plural(n, 'resultado', 'resultados')}</span>
    <label class="sortsel"><span>Ordenar</span><select id="sort" data-in="cat-sort"><option value="rel" ${f.sort === 'rel' ? 'selected' : ''}>Relevância</option><option value="asc" ${f.sort === 'asc' ? 'selected' : ''}>Menor preço</option><option value="desc" ${f.sort === 'desc' ? 'selected' : ''}>Maior preço</option><option value="name" ${f.sort === 'name' ? 'selected' : ''}>Nome (A–Z)</option><option value="new" ${f.sort === 'new' ? 'selected' : ''}>Novidades</option></select></label></div>`;
  const chips = [];
  if (f.q) chips.push(['q', `“${f.q}”`]);
  f.brands.forEach(b => chips.push(['brand:' + b, b]));
  if (f.price) chips.push(['price', PRICE_BANDS.find(b => b.id === f.price).label]);
  if (f.avail) chips.push(['avail', 'Disponível em ' + unitName(S.unitId)]);
  if (f.compat) chips.push(['compat', 'Compatível: ' + f.compat]);
  const chipRow = chips.length ? `<div class="fchips">${chips.map(([k, l]) => `<button class="fchip" data-act="rm-filter" data-k="${esc(k)}">${esc(l)}${icon('x', 14)}</button>`).join('')}<button class="lnk lnk--muted" data-act="clear-filters">Limpar tudo</button></div>` : '';
  if (!n) {
    return toolbar + chipRow + `<div class="empty"><div class="empty__ic">${icon('search', 34)}</div><h3>Nenhum resultado${f.q ? ` para “${esc(f.q)}”` : ''}</h3><p>Tente outro termo ou remova alguns filtros.</p><div class="row row--c"><button class="btn btn--y btn--sm" data-act="clear-filters">Limpar busca e filtros</button></div><div class="sugg">${['capinha', 'carregador USB-C', 'iPhone', 'Samsung', 'fone Bluetooth'].map(s => `<button class="pillb" data-act="sugg" data-q="${s}">${s}</button>`).join('')}</div></div>`;
  }
  return toolbar + chipRow + `<div class="grid">${prods.map(productCard).join('')}</div>` +
    (svcs.length ? `${prods.length ? '<h3 class="grid-sep">Serviços de assistência <small>exemplos — catálogo real a confirmar com a loja</small></h3>' : ''}<div class="grid grid--svc">${svcs.map(serviceCard).join('')}</div>` : '') +
    `<p class="tiny-note">Produtos e preços ilustrativos · disponibilidade demonstrativa para ${esc(unitName(S.unitId))}</p>`;
}
function filterPanel() {
  const f = UI.cat;
  const brands = [...new Set(activeProducts().filter(p => f.group === 'all' || p.group === f.group).map(p => p.brand))];
  return `<div class="fp">
    <div class="fp__g"><h4>Marca</h4><div class="fp__chips">${brands.map(b => `<button class="chip ${f.brands.includes(b) ? 'on' : ''}" data-act="f-brand" data-v="${esc(b)}" aria-pressed="${f.brands.includes(b)}">${esc(b === 'Diversas' ? 'Diversas (acessórios)' : b)}</button>`).join('')}</div></div>
    <div class="fp__g"><h4>Faixa de preço</h4><div class="fp__list">${PRICE_BANDS.map(b => `<button class="radio ${f.price === b.id ? 'on' : ''}" data-act="f-price" data-v="${b.id}" aria-pressed="${f.price === b.id}"><i></i>${b.label}</button>`).join('')}</div></div>
    <div class="fp__g"><h4>Disponibilidade</h4><button class="switch ${f.avail ? 'on' : ''}" data-act="f-avail" aria-pressed="${f.avail}"><i></i>Somente disponíveis em ${esc(unitName(S.unitId))}</button></div>
    <div class="fp__g"><h4>Compatibilidade</h4><div class="fp__chips">${COMPAT_FAMS.map(c => `<button class="chip ${f.compat === c ? 'on' : ''}" data-act="f-compat" data-v="${c}" aria-pressed="${f.compat === c}">${c}</button>`).join('')}</div><p class="fp__hint">Aplica-se a acessórios. Compatibilidades são demonstrativas.</p></div>
  </div>`;
}

function viewProduct(id) {
  const p = P(id);
  if (!p || !p.active) return `<div class="wrap pagepad"><div class="empty"><h3>Produto não encontrado</h3><p>Ele pode ter sido desativado no painel de gestão.</p><a class="btn btn--y" href="#loja">Voltar para a loja</a></div></div>`;
  const sel = getSel(p);
  const complete = selComplete(p, sel);
  const vkey = complete ? vkeyOf(p, sel) : null;
  const unitQty = complete ? stockOf(p.id, vkey, S.unitId) : unitStock(p, S.unitId);
  const inCart = complete ? (S.cart.find(i => i.pid === p.id && i.vkey === vkey) || { qty: 0 }).qty : 0;
  const maxAdd = complete ? Math.max(0, unitQty - inCart) : 0;
  const q = Math.max(1, Math.min(UI.qty[p.id] || 1, maxAdd || 1));
  const price = complete ? variantPrice(p, sel) : priceRange(p)[0];
  const views = artViews(p);
  const view = views.includes(UI.pdView[p.id]) ? UI.pdView[p.id] : 'main';
  let cta, state;
  if (!complete) { cta = `Selecione ${missingOpts(p, sel).join(' e ')}`; state = 'disabled'; }
  else if (unitQty === 0) { cta = `Indisponível em ${unitName(S.unitId)}`; state = 'disabled'; }
  else if (maxAdd === 0) { cta = 'Todo o estoque já está na sacola'; state = 'disabled'; }
  else { cta = `Adicionar à sacola · ${brl(price * q)}`; state = ''; }
  const units = UNITS.map(u => {
    const qn = complete ? stockOf(p.id, vkey, u.id) : unitStock(p, u.id);
    const st = qn === 0 ? 'out' : qn <= 3 ? 'low' : 'ok';
    return `<li class="${u.id === S.unitId ? 'cur' : ''}"><span>${icon('pin', 16)}${u.name}</span><span class="av av--${st}"><i></i>${qn === 0 ? 'Indisponível' : qn <= 3 ? `Últimas ${qn} un.` : `${qn} un.`}</span>${u.id !== S.unitId && qn > 0 ? `<button class="lnk" data-act="set-unit" data-unit="${u.id}">Escolher</button>` : u.id === S.unitId ? '<em>Selecionada</em>' : '<span></span>'}</li>`;
  }).join('');
  const related = relatedProducts(p);
  const specs = [['Marca', p.brand === 'Diversas' ? 'A definir pela loja' : p.brand], ['Modelo', p.model], ...(p.specs || [])];
  (p.options || []).forEach(o => { if (o.name !== COMPAT) specs.push([o.name, sel[o.name] || o.values.map(v => v.v).join(', ')]); });
  if (complete) specs.push(['Código (SKU)', skuOf(p, sel)]);
  const compatOpt = (p.options || []).find(o => o.name === COMPAT);
  return `<div class="pd-page"><div class="wrap">
    <nav class="crumbs" aria-label="Você está em"><a href="#loja" data-act="back-store">${icon('chevL', 16)}Loja</a><span>/</span><a href="#loja-${p.group}">${GROUPS[p.group].label}</a><span>/</span><span>${esc(subLabel(p.sub))}</span></nav>
    <div class="pd">
      <div class="pd__gal">
        <div class="pd__main ${view === 'zoom' ? 'is-zoom' : ''}">${productArt(p, sel, view)}${p.isNew ? '<span class="pc__new">Novo</span>' : ''}</div>
        <div class="pd__thumbs" role="tablist" aria-label="Imagens">${views.map(v => `<button role="tab" aria-selected="${v === view}" class="${v === view ? 'on' : ''}" data-act="pd-view" data-id="${p.id}" data-v="${v}" aria-label="${VIEW_LABEL[v]}">${productArt(p, sel, v)}<span>${VIEW_LABEL[v]}</span></button>`).join('')}</div>
      </div>
      <div class="pd__info">
        <p class="pd__brand">${esc(p.brand === 'Diversas' ? subLabel(p.sub) : p.brand)} · ${esc(p.model)}</p>
        <h1 class="pd__name">${esc(p.name)}</h1>
        <div class="pd__price">${!complete && priceRange(p)[0] !== priceRange(p)[1] ? '<small>a partir de</small>' : ''}<b>${brl(price)}</b><span class="tag-demo">preço demonstrativo</span></div>
        <div class="pd__opts">${optionSelector(p, 'pd')}${Object.keys(sel).length && (p.options || []).some(o => o.values.length > 1 && sel[o.name]) ? `<button class="lnk lnk--muted" data-act="clear-sel" data-id="${p.id}">Limpar seleção</button>` : ''}</div>
        <div class="pd__unit"><div class="opt__h"><span>Unidade</span><b>${esc(unitName(S.unitId))}</b></div>${unitPills(S.unitId, 'set-unit', { compact: true })}</div>
        <div class="pd__buy">
          ${complete && maxAdd > 0 ? qtyStepper(p.id, q, maxAdd, 'pd-qty') : ''}
          <button class="btn btn--y btn--lg btn--block" data-act="pd-add" data-id="${p.id}" ${state}>${state ? '' : icon('bag', 20)}${cta}</button>
        </div>
        <ul class="pd__stock" aria-label="Estoque por unidade">${units}</ul>
        <p class="fine">${complete ? 'Estoque da variação escolhida' : 'Estoque somando todas as variações'} · dados fictícios</p>
        <div class="pd__ship"><div>${icon('store', 22)}<p><b>Retirada na unidade</b><span>Escolha a unidade no checkout. Disponibilidade demonstrativa.</span></p></div><div>${icon('truck', 22)}<p><b>Entrega</b><span>Área, prazo e valor a configurar pela loja.</span></p></div></div>
      </div>
    </div>
    <div class="pd__more">
      <section><h2>Descrição</h2><p>${esc(p.desc)}</p>${compatOpt ? `<h3>Compatibilidade</h3><div class="compat">${compatOpt.values.map(v => `<span class="${sel[COMPAT] === v.v ? 'on' : ''}">${icon('phone', 15)}${esc(v.v)}</span>`).join('')}</div><p class="fine">Lista demonstrativa. Confirme a compatibilidade com a loja antes da compra.</p>` : (p.compat && p.group !== 'celulares' ? `<h3>Compatibilidade</h3><p class="fine">${esc((p.specs.find(s => s[0] === 'Compatibilidade') || [0, 'Conforme especificação, a validar com a loja'])[1])}</p>` : '')}</section>
      <section><h2>Especificações</h2><dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><p class="fine">Especificações demonstrativas, sujeitas a validação.</p></section>
    </div>
    ${related.length ? `<section class="related"><h2 class="sec__t2">${p.group === 'celulares' ? 'Combina com o seu ' + esc(p.model) : 'Você também pode gostar'}</h2><div class="grid">${related.map(productCard).join('')}</div></section>` : ''}
  </div></div>`;
}
function relatedProducts(p) {
  if (p.group === 'celulares') return activeProducts().filter(x => (x.options || []).some(o => o.name === COMPAT && o.values.some(v => v.v === p.model))).slice(0, 4);
  return activeProducts().filter(x => x.id !== p.id && x.group === 'acessorios' && (x.sub === p.sub || (p.compat || []).some(c => (x.compat || []).includes(c)))).sort((a, b) => (a.sub === p.sub ? -1 : 1) - (b.sub === p.sub ? -1 : 1) || a.rank - b.rank).slice(0, 4);
}

function viewBag() {
  const lines = cartLines();
  if (!lines.length) return `<div class="wrap pagepad"><h1 class="ptitle">Sua sacola</h1><div class="empty"><div class="empty__ic">${icon('bag', 36)}</div><h3>Sua sacola está vazia</h3><p>Adicione celulares e acessórios para montar seu pedido.</p><a class="btn btn--y" href="#loja">Continuar comprando ${icon('arrowR', 18)}</a></div></div>`;
  const n = cartCount();
  return `<div class="wrap pagepad"><div class="cart-head"><h1 class="ptitle">Sua sacola</h1><span class="muted">${plural(n, 'item', 'itens')}</span></div>
  <div class="cart">
    <ul class="cart__list">${lines.map(l => {
      const stock = stockOf(l.pid, l.vkey, S.unitId);
      return `<li class="ci"><a class="ci__img" href="#produto-${l.pid}">${productArt(l.p, l.sel, 'main')}</a>
        <div class="ci__b"><div class="ci__top"><div><a class="ci__name" href="#produto-${l.pid}">${esc(l.p.name)}</a><p class="ci__var">${esc(l.label)}</p></div><button class="iconbtn" data-act="cart-rm" data-k="${l.pid}::${esc(l.vkey)}" aria-label="Remover ${esc(l.p.name)}">${icon('trash', 19)}</button></div>
        <div class="ci__bot">${qtyStepper(`${l.pid}::${l.vkey}`, l.qty, Math.max(l.qty, stock), 'cart-qty')}<div class="ci__pr"><small>${brl(l.price)} cada</small><b>${brl(l.sub)}</b></div></div>
        ${stock < l.qty ? `<p class="warnline">${icon('alert', 15)}Sem estoque suficiente em ${esc(unitName(S.unitId))} (${stock} un.). Você pode escolher outra unidade no checkout.</p>` : ''}</div></li>`;
    }).join('')}</ul>
    <aside class="summary"><h2>Resumo</h2>
      <dl><div><dt>Itens</dt><dd>${n}</dd></div><div><dt>Subtotal</dt><dd>${brl(cartTotal())}</dd></div><div><dt>Retirada ou entrega</dt><dd>A definir</dd></div></dl>
      <div class="summary__tot"><span>Total demonstrativo</span><b>${brl(cartTotal())}</b></div>
      <a class="btn btn--y btn--lg btn--block" href="#checkout">Ir para o checkout ${icon('arrowR', 18)}</a>
      <a class="btn btn--soft btn--block" href="#loja">Continuar comprando</a>
      ${demoNote('Valores ilustrativos. Nenhuma cobrança é feita neste protótipo.')}
    </aside>
  </div></div>`;
}

/* ---------- checkout ---------- */
function ensureCk() { if (!UI.ck) UI.ck = { step: 1, name: '', phone: '', email: '', unitId: S.unitId, mode: 'retirada', address: '', pay: 'pix', err: {} }; return UI.ck; }
function validateStep(ck, step) {
  const err = {};
  if (step === 2) {
    if (ck.name.trim().length < 3) err.name = 'Informe o nome completo.';
    const d = digits(ck.phone); if (d.length < 10 || d.length > 11) err.phone = 'Informe um telefone com DDD, como (11) 90000-0000.';
    if (ck.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ck.email.trim())) err.email = 'E-mail inválido. Deixe em branco se preferir.';
  }
  if (step === 3) {
    if (stockShortfall(cartLines(), ck.unitId).length) err.unit = 'Há itens sem estoque demonstrativo nesta unidade. Escolha outra unidade ou ajuste a sacola.';
    if (ck.mode === 'entrega' && ck.address.trim().length < 6) err.address = 'Informe o endereço para a entrega demonstrativa.';
  }
  ck.err = err; return !Object.keys(err).length;
}
const PAY = { pix: 'Pix', cartao: 'Cartão (crédito ou débito)', retirada: 'Pagar na retirada' };
function viewCheckout() {
  const lines = cartLines();
  if (!lines.length) return `<div class="wrap pagepad"><h1 class="ptitle">Checkout</h1><div class="empty"><div class="empty__ic">${icon('bag', 36)}</div><h3>Sua sacola está vazia</h3><p>Adicione produtos para concluir um pedido demonstrativo.</p><a class="btn btn--y" href="#loja">Explorar a loja</a></div></div>`;
  const ck = ensureCk();
  const steps = ['Revisão', 'Seus dados', 'Unidade', 'Pagamento'];
  const fe = k => ck.err[k] ? `<p class="ferr" id="err-${k}">${ck.err[k]}</p>` : '';
  let body = '';
  if (ck.step === 1) {
    body = `<h2>Revise sua sacola</h2><ul class="mini">${lines.map(l => `<li><span class="mini__img">${productArt(l.p, l.sel)}</span><span class="mini__t"><b>${esc(l.p.name)}</b><small>${esc(l.label)} · ${l.qty} × ${brl(l.price)}</small></span><b>${brl(l.sub)}</b></li>`).join('')}</ul><a class="lnk" href="#sacola">Alterar itens ou quantidades</a>`;
  } else if (ck.step === 2) {
    const quick = custById('c01');
    body = `<h2>Seus dados</h2><p class="muted">Usados apenas para identificar o pedido nesta demonstração.</p>
      <div class="form">
        <div class="field ${ck.err.name ? 'bad' : ''}"><label for="ck-name">Nome completo *</label><input id="ck-name" data-in="ck.name" value="${esc(ck.name)}" autocomplete="name" ${ck.err.name ? 'aria-invalid="true" aria-describedby="err-name"' : ''}>${fe('name')}</div>
        <div class="field ${ck.err.phone ? 'bad' : ''}"><label for="ck-phone">Telefone com DDD *</label><input id="ck-phone" data-in="ck.phone" data-mask="phone" inputmode="tel" value="${esc(ck.phone)}" placeholder="(11) 90000-0000" ${ck.err.phone ? 'aria-invalid="true" aria-describedby="err-phone"' : ''}>${fe('phone')}</div>
        <div class="field ${ck.err.email ? 'bad' : ''}"><label for="ck-email">E-mail <span class="opt-l">opcional</span></label><input id="ck-email" data-in="ck.email" type="email" inputmode="email" value="${esc(ck.email)}" placeholder="nome@exemplo.com">${fe('email')}</div>
      </div>
      ${quick ? `<button class="lnk lnk--muted" data-act="ck-quickfill">Preencher com cliente fictício (${esc(quick.name)})</button>` : ''}`;
  } else if (ck.step === 3) {
    const extra = u => { const short = stockShortfall(lines, u.id).length; return `<small class="${short ? 'bad' : 'ok'}">${short ? plural(short, 'item sem estoque', 'itens sem estoque') : 'Todos os itens disponíveis'}</small>`; };
    body = `<h2>Unidade e modalidade</h2>
      <div class="opt__h"><span>Unidade</span><b>${esc(unitName(ck.unitId))}</b></div>${unitPills(ck.unitId, 'ck-unit', { extra, stack: true })}${fe('unit')}
      <div class="opt__h" style="margin-top:20px"><span>Modalidade</span></div>
      <div class="choice">
        <button class="choice__it ${ck.mode === 'retirada' ? 'on' : ''}" data-act="ck-mode" data-v="retirada" aria-pressed="${ck.mode === 'retirada'}">${icon('store', 24)}<span><b>Retirada na unidade</b><small>Retire em ${esc(unitName(ck.unitId))}. Horários a configurar.</small></span></button>
        <button class="choice__it ${ck.mode === 'entrega' ? 'on' : ''}" data-act="ck-mode" data-v="entrega" aria-pressed="${ck.mode === 'entrega'}">${icon('truck', 24)}<span><b>Entrega <em>demonstrativa</em></b><small>Área, prazo e valor a definir pela loja.</small></span></button>
      </div>
      ${ck.mode === 'entrega' ? `<div class="field ${ck.err.address ? 'bad' : ''}"><label for="ck-address">Endereço de entrega *</label><input id="ck-address" data-in="ck.address" value="${esc(ck.address)}" placeholder="Rua, número e bairro">${fe('address')}</div>` : ''}`;
  } else {
    body = `<h2>Pagamento</h2><p class="muted">Opções ilustrativas. Nenhum dado de cartão ou banco é solicitado e nenhuma cobrança acontece.</p>
      <div class="choice">${Object.entries(PAY).map(([k, l]) => `<button class="choice__it ${ck.pay === k ? 'on' : ''}" data-act="ck-pay" data-v="${k}" aria-pressed="${ck.pay === k}">${icon(k === 'pix' ? 'spark' : k === 'cartao' ? 'receipt' : 'store', 24)}<span><b>${l}</b><small>${k === 'retirada' ? 'Pagamento combinado na unidade' : 'Forma de pagamento a confirmar pela loja'}</small></span></button>`).join('')}</div>
      <div class="review"><div><span>Cliente</span><b>${esc(ck.name)}</b><small>${esc(ck.phone)}${ck.email ? ' · ' + esc(ck.email) : ''}</small></div><div><span>Unidade</span><b>${esc(unitName(ck.unitId))}</b><small>${ck.mode === 'retirada' ? 'Retirada na unidade' : 'Entrega demonstrativa · ' + esc(ck.address)}</small></div></div>`;
  }
  const nav = `<div class="ck__nav">${ck.step > 1 ? `<button class="btn btn--soft" data-act="ck-back">${icon('chevL', 18)}Voltar</button>` : '<a class="btn btn--soft" href="#sacola">Voltar à sacola</a>'}
    ${ck.step < 4 ? `<button class="btn btn--y" data-act="ck-next">Continuar ${icon('arrowR', 18)}</button>` : `<button class="btn btn--y" data-act="ck-confirm">${icon('check', 18)}Confirmar pedido demonstrativo</button>`}</div>`;
  return `<div class="wrap pagepad"><h1 class="ptitle">Checkout</h1>
    <ol class="stepper">${steps.map((s, i) => `<li class="${i + 1 < ck.step ? 'done' : i + 1 === ck.step ? 'cur' : ''}"><span>${i + 1 < ck.step ? icon('check', 14) : i + 1}</span><em>${s}</em></li>`).join('')}<li><span>5</span><em>Confirmação</em></li></ol>
    <div class="ck"><div class="ck__main card">${body}${nav}</div>
      <aside class="summary summary--ck"><h2>Seu pedido</h2><ul class="mini mini--s">${lines.map(l => `<li><span class="mini__t"><b>${l.qty}× ${esc(l.p.name)}</b><small>${esc(l.label)}</small></span><b>${brl(l.sub)}</b></li>`).join('')}</ul>
      <div class="summary__tot"><span>Total demonstrativo</span><b>${brl(cartTotal())}</b></div>${demoNote('Pedido fictício: não gera cobrança nem é enviado à loja.')}</aside>
    </div></div>`;
}

/* ---------- pedido / acompanhamento ---------- */
function timeline(flow, cur, history, labelFn, cancelled) {
  const reached = new Set(history.map(h => h.s));
  const curIdx = flow.indexOf(cur);
  const items = cancelled ? [...flow.filter(s => reached.has(s)), 'cancelado'] : flow;
  return `<ol class="tl">${items.map((s, i) => {
    const h = [...history].reverse().find(x => x.s === s);
    const state = cancelled ? (s === 'cancelado' ? 'bad' : 'done') : (i < curIdx ? 'done' : i === curIdx ? 'cur' : '');
    return `<li class="tl__it ${state}"><span class="tl__dot">${state === 'done' ? icon('check', 13) : state === 'bad' ? icon('x', 13) : ''}</span><span class="tl__t"><b>${labelFn(s)}</b>${h ? `<small>${fmtDateTime(h.at)}</small>` : ''}</span></li>`;
  }).join('')}</ol>`;
}
function viewOrder(num) {
  const o = S.orders.find(x => String(x.num) === String(num));
  if (!o) return `<div class="wrap pagepad"><div class="empty"><h3>Pedido não encontrado</h3><p>Confira o código e tente de novo.</p><a class="btn btn--y" href="#acompanhar">Acompanhar outro código</a></div></div>`;
  const c = custById(o.customerId);
  const fresh = o.source === 'site' && Date.now() - o.createdAt < 10 * 60e3 && o.status === 'recebido';
  const flow = ['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto', 'concluido'];
  return `<div class="wrap pagepad narrow">
    ${fresh ? `<div class="okhero"><span class="okhero__ic">${icon('check', 34)}</span><div><h1>Pedido demonstrativo registrado</h1><p>Ele existe apenas neste protótipo. Nenhum pagamento foi processado e a loja não foi notificada.</p></div></div>` : `<h1 class="ptitle">Acompanhar pedido</h1>`}
    <div class="card od">
      <div class="od__head"><div><span class="muted">Pedido</span><h2 class="mono">${o.id}</h2><small class="muted">Criado em ${fmtDateTime(o.createdAt)}</small></div>${pill(orderStatusLabel(o), orderTone(o.status))}</div>
      ${timeline(flow, o.status, o.history, s => orderStatusLabel(o, s), o.status === 'cancelado')}
      <p class="fine">Status demonstrativos, alterados pela equipe no painel de gestão do protótipo.</p>
    </div>
    <div class="card od"><h3>Itens</h3><ul class="mini">${o.items.map(l => { const p = P(l.pid); return `<li><span class="mini__img">${p ? productArt(p, selFromKey(p, l.vkey)) : ''}</span><span class="mini__t"><b>${esc(l.name)}</b><small>${esc(l.variant)} · ${l.qty} × ${brl(l.price)}</small></span><b>${brl(l.price * l.qty)}</b></li>`; }).join('')}</ul>
      <div class="summary__tot"><span>Total demonstrativo</span><b>${brl(o.total)}</b></div></div>
    <div class="card od od--grid">
      <div><span>Cliente</span><b>${esc(c ? c.name : '—')}</b><small>${esc(c ? c.phone : '')}${c && c.email ? ' · ' + esc(c.email) : ''}</small></div>
      <div><span>Unidade</span><b>${esc(unitName(o.unitId))}</b><small>${o.mode === 'retirada' ? 'Retirada na unidade' : 'Entrega demonstrativa'}</small></div>
      ${o.mode === 'entrega' ? `<div><span>Endereço</span><b>${esc(o.address)}</b><small>Área e prazo a configurar</small></div>` : ''}
      <div><span>Pagamento</span><b>${esc(PAY[o.pay] || o.pay)}</b><small>Ilustrativo, sem cobrança</small></div>
    </div>
    <div class="row row--c"><a class="btn btn--y" href="#loja">Voltar à loja</a><a class="btn btn--soft" href="#conta">Ver meus pedidos</a></div>
  </div>`;
}
function viewServiceDetail(num) {
  const sv = S.services.find(x => String(x.num) === String(num));
  if (!sv) return `<div class="wrap pagepad"><div class="empty"><h3>Solicitação não encontrada</h3><p>Confira o código e tente de novo.</p><a class="btn btn--y" href="#acompanhar">Acompanhar outro código</a></div></div>`;
  const c = custById(sv.customerId);
  const fresh = sv.source === 'site' && Date.now() - sv.createdAt < 10 * 60e3 && sv.status === 'recebida';
  const flow = SVC_STATUS.map(s => s.id).filter(s => s !== 'cancelado');
  return `<div class="wrap pagepad narrow">
    ${fresh ? `<div class="okhero"><span class="okhero__ic">${icon('check', 34)}</span><div><h1>Solicitação demonstrativa enviada</h1><p>Registro criado apenas neste protótipo. O aparelho ainda não foi entregue nem avaliado pela loja.</p></div></div>` : `<h1 class="ptitle">Acompanhar assistência</h1>`}
    <div class="card od">
      <div class="od__head"><div><span class="muted">Solicitação</span><h2 class="mono">${sv.id}</h2><small class="muted">Aberta em ${fmtDateTime(sv.createdAt)} · ${esc(unitName(sv.unitId))}</small></div>${pill(svcLabel(sv.status), svcTone(sv.status))}</div>
      ${timeline(flow, sv.status, sv.history, svcLabel, sv.status === 'cancelado')}
      <p class="fine">Status ilustrativos. Não representam o andamento real de uma assistência.</p>
    </div>
    ${sv.quote ? `<div class="card od quote"><div><span class="muted">Orçamento demonstrativo</span><b>${brl(sv.quote.value)}</b><small>${esc(sv.quote.note || '')}</small></div><p class="fine">Valor ilustrativo, sem validade comercial. A aprovação acontece diretamente com a loja.</p></div>` : ''}
    <div class="card od od--grid">
      <div><span>Aparelho</span><b>${esc(sv.brand)} ${esc(sv.model)}</b><small>${esc(sv.service)}</small></div>
      <div><span>Cliente</span><b>${esc(c ? c.name : '—')}</b><small>${esc(c ? c.phone : '')}</small></div>
      <div class="span2"><span>Descrição do defeito</span><p>${esc(sv.desc)}</p></div>
    </div>
    <div class="row row--c"><a class="btn btn--y" href="#assistencia">Nova solicitação</a><a class="btn btn--soft" href="#conta">Ver minhas solicitações</a></div>
  </div>`;
}

/* ---------- assistência ---------- */
function ensureSvc() { if (!UI.svc) UI.svc = { name: '', phone: '', brand: '', model: '', service: '', desc: '', unitId: S.unitId, err: {}, pick: null }; return UI.svc; }
const MODEL_HINTS = { Apple: ['iPhone 16', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11'], Samsung: ['Galaxy S24 FE', 'Galaxy A55 5G', 'Galaxy A34', 'Galaxy A15', 'Galaxy S21 FE'], Motorola: ['Moto G84 5G', 'Moto G54', 'Moto E14', 'Moto E13'], Xiaomi: ['Redmi Note 13', 'Redmi Note 12', 'Poco X6 Pro'], Outra: [] };
function viewAssist() {
  const f = ensureSvc();
  const picked = SERVICES.find(s => s.name === f.pick);
  const fe = k => f.err[k] ? `<p class="ferr" id="serr-${k}">${f.err[k]}</p>` : '';
  return `<section class="ahero"><div class="ahero__in">
      <span class="locpill">${icon('wrench', 15)}ASSISTÊNCIA TÉCNICA</span>
      <h1>CUIDADO DE DOUTOR<br>PARA O SEU <span class="y">CELULAR.</span></h1>
      <p>Escolha o tipo de problema, conte o que aconteceu e acompanhe cada etapa da solicitação.</p>
      <div class="hero__ctas"><a class="btn btn--y btn--lg" href="#solicitar" data-act="scroll" data-to="svc-form">Solicitar orçamento ${icon('arrowR', 20)}</a><a class="btn btn--outline btn--lg" href="#acompanhar">Acompanhar solicitação</a></div>
    </div></section>
    <div class="wrap pagepad">
      <div class="sec__head"><h2 class="sec__t2">Qual é o problema?</h2><span class="muted small">Serviços listados como exemplo</span></div>
      <div class="svcgrid" role="listbox" aria-label="Tipos de serviço">${SERVICES.map(s => `<button role="option" aria-selected="${f.pick === s.name}" class="svcpick ${f.pick === s.name ? 'on' : ''}" data-act="svc-pick" data-svc="${s.name}">${icon(s.icon, 28)}<span>${s.name}</span></button>`).join('')}</div>
      ${picked ? `<div class="svcdesc card">${icon(picked.icon, 30)}<div><h3>${picked.name}</h3><p>${picked.desc}</p><p class="fine">Valor e prazo definidos pela loja após avaliação do aparelho (informação demonstrativa).</p></div><button class="btn btn--y btn--sm" data-act="scroll" data-to="svc-form">Solicitar este serviço</button></div>` : `<p class="muted small" style="margin-top:12px">Toque em um serviço para ver a descrição.</p>`}
      <form class="card svcform" id="svc-form" data-form="svc" novalidate>
        <h2>Solicitar atendimento</h2><p class="muted">Formulário demonstrativo: cria um registro apenas neste protótipo.</p>
        <div class="form form--2">
          <div class="field ${f.err.name ? 'bad' : ''}"><label for="sv-name">Seu nome *</label><input id="sv-name" data-in="svc.name" value="${esc(f.name)}" autocomplete="name">${fe('name')}</div>
          <div class="field ${f.err.phone ? 'bad' : ''}"><label for="sv-phone">Telefone com DDD *</label><input id="sv-phone" data-in="svc.phone" data-mask="phone" inputmode="tel" value="${esc(f.phone)}" placeholder="(11) 90000-0000">${fe('phone')}</div>
          <div class="field ${f.err.brand ? 'bad' : ''}"><label for="sv-brand">Marca do aparelho *</label><select id="sv-brand" data-in="svc.brand"><option value="">Selecione</option>${Object.keys(MODEL_HINTS).map(b => `<option ${f.brand === b ? 'selected' : ''}>${b}</option>`).join('')}</select>${fe('brand')}</div>
          <div class="field ${f.err.model ? 'bad' : ''}"><label for="sv-model">Modelo do aparelho *</label><input id="sv-model" data-in="svc.model" value="${esc(f.model)}" list="model-hints" placeholder="Ex.: Galaxy A15"><datalist id="model-hints">${(MODEL_HINTS[f.brand] || Object.values(MODEL_HINTS).flat()).map(m => `<option value="${m}">`).join('')}</datalist>${fe('model')}</div>
          <div class="field span2 ${f.err.service ? 'bad' : ''}"><label for="sv-service">Tipo de problema *</label><select id="sv-service" data-in="svc.service"><option value="">Selecione</option>${SERVICES.map(s => `<option ${f.service === s.name ? 'selected' : ''}>${s.name}</option>`).join('')}</select>${fe('service')}</div>
          <div class="field span2 ${f.err.desc ? 'bad' : ''}"><label for="sv-desc">Descreva o defeito *</label><textarea id="sv-desc" data-in="svc.desc" rows="3" placeholder="O que aconteceu? Desde quando?">${esc(f.desc)}</textarea>${fe('desc')}</div>
        </div>
        <div class="opt__h"><span>Unidade de preferência</span><b>${esc(unitName(f.unitId))}</b></div>${unitPills(f.unitId, 'svc-unit')}
        <div class="ck__nav"><span class="fine">Ao enviar, o aparelho não é considerado recebido pela loja.</span><button class="btn btn--y btn--lg" type="submit">Enviar solicitação demonstrativa ${icon('arrowR', 18)}</button></div>
      </form>
    </div>`;
}
function viewTrack() {
  const c = custById(S.currentCustomerId);
  const mine = c ? [...S.orders.filter(o => o.customerId === c.id).map(o => ({ t: 'o', x: o })), ...S.services.filter(s => s.customerId === c.id).map(s => ({ t: 's', x: s }))].sort((a, b) => b.x.createdAt - a.x.createdAt) : [];
  return `<div class="wrap pagepad narrow"><h1 class="ptitle">Acompanhar pedido ou serviço</h1><p class="psub">Digite o código que aparece na confirmação.</p>
    <form class="card trackf" data-form="track" novalidate><div class="field ${UI.trackErr ? 'bad' : ''}"><label for="track">Código do pedido ou da solicitação</label><div class="trackf__row"><input id="track" data-in="track" value="${esc(UI.track)}" placeholder="PED-1044 ou OS-2039" autocomplete="off"><button class="btn btn--y" type="submit">Acompanhar</button></div>${UI.trackErr ? `<p class="ferr">${UI.trackErr}</p>` : ''}</div>
    <p class="fine">Experimente: ${['PED-1042', 'PED-1038', 'OS-2035', 'OS-2034'].map(x => `<button type="button" class="lnk" data-act="track-try" data-v="${x}">${x}</button>`).join(' · ')}</p></form>
    ${mine.length ? `<h2 class="sec__t2" style="margin-top:28px">Seus registros neste protótipo</h2>${recordList(mine)}` : ''}</div>`;
}
function recordList(items) {
  return `<ul class="recs">${items.map(({ t, x }) => t === 'o'
    ? `<li><a href="#pedido-${x.num}"><span class="recs__ic">${icon('box', 20)}</span><span class="recs__t"><b class="mono">${x.id}</b><small>${fmtDateTime(x.createdAt)} · ${plural(x.items.reduce((s, l) => s + l.qty, 0), 'item', 'itens')} · ${brl(x.total)}</small></span>${pill(orderStatusLabel(x), orderTone(x.status))}</a></li>`
    : `<li><a href="#os-${x.num}"><span class="recs__ic">${icon('wrench', 20)}</span><span class="recs__t"><b class="mono">${x.id}</b><small>${fmtDateTime(x.createdAt)} · ${esc(x.service)} · ${esc(x.brand)} ${esc(x.model)}</small></span>${pill(svcLabel(x.status), svcTone(x.status))}</a></li>`).join('')}</ul>`;
}
function viewContact() {
  const faq = [
    ['Como escolho a unidade?', 'Use o seletor de unidade no topo da loja ou na página inicial. A escolha define onde a disponibilidade dos produtos é consultada e sugere o local de retirada no checkout.'],
    ['Os preços e estoques do site são reais?', 'Não. Neste protótipo, preços, estoques e disponibilidade por unidade são fictícios e servem apenas para demonstrar o funcionamento.'],
    ['Como funciona a retirada na unidade?', 'No checkout você escolhe a unidade e a modalidade de retirada. Regras reais de horário e prazo serão definidas pela loja.'],
    ['Vocês fazem entrega?', 'A entrega aparece como opção demonstrativa. Área atendida, prazo e valor ainda precisam ser configurados pela loja.'],
    ['Como acompanho meu conserto?', 'Depois de enviar a solicitação, use o código OS informado na confirmação na página “Acompanhar”.'],
    ['Existe garantia nos serviços?', 'As condições de garantia serão informadas pela loja. Este protótipo não define políticas de garantia.'],
  ];
  return `<div class="wrap pagepad"><h1 class="ptitle">Fale com o Doutor</h1><p class="psub">Escolha como podemos ajudar.</p>
    <div class="contact">
      <a class="ccard ccard--dark" href="#assistencia">${icon('wrench', 30)}<b>Assistência técnica</b><span>Solicitar orçamento de conserto</span>${icon('arrowR', 20)}</a>
      <a class="ccard" href="#acompanhar">${icon('box', 30)}<b>Acompanhar</b><span>Pedido ou solicitação de assistência</span>${icon('arrowR', 20)}</a>
      <button class="ccard" data-act="contact-open">${icon('chat', 30)}<b>Mensagem para a unidade</b><span>Prepare uma mensagem para a loja</span>${icon('arrowR', 20)}</button>
    </div>
    <h2 class="sec__t2" style="margin-top:32px">Unidades</h2><p class="muted">Endereços, horários e contatos ainda precisam ser configurados pela loja.</p>
    ${unitCards()}
    <h2 class="sec__t2" style="margin-top:32px">Perguntas frequentes</h2>
    <div class="faq">${faq.map(([q, a]) => `<details><summary>${q}${icon('chevD', 18)}</summary><p>${a}</p></details>`).join('')}</div></div>`;
}
function unitCards() {
  return `<div class="ucards">${UNITS.map(u => {
    const skus = activeProducts().filter(p => unitStock(p, u.id) > 0).length;
    return `<div class="ucard ${S.unitId === u.id ? 'on' : ''}"><div class="ucard__h">${icon('pin', 22)}<h3>${u.name}</h3>${S.unitId === u.id ? '<span class="tag-y">Selecionada</span>' : ''}</div>
      <dl><div><dt>Endereço</dt><dd class="cfg">A configurar</dd></div><div><dt>Horário</dt><dd class="cfg">A configurar</dd></div><div><dt>Contato</dt><dd class="cfg">A configurar</dd></div><div><dt>Produtos com estoque</dt><dd>${skus} <small>(demonstrativo)</small></dd></div></dl>
      ${S.unitId === u.id ? '<button class="btn btn--soft btn--block" disabled>Unidade atual</button>' : `<button class="btn btn--y btn--block" data-act="set-unit" data-unit="${u.id}">Escolher esta unidade</button>`}</div>`;
  }).join('')}</div>`;
}
function viewUnits() {
  return `<div class="wrap pagepad"><h1 class="ptitle">Escolha sua unidade</h1><p class="psub">A unidade define a consulta de estoque, a retirada no checkout e o direcionamento das solicitações de assistência.</p>${unitCards()}${demoNote('Estoques e informações das unidades são fictícios nesta demonstração.')}</div>`;
}
function viewAccount() {
  const c = custById(S.currentCustomerId);
  if (!c) return `<div class="wrap pagepad narrow"><h1 class="ptitle">Minha conta</h1><div class="empty"><div class="empty__ic">${icon('user', 34)}</div><h3>Nenhum cliente identificado</h3><p>O perfil aparece depois de um pedido ou solicitação de assistência feitos neste protótipo.</p><div class="row row--c"><a class="btn btn--y" href="#loja">Fazer um pedido</a><button class="btn btn--soft" data-act="demo-profile">Ver cliente de exemplo</button></div></div></div>`;
  const orders = S.orders.filter(o => o.customerId === c.id), svcs = S.services.filter(s => s.customerId === c.id);
  const spent = orders.filter(o => o.status === 'concluido').reduce((s, o) => s + o.total, 0);
  const items = [...orders.map(o => ({ t: 'o', x: o })), ...svcs.map(s => ({ t: 's', x: s }))].sort((a, b) => b.x.createdAt - a.x.createdAt);
  return `<div class="wrap pagepad narrow"><h1 class="ptitle">Minha conta</h1><p class="psub">Perfil demonstrativo baseado nos registros deste protótipo.</p>
    <div class="card prof"><span class="prof__av">${esc(c.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><h2>${esc(c.name)}</h2><p class="muted">${esc(c.phone)}${c.email ? ' · ' + esc(c.email) : ''}</p></div></div>
    <div class="kpis3"><div><span>Pedidos</span><b>${orders.length}</b></div><div><span>Compras concluídas</span><b>${brl(spent)}</b></div><div><span>Assistências</span><b>${svcs.length}</b></div></div>
    <h2 class="sec__t2">Histórico</h2>${items.length ? recordList(items) : '<p class="muted">Sem registros ainda.</p>'}
    <button class="lnk lnk--muted" data-act="logout-demo">${icon('logout', 16)}Trocar de cliente</button></div>`;
}

/* ---------- menu lateral, modais e toasts ---------- */
function menuDrawer() {
  if (!UI.menu) return '';
  const links = [['inicio', 'home', 'Início'], ['loja', 'store', 'Loja'], ['loja-celulares', 'phone', 'Celulares'], ['loja-acessorios', 'grid', 'Acessórios'], ['assistencia', 'wrench', 'Assistência técnica'], ['acompanhar', 'box', 'Acompanhar pedido ou serviço'], ['atendimento', 'chat', 'Atendimento'], ['unidades', 'pin', 'Unidades'], ['conta', 'user', 'Minha conta'], ['sacola', 'bag', 'Sacola']];
  return `<div class="scrim" data-act="menu-close"></div><aside class="mdrawer" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="mdrawer__h">${brand('line')}<button class="hd__btn" data-act="menu-close" aria-label="Fechar menu">${icon('x', 24)}</button></div>
    <nav>${links.map(([h, ic, l]) => `<a href="#${h}" data-act="menu-close-go">${icon(ic, 21)}<span>${l}</span>${icon('chevR', 16)}</a>`).join('')}</nav>
    <div class="mdrawer__unit"><h4>Sua unidade</h4>${unitPills(S.unitId, 'set-unit', { compact: true })}</div>
    <div class="mdrawer__demo"><h4>Demonstração SMG</h4><a href="#gestao" data-act="menu-close-go">${icon('dash', 20)}<span>Painel de gestão</span></a><button data-act="reset-ask">${icon('refresh', 20)}<span>Restaurar dados iniciais</span></button></div>
  </aside>`;
}
function modalHtml() {
  const m = UI.modal; if (!m) return '';
  let inner = '', cls = '';
  if (m.type === 'quick') {
    const p = P(m.id); const sel = getSel(p); const complete = selComplete(p, sel);
    const vkey = complete ? vkeyOf(p, sel) : null; const st = complete ? stockOf(p.id, vkey, S.unitId) : 0;
    const label = !complete ? `Selecione ${missingOpts(p, sel).join(' e ')}` : st === 0 ? `Indisponível em ${unitName(S.unitId)}` : `Adicionar · ${brl(variantPrice(p, sel))}`;
    cls = 'sheet';
    inner = `<div class="qa"><div class="qa__h"><span class="qa__img">${productArt(p, sel)}</span><div><h2>${esc(p.name)}</h2><b>${brl(complete ? variantPrice(p, sel) : priceRange(p)[0])}</b><small>${esc(unitName(S.unitId))} · ${complete ? (st ? `${st} un. demonstrativas` : 'sem estoque') : 'escolha as opções'}</small></div></div>
      <div class="pd__opts">${optionSelector(p, 'qa')}</div>
      <div class="row"><a class="btn btn--soft" href="#produto-${p.id}" data-act="modal-close-go">Ver detalhes</a><button class="btn btn--y grow" data-act="qa-add" data-id="${p.id}" ${complete && st ? '' : 'disabled'}>${label}</button></div></div>`;
  } else if (m.type === 'filters') {
    cls = 'sheet';
    inner = `<h2>Filtros</h2>${filterPanel()}<div class="row"><button class="btn btn--soft" data-act="clear-filters">Limpar</button><button class="btn btn--y grow" data-act="modal-close">Ver ${plural(filteredProducts().length + filteredServices().length, 'resultado', 'resultados')}</button></div>`;
  } else if (m.type === 'reset') {
    inner = `<h2>Restaurar dados iniciais?</h2><p>Pedidos, solicitações, clientes novos e alterações feitas durante a demonstração serão apagados. A sacola também será esvaziada.</p><div class="row"><button class="btn btn--soft grow" data-act="modal-close">Cancelar</button><button class="btn btn--dark grow" data-act="reset-do">${icon('refresh', 18)}Restaurar</button></div>`;
  } else if (m.type === 'contact') {
    const msg = m.msg != null ? m.msg : `Olá! Vim pelo site da Doutor do Celular e gostaria de falar com a unidade ${unitName(m.unitId || S.unitId)}.`;
    m.msg = msg;
    inner = `<h2>Mensagem para a unidade</h2><p class="muted">O canal oficial (WhatsApp ou telefone) ainda não foi configurado. Prepare a mensagem e copie para enviar pelo canal da loja.</p>
      <div class="opt__h"><span>Unidade</span><b>${esc(unitName(m.unitId || S.unitId))}</b></div>${unitPills(m.unitId || S.unitId, 'contact-unit', { compact: true })}
      <div class="field"><label for="ct-msg">Mensagem</label><textarea id="ct-msg" rows="4" data-in="contact-msg">${esc(msg)}</textarea></div>
      <div class="row"><button class="btn btn--soft grow" data-act="modal-close">Fechar</button><button class="btn btn--y grow" data-act="copy" data-src="ct-msg">${icon('copy', 18)}Copiar mensagem</button></div>
      <p class="fine">Destino a configurar. Nenhuma mensagem é enviada automaticamente.</p>`;
  } else if (m.type === 'adm') {
    return admModal(m);
  }
  return `<div class="scrim scrim--modal" data-act="modal-close"></div><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="modal__x" data-act="modal-close" aria-label="Fechar">${icon('x', 22)}</button>${inner}</div>`;
}
let toastT;
function toast(msg, tone = 'ok', action) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.className = 'toast toast--' + tone + ' show';
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<a href="#${action.to}">${esc(action.label)}</a>` : ''}`;
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3200);
}
