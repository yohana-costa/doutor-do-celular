/* ============ Núcleo: utilitários, estado, regras ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brl = v => BRL.format(v || 0).replace(/ /g, ' ');
const brlCompact = v => v >= 1000 ? 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' mil' : 'R$ ' + Math.round(v);
const pad2 = n => String(n).padStart(2, '0');
const fmtDate = t => { const d = new Date(t); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`; };
const fmtDateTime = t => { const d = new Date(t); return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)} · ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const stem = w => { const syn = { capinha: 'capa', capinhas: 'capa', case: 'capa', cases: 'capa', celulares: 'celular', smartphone: 'celular', smartphones: 'celular', fones: 'fone', headphone: 'fone', vidro: 'pelicula', carregadores: 'carregador', tipo: 'usb-c', typec: 'usb-c', 'type-c': 'usb-c', usbc: 'usb-c', relogio: 'smartwatch', caixinha: 'caixa', bateria: 'power' }; w = syn[w] || w; return w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w; };
const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;
const digits = s => String(s || '').replace(/\D/g, '');
function maskPhone(v) { const d = digits(v).slice(0, 11); if (d.length <= 2) return d.length ? `(${d}` : ''; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; }

/* Estado da loja. Catálogo, estoque e configurações vêm da API; só a unidade escolhida
   e a sacola ficam neste navegador (chave kc-loja). */
const PREFS_KEY = 'kc-loja';
const prefs = LS.get(PREFS_KEY, {}) || {};
const S = { unitId: prefs.unitId || null, cart: Array.isArray(prefs.cart) ? prefs.cart : [], products: [], stock: {}, config: {}, scope: null, ready: false, loadErr: null };
const UI = {
  cat: { group: 'all', sub: null, brand: null, q: '', brands: [], price: null, avail: false, compat: null, sort: 'rel' },
  sel: {}, pdView: {}, qty: {}, menu: false, modal: null, ck: null, svc: null, track: '', trackPhone: '', trackErr: '', busy: false, fresh: null,
  acc: { mode: 'login', phone: '', pass: '', name: '', email: '', code: '', needCode: false, err: '' },
  look: {},
  adm: { period: '30', unit: 'all', admNav: false, drawer: null, ord: { q: '', status: 'all', unit: 'all' }, prod: { q: '', sub: 'all', brand: 'all', inactive: false }, stk: { unit: 'all', sub: 'all', sit: 'all', q: '', limit: 40 }, cli: { q: '' }, svc: { status: 'open', unit: 'all', view: 'board' }, edit: null, np: null, quote: {}, login: { email: '', pass: '', err: '' }, cfg: null },
};
function save() { LS.set(PREFS_KEY, { unitId: S.unitId, cart: S.cart }); }
const LOW = () => (S.config && S.config.lowStock != null ? Number(S.config.lowStock) : 3);

/* Catálogo: a loja usa /api/loja/catalogo (só itens ativos); a gestão usa /api/gestao/catalogo (tudo). */
function applyCatalog(d, scope) {
  UNITS.splice(0, UNITS.length, ...d.units);
  SUBS.splice(0, SUBS.length, ...d.subs);
  SERVICES.splice(0, SERVICES.length, ...d.services);
  S.products = d.products; S.stock = d.stock; S.config = d.config || {}; S.scope = scope;
  const activeUnits = UNITS.filter(u => u.active !== false);
  if (!activeUnits.find(u => u.id === S.unitId)) S.unitId = activeUnits[0] ? activeUnits[0].id : null;
  S.cart = S.cart.filter(i => { const p = P(i.pid); return p && p.active && variantsOf(p).some(sel => vkeyOf(p, sel) === i.vkey); });
  save();
}
let catalogPromise = null;
function loadCatalog(scope = 'loja') {
  if (catalogPromise && catalogPromise.scope === scope) return catalogPromise;
  const pr = api(scope === 'gestao' ? '/gestao/catalogo' : '/loja/catalogo', { auth: scope === 'gestao' ? 'equipe' : null })
    .then(d => { applyCatalog(d, scope); S.ready = true; S.loadErr = null; })
    .catch(e => { S.loadErr = e; throw e; })
    .finally(() => { if (catalogPromise === pr) catalogPromise = null; });
  pr.scope = scope; catalogPromise = pr;
  return pr;
}

/* Dados remotos por tela: R[chave] = { st: 'loading' | 'ok' | 'err', data, err } */
const R = {};
function need(key, loader) {
  if (R[key]) return R[key];
  const r = R[key] = { st: 'loading' };
  loader().then(data => { if (R[key] === r) { R[key] = { st: 'ok', data }; render(); } }, err => { if (R[key] === r) { R[key] = { st: 'err', err }; render(); } });
  return r;
}
function drop(...prefixes) { Object.keys(R).forEach(k => { if (prefixes.some(p => k.startsWith(p))) delete R[k]; }); }
function loadingBox(t = 'Carregando...') { return `<div class="loadbox" role="status" aria-live="polite"><span class="spin" aria-hidden="true"></span><span>${esc(t)}</span></div>`; }
function errorBox(err, key) { return `<div class="empty"><div class="empty__ic">${icon('alert', 32)}</div><h3>Não foi possível carregar</h3><p>${esc(err && err.message ? err.message : 'Tente de novo em instantes.')}</p>${key ? `<div class="row row--c"><button class="btn btn--y btn--sm" data-act="retry" data-k="${esc(key)}">${icon('refresh', 16)}Tentar de novo</button></div>` : ''}</div>`; }

/* ---------- consultas ---------- */
const P = id => S.products.find(p => p.id === id);
const activeProducts = () => S.products.filter(p => p.active);
const stockOf = (pid, vkey, unit) => S.stock[`${pid}|${vkey}|${unit}`] || 0;
const shopUnits = () => UNITS.filter(u => u.active !== false);
function unitStock(p, unit) { return variantsOf(p).reduce((s, sel) => s + stockOf(p.id, vkeyOf(p, sel), unit), 0); }
function availState(p, unit) {
  const vs = variantsOf(p).map(sel => stockOf(p.id, vkeyOf(p, sel), unit));
  if (!vs.some(q => q > 0)) return 'out';
  if (vs.filter(q => q > 0).every(q => q <= LOW())) return 'low';
  return 'ok';
}
function priceRange(p) { const ps = variantsOf(p).map(s => variantPrice(p, s)); return ps.length ? [Math.min(...ps), Math.max(...ps)] : [p.price, p.price]; }
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
const loggedCustomer = () => { const c = TOKENS.cliente(); return c && c.token ? c.customer : null; };

/* ---------- regras da loja ---------- */
function addToCart(pid, sel, qty = 1) {
  const p = P(pid); const vkey = vkeyOf(p, sel);
  const max = stockOf(pid, vkey, S.unitId);
  const ex = S.cart.find(i => i.pid === pid && i.vkey === vkey);
  const cur = ex ? ex.qty : 0;
  const add = Math.min(qty, max - cur);
  if (add <= 0) { toast(max ? `Você já tem todo o estoque deste item em ${unitName(S.unitId)} na sacola.` : `Sem estoque em ${unitName(S.unitId)}.`, 'warn'); return false; }
  if (ex) ex.qty += add; else S.cart.push({ pid, vkey, qty: add, addedAt: Date.now() });
  save();
  toast(`${p.name} adicionado à sacola`, 'ok', { label: 'Ver sacola', to: 'sacola' });
  return true;
}
function stockShortfall(items, unit) { return items.filter(l => stockOf(l.pid, l.vkey, unit) < l.qty); }

/* Pedido real: o servidor confere preço e estoque e devolve o token de acesso ao pedido. */
async function createOrder(ck) {
  const body = {
    nome: ck.name.trim(), telefone: ck.phone, email: ck.email.trim(), unidadeId: ck.unitId, modalidade: ck.mode,
    endereco: ck.mode === 'entrega' ? ck.address.trim() : undefined, pagamento: ck.pay, observacao: ck.note.trim() || undefined,
    itens: S.cart.map(i => ({ produtoId: i.pid, chave: i.vkey, quantidade: i.qty })),
  };
  const r = await api('/loja/pedidos', { method: 'POST', body, auth: loggedCustomer() ? 'cliente' : null });
  const code = r.order.id;
  guardarAcesso(code, r.access);
  R['pedido-' + r.order.num] = { st: 'ok', data: r.order };
  drop('conta');
  S.cart = []; S.unitId = ck.unitId; save();
  UI.fresh = code;
  return r.order;
}
async function createService(f) {
  const body = { nome: f.name.trim(), telefone: f.phone, marca: f.brand, modelo: f.model.trim(), servico: f.service, descricao: f.desc.trim(), unidadeId: f.unitId };
  const r = await api('/loja/os', { method: 'POST', body, auth: loggedCustomer() ? 'cliente' : null });
  guardarAcesso(r.service.id, r.access);
  R['os-' + r.service.num] = { st: 'ok', data: r.service };
  drop('conta');
  UI.fresh = r.service.id;
  return r.service;
}

/* ---------- arte do produto ---------- */
const AUTO_ART = { smartphones: { kind: 'phone', cam: 'sam' }, capinhas: { kind: 'case', style: 'silicone' }, peliculas: { kind: 'film', style: 'privacidade' }, carregadores: { kind: 'brick' }, cabos: { kind: 'cable', end: 'c' }, fones: { kind: 'wired' }, caixas: { kind: 'speaker' }, smartwatches: { kind: 'watch' }, pulseiras: { kind: 'band' }, powerbanks: { kind: 'bank' }, suportes: { kind: 'desk' }, veicular: { kind: 'carmount' }, foto: { kind: 'ring' }, adaptadores: { kind: 'hub' } };
function artViews(p) { if (p.image) return ['main', 'zoom']; const k = (p.art || {}).kind; if (k === 'phone') return ['main', 'back', 'front']; if (k === 'case') return ['main', 'flat', 'zoom']; if (k === 'film') return ['main', 'sheet']; return ['main', 'zoom']; }
const VIEW_LABEL = { main: 'Principal', back: 'Verso', front: 'Frente', flat: 'Traseira', zoom: 'Detalhe', sheet: 'Película' };
function productArt(p, sel = {}, view = 'main') {
  if (p.image) return `<img class="${view === 'zoom' ? 'zoomed' : ''}" src="${esc(mediaUrl(p.image))}" alt="" draggable="false" loading="lazy">`;
  const a = p.art || {};
  const colorName = sel['Cor'] || firstColor(p);
  const color = colorName ? colorHex(p, colorName) : '#3b3d42';
  let svg;
  switch (a.kind) {
    case 'photo': return ASSETS[a.key] ? `<img class="${view === 'zoom' ? 'zoomed' : ''}" src="${ASSETS[a.key]}" alt="" draggable="false">` : genericArt(color);
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
  if (variant === 'home') return `<a class="brand brand--stack" href="#inicio" aria-label="Doutor do Celular, Kauan Cell, início"><img src="${ASSETS.emblem}" alt=""><span class="brand__stack"><b>DOUTOR</b><b class="y">DO CELULAR</b><small>KAUAN CELL</small></span></a>`;
  return `<a class="brand brand--line" href="#inicio" aria-label="Doutor do Celular, Kauan Cell, início"><img src="${ASSETS.emblem}" alt=""><span class="brand__line"><b>Doutor do Celular</b><small>KAUAN CELL</small></span></a>`;
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
        <a class="unitchip" href="#unidades" title="Unidade selecionada">${icon('pin', 16)}<span>${esc(S.unitId ? unitName(S.unitId) : 'Unidade')}</span>${icon('chevD', 14)}</a>
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
  const names = shopUnits().map(u => u.name);
  const unitsTxt = names.length ? `Unidades ${names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0]}.` : '';
  return `<footer class="ft"><div class="ft__in">
    <div class="ft__brand">${brand('line')}<p>Celulares, acessórios e assistência técnica. ${esc(unitsTxt)}</p></div>
    <div class="ft__cols">
      <div><h4>Loja</h4><a href="#loja-celulares">Celulares</a><a href="#loja-acessorios">Acessórios</a><a href="#loja">Todos os produtos</a><a href="#sacola">Sacola</a></div>
      <div><h4>Atendimento</h4><a href="#assistencia">Assistência técnica</a><a href="#acompanhar">Acompanhar pedido</a><a href="#unidades">Unidades</a><a href="#conta">Minha conta</a></div>
      <div><h4>Equipe</h4><p class="ft__note">Acesso restrito à equipe da loja.</p><a href="#gestao" class="ft__adm">Área da equipe ${icon('arrowR', 14)}</a></div>
    </div></div>
    <div class="ft__base">Doutor do Celular · Kauan Cell</div></footer>`;
}
function pill(label, tone) { return `<span class="st st--${tone}"><i></i>${esc(label)}</span>`; }
function availChip(p, unit) {
  const st = availState(p, unit);
  const t = { ok: 'Disponível', low: 'Últimas unidades', out: 'Indisponível aqui' }[st];
  return `<span class="av av--${st}" title="Disponibilidade em ${esc(unitName(unit))}"><i></i>${t}</span>`;
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
  return `<article class="svc"><div class="svc__ic">${icon(s.icon, 34)}</div><div class="svc__b"><span class="svc__tag">Assistência</span><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p><div class="svc__f"><span>Sob avaliação</span><button class="btn btn--y btn--sm" data-act="svc-request" data-svc="${esc(s.name)}">Solicitar</button></div></div></article>`;
}
function unitPills(cur, act, opts = {}) {
  return `<div class="units ${opts.compact ? 'units--compact' : ''} ${opts.stack ? 'units--stack' : ''}" role="radiogroup" aria-label="Unidade">${shopUnits().map(u => `<button type="button" role="radio" aria-checked="${cur === u.id}" class="unit ${cur === u.id ? 'on' : ''}" data-act="${act}" data-unit="${u.id}">${icon('pin', 18)}<span>${esc(u.name)}${opts.extra ? opts.extra(u) : ''}</span></button>`).join('')}</div>`;
}
function infoNote(t) { return `<p class="demo-note">${icon('alert', 14)}${t}</p>`; }
function qtyStepper(id, q, max, act = 'qty') {
  return `<div class="qty" role="group" aria-label="Quantidade"><button type="button" data-act="${act}" data-id="${esc(id)}" data-d="-1" ${q <= 1 ? 'disabled' : ''} aria-label="Diminuir">${icon('minus', 18)}</button><output aria-live="polite">${q}</output><button type="button" data-act="${act}" data-id="${esc(id)}" data-d="1" ${q >= max ? 'disabled' : ''} aria-label="Aumentar">${icon('plus', 18)}</button></div>`;
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
      if (o.type === 'color') return `<button type="button" class="sw ${on ? 'on' : ''}" ${ok ? '' : 'disabled'} data-act="pick" data-ctx="${ctx}" data-id="${p.id}" data-o="${esc(o.name)}" data-v="${esc(v.v)}" aria-pressed="${on}" title="${esc(v.v)}${ok ? '' : ', combinação indisponível'}"><i style="background:${colorHex(p, v.v)}"></i><span>${esc(v.v)}</span></button>`;
      return `<button type="button" class="chip ${on ? 'on' : ''}" ${ok ? '' : 'disabled'} data-act="pick" data-ctx="${ctx}" data-id="${p.id}" data-o="${esc(o.name)}" data-v="${esc(v.v)}" aria-pressed="${on}" title="${ok ? '' : 'Combinação indisponível'}">${esc(v.v)}${delta}</button>`;
    }).join('');
    return `<div class="opt">${label}<div class="opt__vals ${o.type === 'color' ? 'opt__vals--sw' : ''}">${btns}</div></div>`;
  }).join('');
}

/* ============ Telas da loja ============ */
function viewHome() {
  const feat = activeProducts().slice().sort((a, b) => a.rank - b.rank).slice(0, 8);
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
    </div></section>
    <section class="sec sec--dark"><div class="wrap astband">
      <div><span class="eyebrow">ASSISTÊNCIA TÉCNICA</span><h2>Seu celular deu problema?</h2><p>Conte o que aconteceu, escolha a unidade e acompanhe cada etapa da sua solicitação.</p><div class="row"><a class="btn btn--y" href="#assistencia">Solicitar orçamento ${icon('arrowR', 18)}</a><a class="btn btn--outline" href="#acompanhar">Acompanhar solicitação</a></div></div>
      <ul class="astband__list">${SERVICES.slice(0, 6).map(s => `<li>${icon(s.icon, 22)}<span>${esc(s.name)}</span></li>`).join('')}</ul>
    </div></section>`;
}

function viewCatalog() {
  const f = UI.cat;
  const prods = filteredProducts(), svcs = filteredServices();
  const g = f.group;
  const title = g === 'acessorios' ? 'Acessórios para o seu dia.' : g === 'celulares' ? 'Celulares para o seu próximo upgrade.' : g === 'assistencia' ? 'Assistência para o seu aparelho.' : 'Tudo para o seu celular.';
  let pills;
  if (g === 'celulares') pills = [[null, 'Todos'], ...PHONE_BRANDS.filter(b => activeProducts().some(p => p.group === 'celulares' && p.brand === b)).map(b => ['brand:' + b, b])];
  else if (g === 'acessorios') pills = [[null, 'Todos'], ...SUBS.filter(s => s.group === 'acessorios').map(s => [s.id, s.label])];
  else if (g === 'assistencia') pills = [];
  else pills = [[null, 'Todos'], ...SUBS.map(s => [s.id, s.label]), ['grp:assistencia', 'Assistência']];
  const curPill = f.brand ? 'brand:' + f.brand : f.sub;
  return `<div class="cat-page"><div class="wrap">
    <div class="cat-head"><div><h1 class="ptitle">${title}</h1><p class="psub">Escolha seus favoritos e monte seu pedido.</p></div>
      ${g !== 'all' ? `<a class="lnk lnk--muted" href="#loja" data-act="cat-all">Ver toda a loja ${icon('arrowR', 15)}</a>` : ''}</div>
    <label class="searchbox" for="q"><span>${icon('search', 24)}</span><input id="q" type="search" placeholder="O que você procura?" value="${esc(f.q)}" data-in="cat-q" autocomplete="off" enterkeyhint="search"><button type="button" class="searchbox__x" data-act="clear-q" aria-label="Limpar busca" ${f.q ? '' : 'hidden'}>${icon('x', 18)}</button></label>
    ${pills.length ? `<div class="pills" role="tablist" aria-label="Categorias">${pills.map(([id, l]) => `<button role="tab" aria-selected="${curPill === id}" class="pillb ${curPill === id ? 'on' : ''}" data-act="cat-pill" data-p="${esc(id || '')}">${esc(l)}</button>`).join('')}</div>` : ''}
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
    <label class="sortsel"><span>Ordenar</span><select id="sort" data-in="cat-sort"><option value="rel" ${f.sort === 'rel' ? 'selected' : ''}>Relevância</option><option value="asc" ${f.sort === 'asc' ? 'selected' : ''}>Menor preço</option><option value="desc" ${f.sort === 'desc' ? 'selected' : ''}>Maior preço</option><option value="name" ${f.sort === 'name' ? 'selected' : ''}>Nome (A a Z)</option><option value="new" ${f.sort === 'new' ? 'selected' : ''}>Novidades</option></select></label></div>`;
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
    (svcs.length ? `${prods.length ? '<h3 class="grid-sep">Serviços de assistência</h3>' : ''}<div class="grid grid--svc">${svcs.map(serviceCard).join('')}</div>` : '') +
    `<p class="tiny-note">Disponibilidade para ${esc(unitName(S.unitId))}</p>`;
}
function filterPanel() {
  const f = UI.cat;
  const brands = [...new Set(activeProducts().filter(p => f.group === 'all' || p.group === f.group).map(p => p.brand))];
  return `<div class="fp">
    <div class="fp__g"><h4>Marca</h4><div class="fp__chips">${brands.map(b => `<button class="chip ${f.brands.includes(b) ? 'on' : ''}" data-act="f-brand" data-v="${esc(b)}" aria-pressed="${f.brands.includes(b)}">${esc(b === 'Diversas' ? 'Diversas (acessórios)' : b)}</button>`).join('')}</div></div>
    <div class="fp__g"><h4>Faixa de preço</h4><div class="fp__list">${PRICE_BANDS.map(b => `<button class="radio ${f.price === b.id ? 'on' : ''}" data-act="f-price" data-v="${b.id}" aria-pressed="${f.price === b.id}"><i></i>${b.label}</button>`).join('')}</div></div>
    <div class="fp__g"><h4>Disponibilidade</h4><button class="switch ${f.avail ? 'on' : ''}" data-act="f-avail" aria-pressed="${f.avail}"><i></i>Somente disponíveis em ${esc(unitName(S.unitId))}</button></div>
    <div class="fp__g"><h4>Compatibilidade</h4><div class="fp__chips">${COMPAT_FAMS.map(c => `<button class="chip ${f.compat === c ? 'on' : ''}" data-act="f-compat" data-v="${c}" aria-pressed="${f.compat === c}">${c}</button>`).join('')}</div><p class="fp__hint">Aplica-se a acessórios. Na dúvida, confirme com a loja.</p></div>
  </div>`;
}

function viewProduct(id) {
  const p = P(id);
  if (!p || !p.active) return `<div class="wrap pagepad"><div class="empty"><h3>Produto não encontrado</h3><p>Ele pode ter saído do catálogo.</p><a class="btn btn--y" href="#loja">Voltar para a loja</a></div></div>`;
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
  const low = LOW();
  const units = shopUnits().map(u => {
    const qn = complete ? stockOf(p.id, vkey, u.id) : unitStock(p, u.id);
    const st = qn === 0 ? 'out' : qn <= low ? 'low' : 'ok';
    return `<li class="${u.id === S.unitId ? 'cur' : ''}"><span>${icon('pin', 16)}${esc(u.name)}</span><span class="av av--${st}"><i></i>${qn === 0 ? 'Indisponível' : qn <= low ? `Últimas ${qn} un.` : `${qn} un.`}</span>${u.id !== S.unitId && qn > 0 ? `<button class="lnk" data-act="set-unit" data-unit="${u.id}">Escolher</button>` : u.id === S.unitId ? '<em>Selecionada</em>' : '<span></span>'}</li>`;
  }).join('');
  const related = relatedProducts(p);
  const specs = [['Marca', p.brand === 'Diversas' ? 'Diversas' : p.brand], ['Modelo', p.model], ...(p.specs || [])];
  (p.options || []).forEach(o => { if (o.name !== COMPAT) specs.push([o.name, sel[o.name] || o.values.map(v => v.v).join(', ')]); });
  if (complete) specs.push(['Código (SKU)', skuOf(p, sel)]);
  const compatOpt = (p.options || []).find(o => o.name === COMPAT);
  const compatSpec = (p.specs || []).find(s => s[0] === 'Compatibilidade');
  return `<div class="pd-page"><div class="wrap">
    <nav class="crumbs" aria-label="Você está em"><a href="#loja" data-act="back-store">${icon('chevL', 16)}Loja</a><span>/</span><a href="#loja-${p.group}">${esc(GROUPS[p.group] ? GROUPS[p.group].label : 'Loja')}</a><span>/</span><span>${esc(subLabel(p.sub))}</span></nav>
    <div class="pd">
      <div class="pd__gal">
        <div class="pd__main ${view === 'zoom' ? 'is-zoom' : ''}">${productArt(p, sel, view)}${p.isNew ? '<span class="pc__new">Novo</span>' : ''}</div>
        <div class="pd__thumbs" role="tablist" aria-label="Imagens">${views.map(v => `<button role="tab" aria-selected="${v === view}" class="${v === view ? 'on' : ''}" data-act="pd-view" data-id="${p.id}" data-v="${v}" aria-label="${VIEW_LABEL[v]}">${productArt(p, sel, v)}<span>${VIEW_LABEL[v]}</span></button>`).join('')}</div>
      </div>
      <div class="pd__info">
        <p class="pd__brand">${esc(p.brand === 'Diversas' ? subLabel(p.sub) : p.brand)} · ${esc(p.model)}</p>
        <h1 class="pd__name">${esc(p.name)}</h1>
        <div class="pd__price">${!complete && priceRange(p)[0] !== priceRange(p)[1] ? '<small>a partir de</small>' : ''}<b>${brl(price)}</b></div>
        <div class="pd__opts">${optionSelector(p, 'pd')}${Object.keys(sel).length && (p.options || []).some(o => o.values.length > 1 && sel[o.name]) ? `<button class="lnk lnk--muted" data-act="clear-sel" data-id="${p.id}">Limpar seleção</button>` : ''}</div>
        <div class="pd__unit"><div class="opt__h"><span>Unidade</span><b>${esc(unitName(S.unitId))}</b></div>${unitPills(S.unitId, 'set-unit', { compact: true })}</div>
        <div class="pd__buy">
          ${complete && maxAdd > 0 ? qtyStepper(p.id, q, maxAdd, 'pd-qty') : ''}
          <button class="btn btn--y btn--lg btn--block" data-act="pd-add" data-id="${p.id}" ${state}>${state ? '' : icon('bag', 20)}${esc(cta)}</button>
        </div>
        <ul class="pd__stock" aria-label="Estoque por unidade">${units}</ul>
        <p class="fine">${complete ? 'Estoque da variação escolhida' : 'Estoque somando todas as variações'}</p>
        <div class="pd__ship"><div>${icon('store', 22)}<p><b>Retirada na unidade</b><span>Escolha a unidade no checkout.</span></p></div><div>${icon('truck', 22)}<p><b>Entrega</b><span>${esc(S.config.deliveryText || 'Combinada com a loja.')}</span></p></div></div>
      </div>
    </div>
    <div class="pd__more">
      <section><h2>Descrição</h2><p>${esc(p.desc)}</p>${compatOpt ? `<h3>Compatibilidade</h3><div class="compat">${compatOpt.values.map(v => `<span class="${sel[COMPAT] === v.v ? 'on' : ''}">${icon('phone', 15)}${esc(v.v)}</span>`).join('')}</div><p class="fine">Na dúvida, confirme a compatibilidade com a loja antes da compra.</p>` : (compatSpec && p.group !== 'celulares' ? `<h3>Compatibilidade</h3><p class="fine">${esc(compatSpec[1])}</p>` : '')}</section>
      <section><h2>Especificações</h2><dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
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
        <div class="ci__b"><div class="ci__top"><div><a class="ci__name" href="#produto-${l.pid}">${esc(l.p.name)}</a><p class="ci__var">${esc(l.label)}</p></div><button class="iconbtn" data-act="cart-rm" data-k="${esc(l.pid + '::' + l.vkey)}" aria-label="Remover ${esc(l.p.name)}">${icon('trash', 19)}</button></div>
        <div class="ci__bot">${qtyStepper(`${l.pid}::${l.vkey}`, l.qty, Math.max(l.qty, stock), 'cart-qty')}<div class="ci__pr"><small>${brl(l.price)} cada</small><b>${brl(l.sub)}</b></div></div>
        ${stock < l.qty ? `<p class="warnline">${icon('alert', 15)}Sem estoque suficiente em ${esc(unitName(S.unitId))} (${stock} un.). Você pode escolher outra unidade no checkout.</p>` : ''}</div></li>`;
    }).join('')}</ul>
    <aside class="summary"><h2>Resumo</h2>
      <dl><div><dt>Itens</dt><dd>${n}</dd></div><div><dt>Subtotal</dt><dd>${brl(cartTotal())}</dd></div><div><dt>Retirada ou entrega</dt><dd>A definir</dd></div></dl>
      <div class="summary__tot"><span>Total</span><b>${brl(cartTotal())}</b></div>
      <a class="btn btn--y btn--lg btn--block" href="#checkout">Ir para o checkout ${icon('arrowR', 18)}</a>
      <a class="btn btn--soft btn--block" href="#loja">Continuar comprando</a>
      ${infoNote('O pagamento é combinado com a loja na confirmação do pedido.')}
    </aside>
  </div></div>`;
}

/* ---------- checkout ---------- */
function ensureCk() {
  if (!UI.ck) {
    const c = loggedCustomer();
    UI.ck = { step: 1, name: c ? c.name : '', phone: c ? c.phone : '', email: c ? c.email || '' : '', unitId: S.unitId, mode: 'retirada', address: '', pay: 'pix', note: '', err: {} };
  }
  return UI.ck;
}
function validateStep(ck, step) {
  const err = {};
  if (step === 2) {
    if (ck.name.trim().length < 3) err.name = 'Informe o nome completo.';
    const d = digits(ck.phone); if (d.length < 10 || d.length > 11) err.phone = 'Informe um telefone com DDD, como (11) 90000-0000.';
    if (ck.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ck.email.trim())) err.email = 'E-mail inválido. Deixe em branco se preferir.';
  }
  if (step === 3) {
    if (stockShortfall(cartLines(), ck.unitId).length) err.unit = 'Há itens sem estoque nesta unidade. Escolha outra unidade ou ajuste a sacola.';
    if (ck.mode === 'entrega' && ck.address.trim().length < 6) err.address = 'Informe o endereço de entrega.';
  }
  ck.err = err; return !Object.keys(err).length;
}
const PAY = { pix: 'Pix', cartao: 'Cartão (crédito ou débito)', retirada: 'Pagar na retirada' };
function viewCheckout() {
  const lines = cartLines();
  if (!lines.length) return `<div class="wrap pagepad"><h1 class="ptitle">Checkout</h1><div class="empty"><div class="empty__ic">${icon('bag', 36)}</div><h3>Sua sacola está vazia</h3><p>Adicione produtos para fazer um pedido.</p><a class="btn btn--y" href="#loja">Explorar a loja</a></div></div>`;
  const ck = ensureCk();
  const steps = ['Revisão', 'Seus dados', 'Unidade', 'Pagamento'];
  const fe = k => ck.err[k] ? `<p class="ferr" id="err-${k}">${esc(ck.err[k])}</p>` : '';
  const cust = loggedCustomer();
  let body = '';
  if (ck.step === 1) {
    body = `<h2>Revise sua sacola</h2><ul class="mini">${lines.map(l => `<li><span class="mini__img">${productArt(l.p, l.sel)}</span><span class="mini__t"><b>${esc(l.p.name)}</b><small>${esc(l.label)} · ${l.qty} × ${brl(l.price)}</small></span><b>${brl(l.sub)}</b></li>`).join('')}</ul><a class="lnk" href="#sacola">Alterar itens ou quantidades</a>`;
  } else if (ck.step === 2) {
    body = `<h2>Seus dados</h2><p class="muted">${cust ? 'Pedido vinculado à sua conta.' : 'Usamos o telefone para identificar você e para você acompanhar o pedido. <a class="lnk" href="#conta">Já tem conta? Entrar</a>'}</p>
      <div class="form">
        <div class="field ${ck.err.name ? 'bad' : ''}"><label for="ck-name">Nome completo *</label><input id="ck-name" data-in="ck.name" value="${esc(ck.name)}" autocomplete="name" ${cust ? 'readonly' : ''} ${ck.err.name ? 'aria-invalid="true" aria-describedby="err-name"' : ''}>${fe('name')}</div>
        <div class="field ${ck.err.phone ? 'bad' : ''}"><label for="ck-phone">Telefone com DDD *</label><input id="ck-phone" data-in="ck.phone" data-mask="phone" inputmode="tel" autocomplete="tel" value="${esc(ck.phone)}" placeholder="(11) 90000-0000" ${cust ? 'readonly' : ''} ${ck.err.phone ? 'aria-invalid="true" aria-describedby="err-phone"' : ''}>${fe('phone')}</div>
        <div class="field ${ck.err.email ? 'bad' : ''}"><label for="ck-email">E-mail <span class="opt-l">opcional</span></label><input id="ck-email" data-in="ck.email" type="email" inputmode="email" autocomplete="email" value="${esc(ck.email)}" placeholder="nome@exemplo.com">${fe('email')}</div>
      </div>`;
  } else if (ck.step === 3) {
    const extra = u => { const short = stockShortfall(lines, u.id).length; return `<small class="${short ? 'bad' : 'ok'}">${short ? plural(short, 'item sem estoque', 'itens sem estoque') : 'Todos os itens disponíveis'}</small>`; };
    const unit = UNITS.find(u => u.id === ck.unitId) || {};
    body = `<h2>Unidade e modalidade</h2>
      <div class="opt__h"><span>Unidade</span><b>${esc(unitName(ck.unitId))}</b></div>${unitPills(ck.unitId, 'ck-unit', { extra, stack: true })}${fe('unit')}
      <div class="opt__h" style="margin-top:20px"><span>Modalidade</span></div>
      <div class="choice">
        <button class="choice__it ${ck.mode === 'retirada' ? 'on' : ''}" data-act="ck-mode" data-v="retirada" aria-pressed="${ck.mode === 'retirada'}">${icon('store', 24)}<span><b>Retirada na unidade</b><small>Retire em ${esc(unitName(ck.unitId))}.${unit.hours ? ' ' + esc(unit.hours) : ''}</small></span></button>
        <button class="choice__it ${ck.mode === 'entrega' ? 'on' : ''}" data-act="ck-mode" data-v="entrega" aria-pressed="${ck.mode === 'entrega'}">${icon('truck', 24)}<span><b>Entrega</b><small>${esc(S.config.deliveryText || 'Combinada com a loja.')}</small></span></button>
      </div>
      ${ck.mode === 'entrega' ? `<div class="field ${ck.err.address ? 'bad' : ''}"><label for="ck-address">Endereço de entrega *</label><input id="ck-address" data-in="ck.address" value="${esc(ck.address)}" autocomplete="street-address" placeholder="Rua, número e bairro">${fe('address')}</div>` : ''}`;
  } else {
    body = `<h2>Pagamento</h2><p class="muted">${esc(S.config.paymentText || 'O pagamento é combinado com a loja na confirmação do pedido.')}</p>
      <div class="choice">${Object.entries(PAY).map(([k, l]) => `<button class="choice__it ${ck.pay === k ? 'on' : ''}" data-act="ck-pay" data-v="${k}" aria-pressed="${ck.pay === k}">${icon(k === 'pix' ? 'spark' : k === 'cartao' ? 'receipt' : 'store', 24)}<span><b>${l}</b><small>${k === 'retirada' ? 'Pagamento na unidade' : 'A loja envia os dados ao confirmar o pedido'}</small></span></button>`).join('')}</div>
      <div class="field"><label for="ck-note">Observação <span class="opt-l">opcional</span></label><input id="ck-note" data-in="ck.note" value="${esc(ck.note)}" maxlength="500" placeholder="Ex.: troco, ponto de referência"></div>
      <div class="review"><div><span>Cliente</span><b>${esc(ck.name)}</b><small>${esc(ck.phone)}${ck.email ? ' · ' + esc(ck.email) : ''}</small></div><div><span>Unidade</span><b>${esc(unitName(ck.unitId))}</b><small>${ck.mode === 'retirada' ? 'Retirada na unidade' : 'Entrega · ' + esc(ck.address)}</small></div></div>
      ${ck.err.submit ? `<p class="ferr" role="alert">${esc(ck.err.submit)}</p>` : ''}`;
  }
  const nav = `<div class="ck__nav">${ck.step > 1 ? `<button class="btn btn--soft" data-act="ck-back" ${UI.busy ? 'disabled' : ''}>${icon('chevL', 18)}Voltar</button>` : '<a class="btn btn--soft" href="#sacola">Voltar à sacola</a>'}
    ${ck.step < 4 ? `<button class="btn btn--y" data-act="ck-next">Continuar ${icon('arrowR', 18)}</button>` : `<button class="btn btn--y" data-act="ck-confirm" ${UI.busy ? 'disabled' : ''}>${UI.busy ? '<span class="spin spin--sm" aria-hidden="true"></span>Enviando...' : icon('check', 18) + 'Confirmar pedido'}</button>`}</div>`;
  return `<div class="wrap pagepad"><h1 class="ptitle">Checkout</h1>
    <ol class="stepper">${steps.map((s, i) => `<li class="${i + 1 < ck.step ? 'done' : i + 1 === ck.step ? 'cur' : ''}"><span>${i + 1 < ck.step ? icon('check', 14) : i + 1}</span><em>${s}</em></li>`).join('')}<li><span>5</span><em>Confirmação</em></li></ol>
    <div class="ck"><div class="ck__main card">${body}${nav}</div>
      <aside class="summary summary--ck"><h2>Seu pedido</h2><ul class="mini mini--s">${lines.map(l => `<li><span class="mini__t"><b>${l.qty}× ${esc(l.p.name)}</b><small>${esc(l.label)}</small></span><b>${brl(l.sub)}</b></li>`).join('')}</ul>
      <div class="summary__tot"><span>Total</span><b>${brl(cartTotal())}</b></div>${infoNote('O pedido entra como pendente e a loja confirma disponibilidade e pagamento.')}</aside>
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
    return `<li class="tl__it ${state}"><span class="tl__dot">${state === 'done' ? icon('check', 13) : state === 'bad' ? icon('x', 13) : ''}</span><span class="tl__t"><b>${esc(labelFn(s))}</b>${h ? `<small>${fmtDateTime(h.at)}</small>` : ''}</span></li>`;
  }).join('')}</ol>`;
}
/* Pedido e OS só aparecem com o token de acesso (guardado após o checkout ou a consulta)
   ou com a conta do cliente. Sem isso, a tela pede o telefone usado. */
function remoteRecord(kind, num) {
  const code = (kind === 'pedido' ? 'PED-' : 'OS-') + num;
  const key = kind + '-' + num;
  const acesso = TOKENS.acessos()[code] || null;
  if (!R[key] && !acesso && !loggedCustomer()) return { st: 'locked', code };
  const r = need(key, () => api(`/loja/${kind === 'pedido' ? 'pedidos' : 'os'}/${num}`, { acesso, auth: loggedCustomer() ? 'cliente' : null }).then(d => d.order || d.service));
  if (r.st === 'err' && r.err.status === 401) { esquecerAcesso(code); return { st: 'locked', code }; }
  return r;
}
function lockedView(code, title) {
  const f = UI.look[code] || (UI.look[code] = { phone: '', err: '' });
  return `<div class="wrap pagepad narrow"><h1 class="ptitle">${title}</h1><p class="psub">Para proteger seus dados, confirme o telefone usado em <b class="mono">${esc(code)}</b>.</p>
    <form class="card trackf" data-form="unlock" data-code="${esc(code)}" novalidate><div class="field ${f.err ? 'bad' : ''}"><label for="lk-phone">Telefone com DDD</label><div class="trackf__row"><input id="lk-phone" data-in="look.phone" data-code="${esc(code)}" data-mask="phone" inputmode="tel" autocomplete="tel" value="${esc(f.phone)}" placeholder="(11) 90000-0000"><button class="btn btn--y" type="submit" ${UI.busy ? 'disabled' : ''}>Ver detalhes</button></div>${f.err ? `<p class="ferr">${esc(f.err)}</p>` : ''}</div>
    <p class="fine">Tem conta? <a class="lnk" href="#conta">Entre</a> para ver todos os seus pedidos.</p></form></div>`;
}
function viewOrder(num) {
  const r = remoteRecord('pedido', num);
  if (r.st === 'locked') return lockedView(r.code, 'Acompanhar pedido');
  if (r.st === 'loading') return `<div class="wrap pagepad narrow">${loadingBox('Carregando pedido...')}</div>`;
  if (r.st === 'err') return `<div class="wrap pagepad narrow">${r.err.status === 404 ? `<div class="empty"><h3>Pedido não encontrado</h3><p>Confira o código e tente de novo.</p><a class="btn btn--y" href="#acompanhar">Acompanhar outro código</a></div>` : errorBox(r.err, 'pedido-' + num)}</div>`;
  const o = r.data;
  const fresh = UI.fresh === o.id;
  const flow = ['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto', 'concluido'];
  const unit = UNITS.find(u => u.id === o.unitId) || {};
  return `<div class="wrap pagepad narrow">
    ${fresh ? `<div class="okhero"><span class="okhero__ic">${icon('check', 34)}</span><div><h1>Pedido recebido</h1><p>Guarde o código <b class="mono">${o.id}</b>. A loja vai confirmar a disponibilidade e combinar o pagamento pelo telefone informado.</p></div></div>` : `<h1 class="ptitle">Acompanhar pedido</h1>`}
    <div class="card od">
      <div class="od__head"><div><span class="muted">Pedido</span><h2 class="mono">${o.id}</h2><small class="muted">Criado em ${fmtDateTime(o.createdAt)}</small></div>${pill(orderStatusLabel(o), orderTone(o.status))}</div>
      ${timeline(flow, o.status, o.history, s => orderStatusLabel(o, s), o.status === 'cancelado')}
      <p class="fine">O status é atualizado pela equipe da loja.</p>
    </div>
    <div class="card od"><h3>Itens</h3><ul class="mini">${o.items.map(l => { const p = P(l.pid); return `<li><span class="mini__img">${p ? productArt(p, selFromKey(p, l.vkey)) : ''}</span><span class="mini__t"><b>${esc(l.name)}</b><small>${esc(l.variant)} · ${l.qty} × ${brl(l.price)}</small></span><b>${brl(l.price * l.qty)}</b></li>`; }).join('')}</ul>
      <div class="summary__tot"><span>Total</span><b>${brl(o.total)}</b></div></div>
    <div class="card od od--grid">
      <div><span>Cliente</span><b>${esc(o.customer.name)}</b><small>${esc(o.customer.phone)}${o.customer.email ? ' · ' + esc(o.customer.email) : ''}</small></div>
      <div><span>Unidade</span><b>${esc(unitName(o.unitId))}</b><small>${o.mode === 'retirada' ? 'Retirada na unidade' : 'Entrega'}${unit.address ? ' · ' + esc(unit.address) : ''}</small></div>
      ${o.mode === 'entrega' ? `<div><span>Endereço</span><b>${esc(o.address)}</b><small>Área e prazo combinados com a loja</small></div>` : ''}
      <div><span>Pagamento</span><b>${esc(PAY[o.pay] || o.pay)}</b><small>Combinado na confirmação</small></div>
      ${o.note ? `<div class="span2"><span>Observação</span><p>${esc(o.note)}</p></div>` : ''}
    </div>
    <div class="row row--c"><a class="btn btn--y" href="#loja">Voltar à loja</a><a class="btn btn--soft" href="#conta">Minha conta</a></div>
  </div>`;
}
function viewServiceDetail(num) {
  const r = remoteRecord('os', num);
  if (r.st === 'locked') return lockedView(r.code, 'Acompanhar assistência');
  if (r.st === 'loading') return `<div class="wrap pagepad narrow">${loadingBox('Carregando solicitação...')}</div>`;
  if (r.st === 'err') return `<div class="wrap pagepad narrow">${r.err.status === 404 ? `<div class="empty"><h3>Solicitação não encontrada</h3><p>Confira o código e tente de novo.</p><a class="btn btn--y" href="#acompanhar">Acompanhar outro código</a></div>` : errorBox(r.err, 'os-' + num)}</div>`;
  const sv = r.data;
  const fresh = UI.fresh === sv.id;
  const flow = SVC_STATUS.map(s => s.id).filter(s => s !== 'cancelado');
  const q = sv.quote;
  const canDecide = q && sv.status === 'orcamento' && !q.decision;
  const decision = q && q.decision ? (q.decision === 'aprovado' ? `Aprovado por você em ${fmtDateTime(q.decidedAt)}` : `Recusado por você em ${fmtDateTime(q.decidedAt)}`) : '';
  return `<div class="wrap pagepad narrow">
    ${fresh ? `<div class="okhero"><span class="okhero__ic">${icon('check', 34)}</span><div><h1>Solicitação enviada</h1><p>Guarde o código <b class="mono">${sv.id}</b>. Leve o aparelho à unidade ${esc(unitName(sv.unitId))} para a avaliação.</p></div></div>` : `<h1 class="ptitle">Acompanhar assistência</h1>`}
    <div class="card od">
      <div class="od__head"><div><span class="muted">Solicitação</span><h2 class="mono">${sv.id}</h2><small class="muted">Aberta em ${fmtDateTime(sv.createdAt)} · ${esc(unitName(sv.unitId))}</small></div>${pill(svcLabel(sv.status), svcTone(sv.status))}</div>
      ${timeline(flow, sv.status, sv.history, svcLabel, sv.status === 'cancelado')}
    </div>
    ${q ? `<div class="card od quote"><div><span class="muted">Orçamento</span><b>${brl(q.value)}</b><small>${esc(q.note || '')}</small></div>
      ${canDecide ? `<p class="fine">Aprovando, o reparo começa. Recusando, a solicitação é encerrada e o aparelho fica disponível para retirada.</p><div class="row"><button class="btn btn--soft" data-act="quote-ask" data-num="${sv.num}" data-v="recusar" ${UI.busy ? 'disabled' : ''}>Recusar</button><button class="btn btn--y grow" data-act="quote-ask" data-num="${sv.num}" data-v="aprovar" ${UI.busy ? 'disabled' : ''}>${icon('check', 18)}Aprovar orçamento</button></div>` : decision ? `<p class="fine">${decision}.</p>` : ''}</div>` : ''}
    <div class="card od od--grid">
      <div><span>Aparelho</span><b>${esc(sv.brand)} ${esc(sv.model)}</b><small>${esc(sv.service)}</small></div>
      <div><span>Cliente</span><b>${esc(sv.customer.name)}</b><small>${esc(sv.customer.phone)}</small></div>
      <div class="span2"><span>Descrição do defeito</span><p>${esc(sv.desc)}</p></div>
    </div>
    <div class="row row--c"><a class="btn btn--y" href="#assistencia">Nova solicitação</a><a class="btn btn--soft" href="#conta">Minha conta</a></div>
  </div>`;
}

/* ---------- assistência ---------- */
function ensureSvc() {
  if (!UI.svc) { const c = loggedCustomer(); UI.svc = { name: c ? c.name : '', phone: c ? c.phone : '', brand: '', model: '', service: '', desc: '', unitId: S.unitId, err: {}, pick: null }; }
  return UI.svc;
}
const MODEL_HINTS = { Apple: ['iPhone 16', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11'], Samsung: ['Galaxy S24 FE', 'Galaxy A55 5G', 'Galaxy A34', 'Galaxy A15', 'Galaxy S21 FE'], Motorola: ['Moto G84 5G', 'Moto G54', 'Moto E14', 'Moto E13'], Xiaomi: ['Redmi Note 13', 'Redmi Note 12', 'Poco X6 Pro'], Outra: [] };
function viewAssist() {
  const f = ensureSvc();
  const picked = SERVICES.find(s => s.name === f.pick);
  const fe = k => f.err[k] ? `<p class="ferr" id="serr-${k}">${esc(f.err[k])}</p>` : '';
  return `<section class="ahero"><div class="ahero__in">
      <span class="locpill">${icon('wrench', 15)}ASSISTÊNCIA TÉCNICA</span>
      <h1>CUIDADO DE DOUTOR<br>PARA O SEU <span class="y">CELULAR.</span></h1>
      <p>Escolha o tipo de problema, conte o que aconteceu e acompanhe cada etapa da solicitação.</p>
      <div class="hero__ctas"><a class="btn btn--y btn--lg" href="#solicitar" data-act="scroll" data-to="svc-form">Solicitar orçamento ${icon('arrowR', 20)}</a><a class="btn btn--outline btn--lg" href="#acompanhar">Acompanhar solicitação</a></div>
    </div></section>
    <div class="wrap pagepad">
      <div class="sec__head"><h2 class="sec__t2">Qual é o problema?</h2></div>
      <div class="svcgrid" role="listbox" aria-label="Tipos de serviço">${SERVICES.map(s => `<button role="option" aria-selected="${f.pick === s.name}" class="svcpick ${f.pick === s.name ? 'on' : ''}" data-act="svc-pick" data-svc="${esc(s.name)}">${icon(s.icon, 28)}<span>${esc(s.name)}</span></button>`).join('')}</div>
      ${picked ? `<div class="svcdesc card">${icon(picked.icon, 30)}<div><h3>${esc(picked.name)}</h3><p>${esc(picked.desc)}</p><p class="fine">Valor e prazo definidos pela loja após a avaliação do aparelho.</p></div><button class="btn btn--y btn--sm" data-act="scroll" data-to="svc-form">Solicitar este serviço</button></div>` : `<p class="muted small" style="margin-top:12px">Toque em um serviço para ver a descrição.</p>`}
      <form class="card svcform" id="svc-form" data-form="svc" novalidate>
        <h2>Solicitar atendimento</h2><p class="muted">Você recebe um código para acompanhar a solicitação e aprovar o orçamento.</p>
        <div class="form form--2">
          <div class="field ${f.err.name ? 'bad' : ''}"><label for="sv-name">Seu nome *</label><input id="sv-name" data-in="svc.name" value="${esc(f.name)}" autocomplete="name">${fe('name')}</div>
          <div class="field ${f.err.phone ? 'bad' : ''}"><label for="sv-phone">Telefone com DDD *</label><input id="sv-phone" data-in="svc.phone" data-mask="phone" inputmode="tel" autocomplete="tel" value="${esc(f.phone)}" placeholder="(11) 90000-0000">${fe('phone')}</div>
          <div class="field ${f.err.brand ? 'bad' : ''}"><label for="sv-brand">Marca do aparelho *</label><select id="sv-brand" data-in="svc.brand"><option value="">Selecione</option>${Object.keys(MODEL_HINTS).map(b => `<option ${f.brand === b ? 'selected' : ''}>${b}</option>`).join('')}</select>${fe('brand')}</div>
          <div class="field ${f.err.model ? 'bad' : ''}"><label for="sv-model">Modelo do aparelho *</label><input id="sv-model" data-in="svc.model" value="${esc(f.model)}" list="model-hints" placeholder="Ex.: Galaxy A15"><datalist id="model-hints">${(MODEL_HINTS[f.brand] || Object.values(MODEL_HINTS).flat()).map(m => `<option value="${m}">`).join('')}</datalist>${fe('model')}</div>
          <div class="field span2 ${f.err.service ? 'bad' : ''}"><label for="sv-service">Tipo de problema *</label><select id="sv-service" data-in="svc.service"><option value="">Selecione</option>${SERVICES.map(s => `<option ${f.service === s.name ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>${fe('service')}</div>
          <div class="field span2 ${f.err.desc ? 'bad' : ''}"><label for="sv-desc">Descreva o defeito *</label><textarea id="sv-desc" data-in="svc.desc" rows="3" maxlength="2000" placeholder="O que aconteceu? Desde quando?">${esc(f.desc)}</textarea>${fe('desc')}</div>
        </div>
        <div class="opt__h"><span>Unidade de preferência</span><b>${esc(unitName(f.unitId))}</b></div>${unitPills(f.unitId, 'svc-unit')}
        ${f.err.submit ? `<p class="ferr" role="alert">${esc(f.err.submit)}</p>` : ''}
        <div class="ck__nav"><span class="fine">O aparelho é considerado recebido quando chega à unidade.</span><button class="btn btn--y btn--lg" type="submit" ${UI.busy ? 'disabled' : ''}>${UI.busy ? '<span class="spin spin--sm" aria-hidden="true"></span>Enviando...' : 'Enviar solicitação ' + icon('arrowR', 18)}</button></div>
      </form>
    </div>`;
}
function viewTrack() {
  const known = Object.keys(TOKENS.acessos()).sort().reverse().slice(0, 10);
  const c = loggedCustomer();
  return `<div class="wrap pagepad narrow"><h1 class="ptitle">Acompanhar pedido ou serviço</h1><p class="psub">Digite o código da confirmação e o telefone usado.</p>
    <form class="card trackf" data-form="track" novalidate>
      <div class="field ${UI.trackErr ? 'bad' : ''}"><label for="track">Código do pedido ou da solicitação</label><input id="track" data-in="track" value="${esc(UI.track)}" placeholder="PED-1001 ou OS-2001" autocomplete="off"></div>
      <div class="field ${UI.trackErr ? 'bad' : ''}"><label for="track-phone">Telefone com DDD</label><div class="trackf__row"><input id="track-phone" data-in="trackPhone" data-mask="phone" inputmode="tel" autocomplete="tel" value="${esc(UI.trackPhone)}" placeholder="(11) 90000-0000"><button class="btn btn--y" type="submit" ${UI.busy ? 'disabled' : ''}>Acompanhar</button></div>${UI.trackErr ? `<p class="ferr" role="alert">${esc(UI.trackErr)}</p>` : ''}</div>
    </form>
    ${known.length ? `<h2 class="sec__t2" style="margin-top:28px">Consultados neste aparelho</h2><ul class="recs">${known.map(k => `<li><a href="#${k.startsWith('PED') ? 'pedido-' + k.slice(4) : 'os-' + k.slice(3)}"><span class="recs__ic">${icon(k.startsWith('PED') ? 'box' : 'wrench', 20)}</span><span class="recs__t"><b class="mono">${esc(k)}</b><small>Ver detalhes</small></span>${icon('chevR', 16)}</a></li>`).join('')}</ul>` : ''}
    <p class="fine" style="margin-top:20px">${c ? `Conectado como ${esc(c.name)}. <a class="lnk" href="#conta">Ver todos os seus registros</a>` : 'Com uma conta você vê todos os seus pedidos e assistências. <a class="lnk" href="#conta">Entrar ou criar conta</a>'}</p></div>`;
}
function recordList(items) {
  return `<ul class="recs">${items.map(({ t, x }) => t === 'o'
    ? `<li><a href="#pedido-${x.num}"><span class="recs__ic">${icon('box', 20)}</span><span class="recs__t"><b class="mono">${x.id}</b><small>${fmtDateTime(x.createdAt)} · ${plural(x.items.reduce((s, l) => s + l.qty, 0), 'item', 'itens')} · ${brl(x.total)}</small></span>${pill(orderStatusLabel(x), orderTone(x.status))}</a></li>`
    : `<li><a href="#os-${x.num}"><span class="recs__ic">${icon('wrench', 20)}</span><span class="recs__t"><b class="mono">${x.id}</b><small>${fmtDateTime(x.createdAt)} · ${esc(x.service)} · ${esc(x.brand)} ${esc(x.model)}</small></span>${pill(svcLabel(x.status), svcTone(x.status))}</a></li>`).join('')}</ul>`;
}
function contactOf(u) { const w = digits(u.whatsapp || S.config.whatsapp || ''); return w ? (w.length <= 11 ? '55' + w : w) : ''; }
function viewContact() {
  const faq = [
    ['Como escolho a unidade?', 'Use o seletor de unidade no topo da loja ou na página inicial. A escolha define onde a disponibilidade dos produtos é consultada e sugere o local de retirada no checkout.'],
    ['Como funciona o pagamento?', S.config.paymentText || 'O pagamento é combinado com a loja na confirmação do pedido.'],
    ['Como funciona a retirada na unidade?', 'No checkout você escolhe a unidade e a modalidade de retirada. Quando o pedido estiver pronto, o status muda para "Pronto para retirada".'],
    ['Vocês fazem entrega?', S.config.deliveryText || 'A entrega é combinada com a loja.'],
    ['Como acompanho meu conserto?', 'Depois de enviar a solicitação, use o código OS e o seu telefone na página "Acompanhar". Por lá você também aprova ou recusa o orçamento.'],
    ['Existe garantia nos serviços?', 'As condições de garantia são informadas pela loja no orçamento de cada serviço.'],
  ];
  return `<div class="wrap pagepad"><h1 class="ptitle">Fale com o Doutor</h1><p class="psub">Escolha como podemos ajudar.</p>
    <div class="contact">
      <a class="ccard ccard--dark" href="#assistencia">${icon('wrench', 30)}<b>Assistência técnica</b><span>Solicitar orçamento de conserto</span>${icon('arrowR', 20)}</a>
      <a class="ccard" href="#acompanhar">${icon('box', 30)}<b>Acompanhar</b><span>Pedido ou solicitação de assistência</span>${icon('arrowR', 20)}</a>
      <button class="ccard" data-act="contact-open">${icon('chat', 30)}<b>Mensagem para a unidade</b><span>Fale com a loja pelo WhatsApp</span>${icon('arrowR', 20)}</button>
    </div>
    <h2 class="sec__t2" style="margin-top:32px">Unidades</h2>
    ${unitCards()}
    <h2 class="sec__t2" style="margin-top:32px">Perguntas frequentes</h2>
    <div class="faq">${faq.map(([q, a]) => `<details><summary>${esc(q)}${icon('chevD', 18)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div>`;
}
function unitCards() {
  const dd = v => v ? esc(v) : '<span class="muted">Consulte a loja</span>';
  return `<div class="ucards">${shopUnits().map(u => {
    const skus = activeProducts().filter(p => unitStock(p, u.id) > 0).length;
    const wa = contactOf(u);
    return `<div class="ucard ${S.unitId === u.id ? 'on' : ''}"><div class="ucard__h">${icon('pin', 22)}<h3>${esc(u.name)}</h3>${S.unitId === u.id ? '<span class="tag-y">Selecionada</span>' : ''}</div>
      <dl><div><dt>Endereço</dt><dd>${dd(u.address)}</dd></div><div><dt>Horário</dt><dd>${dd(u.hours)}</dd></div><div><dt>Contato</dt><dd>${u.whatsapp ? `<a class="lnk" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp ${esc(maskPhone(u.whatsapp))}</a>` : u.phone ? esc(u.phone) : dd('')}</dd></div><div><dt>Produtos com estoque</dt><dd>${skus}</dd></div></dl>
      ${S.unitId === u.id ? '<button class="btn btn--soft btn--block" disabled>Unidade atual</button>' : `<button class="btn btn--y btn--block" data-act="set-unit" data-unit="${u.id}">Escolher esta unidade</button>`}</div>`;
  }).join('')}</div>`;
}
function viewUnits() {
  return `<div class="wrap pagepad"><h1 class="ptitle">Escolha sua unidade</h1><p class="psub">A unidade define a consulta de estoque, a retirada no checkout e o direcionamento das solicitações de assistência.</p>${unitCards()}</div>`;
}

/* ---------- Minha conta (telefone + senha) ---------- */
function viewAccount() {
  const c = loggedCustomer();
  const a = UI.acc;
  if (!c) {
    const isNew = a.mode === 'cadastro';
    return `<div class="wrap pagepad narrow"><h1 class="ptitle">Minha conta</h1><p class="psub">${isNew ? 'Crie sua conta com o telefone que você usa na loja.' : 'Entre com seu telefone e senha para ver seus pedidos e assistências.'}</p>
      <div class="seg seg--acc" role="tablist"><button role="tab" aria-selected="${!isNew}" class="${!isNew ? 'on' : ''}" data-act="acc-mode" data-v="login">Entrar</button><button role="tab" aria-selected="${isNew}" class="${isNew ? 'on' : ''}" data-act="acc-mode" data-v="cadastro">Criar conta</button></div>
      <form class="card form" data-form="acc" novalidate>
        ${isNew ? `<div class="field"><label for="ac-name">Nome completo *</label><input id="ac-name" data-in="acc.name" value="${esc(a.name)}" autocomplete="name"></div>` : ''}
        <div class="field"><label for="ac-phone">Telefone com DDD *</label><input id="ac-phone" data-in="acc.phone" data-mask="phone" inputmode="tel" autocomplete="tel" value="${esc(a.phone)}" placeholder="(11) 90000-0000"></div>
        ${isNew ? `<div class="field"><label for="ac-email">E-mail <span class="opt-l">opcional</span></label><input id="ac-email" type="email" data-in="acc.email" value="${esc(a.email)}" autocomplete="email"></div>` : ''}
        <div class="field"><label for="ac-pass">Senha *</label><input id="ac-pass" type="password" data-in="acc.pass" value="${esc(a.pass)}" autocomplete="${isNew ? 'new-password' : 'current-password'}" ${isNew ? 'minlength="6"' : ''}>${isNew ? '<small class="fine">Mínimo de 6 caracteres.</small>' : ''}</div>
        ${isNew && a.needCode ? `<div class="field"><label for="ac-code">Código de um pedido ou assistência *</label><input id="ac-code" data-in="acc.code" value="${esc(a.code)}" placeholder="PED-1001 ou OS-2001"><small class="fine">Este telefone já tem histórico na loja. O código confirma que é você.</small></div>` : ''}
        ${a.err ? `<p class="ferr" role="alert">${esc(a.err)}</p>` : ''}
        <button class="btn btn--y btn--block" type="submit" ${UI.busy ? 'disabled' : ''}>${UI.busy ? '<span class="spin spin--sm" aria-hidden="true"></span>Aguarde...' : isNew ? 'Criar conta' : 'Entrar'}</button>
      </form>
      <p class="fine" style="margin-top:16px">Não precisa de conta para comprar. Para consultar um pedido avulso, use <a class="lnk" href="#acompanhar">Acompanhar</a>.</p></div>`;
  }
  const r = need('conta', () => api('/conta/me', { auth: 'cliente' }));
  if (r.st === 'loading') return `<div class="wrap pagepad narrow"><h1 class="ptitle">Minha conta</h1>${loadingBox()}</div>`;
  if (r.st === 'err') {
    if (r.err.status === 401) { delete R.conta; return viewAccount(); }
    return `<div class="wrap pagepad narrow"><h1 class="ptitle">Minha conta</h1>${errorBox(r.err, 'conta')}</div>`;
  }
  const { customer, orders, services } = r.data;
  const spent = orders.filter(o => o.status === 'concluido').reduce((s, o) => s + o.total, 0);
  const items = [...orders.map(o => ({ t: 'o', x: o })), ...services.map(s => ({ t: 's', x: s }))].sort((a, b) => b.x.createdAt - a.x.createdAt);
  return `<div class="wrap pagepad narrow"><h1 class="ptitle">Minha conta</h1>
    <div class="card prof"><span class="prof__av">${esc(customer.name.split(' ').map(x => x[0]).slice(0, 2).join(''))}</span><div><h2>${esc(customer.name)}</h2><p class="muted">${esc(customer.phone)}${customer.email ? ' · ' + esc(customer.email) : ''}</p></div></div>
    <div class="kpis3"><div><span>Pedidos</span><b>${orders.length}</b></div><div><span>Compras concluídas</span><b>${brl(spent)}</b></div><div><span>Assistências</span><b>${services.length}</b></div></div>
    <h2 class="sec__t2">Histórico</h2>${items.length ? recordList(items) : '<p class="muted">Sem registros ainda.</p>'}
    <button class="lnk lnk--muted" data-act="acc-logout">${icon('logout', 16)}Sair da conta</button></div>`;
}

/* ---------- menu lateral, modais e toasts ---------- */
function menuDrawer() {
  if (!UI.menu) return '';
  const links = [['inicio', 'home', 'Início'], ['loja', 'store', 'Loja'], ['loja-celulares', 'phone', 'Celulares'], ['loja-acessorios', 'grid', 'Acessórios'], ['assistencia', 'wrench', 'Assistência técnica'], ['acompanhar', 'box', 'Acompanhar pedido ou serviço'], ['atendimento', 'chat', 'Atendimento'], ['unidades', 'pin', 'Unidades'], ['conta', 'user', 'Minha conta'], ['sacola', 'bag', 'Sacola']];
  return `<div class="scrim" data-act="menu-close"></div><aside class="mdrawer" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="mdrawer__h">${brand('line')}<button class="hd__btn" data-act="menu-close" aria-label="Fechar menu">${icon('x', 24)}</button></div>
    <nav>${links.map(([h, ic, l]) => `<a href="#${h}" data-act="menu-close-go">${icon(ic, 21)}<span>${l}</span>${icon('chevR', 16)}</a>`).join('')}</nav>
    <div class="mdrawer__unit"><h4>Sua unidade</h4>${unitPills(S.unitId, 'set-unit', { compact: true })}</div>
  </aside>`;
}
function modalHtml() {
  const m = UI.modal; if (!m) return '';
  let inner = '', cls = '';
  if (m.type === 'quick') {
    const p = P(m.id); if (!p) return '';
    const sel = getSel(p); const complete = selComplete(p, sel);
    const vkey = complete ? vkeyOf(p, sel) : null; const st = complete ? stockOf(p.id, vkey, S.unitId) : 0;
    const label = !complete ? `Selecione ${missingOpts(p, sel).join(' e ')}` : st === 0 ? `Indisponível em ${unitName(S.unitId)}` : `Adicionar · ${brl(variantPrice(p, sel))}`;
    cls = 'sheet';
    inner = `<div class="qa"><div class="qa__h"><span class="qa__img">${productArt(p, sel)}</span><div><h2>${esc(p.name)}</h2><b>${brl(complete ? variantPrice(p, sel) : priceRange(p)[0])}</b><small>${esc(unitName(S.unitId))} · ${complete ? (st ? `${st} un. em estoque` : 'sem estoque') : 'escolha as opções'}</small></div></div>
      <div class="pd__opts">${optionSelector(p, 'qa')}</div>
      <div class="row"><a class="btn btn--soft" href="#produto-${p.id}" data-act="modal-close-go">Ver detalhes</a><button class="btn btn--y grow" data-act="qa-add" data-id="${p.id}" ${complete && st ? '' : 'disabled'}>${esc(label)}</button></div></div>`;
  } else if (m.type === 'filters') {
    cls = 'sheet';
    inner = `<h2>Filtros</h2>${filterPanel()}<div class="row"><button class="btn btn--soft" data-act="clear-filters">Limpar</button><button class="btn btn--y grow" data-act="modal-close">Ver ${plural(filteredProducts().length + filteredServices().length, 'resultado', 'resultados')}</button></div>`;
  } else if (m.type === 'quote') {
    const ok = m.v === 'aprovar';
    inner = `<h2>${ok ? 'Aprovar orçamento?' : 'Recusar orçamento?'}</h2><p>${ok ? 'A loja será avisada pelo painel e o reparo pode começar.' : 'A solicitação será encerrada e o aparelho fica disponível para retirada na unidade.'}</p><div class="row"><button class="btn btn--soft grow" data-act="modal-close">Voltar</button><button class="btn ${ok ? 'btn--y' : 'btn--dark'} grow" data-act="quote-do" data-num="${m.num}" data-v="${m.v}" ${UI.busy ? 'disabled' : ''}>${ok ? 'Aprovar' : 'Recusar'}</button></div>`;
  } else if (m.type === 'contact') {
    const unitId = m.unitId || S.unitId;
    const u = UNITS.find(x => x.id === unitId) || {};
    const msg = m.msg != null ? m.msg : `Olá! Vim pelo site da Doutor do Celular e gostaria de falar com a unidade ${unitName(unitId)}.`;
    m.msg = msg;
    const wa = contactOf(u);
    inner = `<h2>Mensagem para a unidade</h2><p class="muted">${wa ? 'Escreva a mensagem e abra o WhatsApp da unidade para enviar.' : 'O WhatsApp desta unidade ainda não foi cadastrado. Copie a mensagem e envie pelo canal da loja.'}</p>
      <div class="opt__h"><span>Unidade</span><b>${esc(unitName(unitId))}</b></div>${unitPills(unitId, 'contact-unit', { compact: true })}
      <div class="field"><label for="ct-msg">Mensagem</label><textarea id="ct-msg" rows="4" data-in="contact-msg">${esc(msg)}</textarea></div>
      <div class="row"><button class="btn btn--soft grow" data-act="copy" data-src="ct-msg">${icon('copy', 18)}Copiar</button>${wa ? `<a class="btn btn--y grow" id="wa-go" href="https://wa.me/${wa}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${icon('chat', 18)}Abrir WhatsApp</a>` : `<button class="btn btn--y grow" data-act="modal-close">Fechar</button>`}</div>`;
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
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 3600);
}
