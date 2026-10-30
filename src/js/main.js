/* ============ Rotas, renderização e eventos ============ */
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'inicio';
  if (h === 'gestao') return { admin: true, name: 'dashboard', h };
  if (h.startsWith('gestao-')) return { admin: true, name: h.slice(7), h };
  if (h.startsWith('produto-')) return { name: 'produto', id: h.slice(8), h };
  if (h.startsWith('pedido-')) return { name: 'pedido', id: h.slice(7), h };
  if (h.startsWith('os-')) return { name: 'os', id: h.slice(3), h };
  if (h === 'loja' || h.startsWith('loja-')) return { name: 'loja', param: h.slice(5), h };
  if (h === 'solicitar') return { name: 'assistencia', h };
  const known = ['inicio', 'sacola', 'checkout', 'assistencia', 'acompanhar', 'atendimento', 'unidades', 'conta'];
  return { name: known.includes(h) ? h : 'inicio', h };
}
function applyCatalogPreset(param) {
  const c = UI.cat;
  c.sub = null; c.brand = null;
  if (!param) { c.group = 'all'; return; }
  if (GROUPS[param]) { c.group = param; return; }
  const s = SUBS.find(x => x.id === param);
  if (s) { c.group = s.group; c.sub = s.id; return; }
  c.group = 'all';
}
const app = () => $('#app');
function render() {
  const r = route();
  const ae = document.activeElement;
  const fid = ae && ae.id, ss = ae && ae.selectionStart, se = ae && ae.selectionEnd;
  let html;
  if (r.admin) {
    html = adminShell(r);
    document.title = 'Gestão · Doutor do Celular';
  } else {
    let v;
    switch (r.name) {
      case 'loja': v = viewCatalog(); break;
      case 'produto': v = viewProduct(r.id); break;
      case 'sacola': v = viewBag(); break;
      case 'checkout': v = viewCheckout(); break;
      case 'pedido': v = viewOrder(r.id); break;
      case 'os': v = viewServiceDetail(r.id); break;
      case 'assistencia': v = viewAssist(); break;
      case 'acompanhar': v = viewTrack(); break;
      case 'atendimento': v = viewContact(); break;
      case 'unidades': v = viewUnits(); break;
      case 'conta': v = viewAccount(); break;
      default: v = viewHome();
    }
    const showBar = (r.name === 'loja' || r.name === 'produto') && cartCount() > 0;
    html = header(r.name === 'inicio' ? 'home' : 'store', r) + `<main id="main" class="main main--${r.name} ${showBar ? 'has-bar' : ''}">${v}</main>` + footer() + (showBar ? bagBar() : '') + bottomNav(r) + menuDrawer();
    document.title = 'Doutor do Celular · Kauan Cell';
  }
  html += modalHtml();
  app().innerHTML = html;
  document.body.classList.toggle('has-bar', !r.admin && (r.name === 'loja' || r.name === 'produto') && cartCount() > 0);
  document.body.classList.toggle('lock', !!(UI.modal || UI.menu || (r.admin && (UI.adm.drawer || UI.adm.admNav))));
  document.body.classList.toggle('is-admin', !!r.admin);
  if (fid) { const el = document.getElementById(fid); if (el && el !== document.activeElement) { el.focus({ preventScroll: true }); try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) { } } }
}
function rerenderCatalogResults() {
  const box = $('#cat-results');
  if (!box) return render();
  box.innerHTML = catalogResults();
  const side = $('.filters-side'); if (side) side.innerHTML = filterPanel();
  const x = $('.searchbox__x'); if (x) x.hidden = !UI.cat.q;
}
let lastHash = null;
function onRoute() {
  const r = route();
  if (r.h === lastHash) return render();
  const prevAdmin = lastHash && (lastHash === 'gestao' || lastHash.startsWith('gestao'));
  lastHash = r.h;
  UI.menu = false; UI.modal = null; UI.adm.admNav = false;
  if (!r.admin || !prevAdmin) UI.adm.drawer = null;
  if (r.name === 'loja') applyCatalogPreset(r.param);
  if (r.name === 'checkout' && UI.ck && !cartCount()) UI.ck = null;
  if (r.admin) UI.adm.drawer = null;
  render();
  if (r.h === 'solicitar') { const f = $('#svc-form'); if (f) f.scrollIntoView({ block: 'start' }); return; }
  window.scrollTo(0, 0);
}
function go(h) { if (location.hash === '#' + h) onRoute(); else location.hash = h; }

/* ---------- ações ---------- */
const ACT = {
  'menu': () => { UI.menu = true; render(); setTimeout(() => { const a = $('.mdrawer nav a'); a && a.focus(); }, 0); },
  'menu-close': () => { UI.menu = false; render(); },
  'menu-close-go': (el, e) => { UI.menu = false; if (el.getAttribute('href') === location.hash || (el.getAttribute('href') === '#inicio' && !location.hash)) render(); },
  'focus-search': () => { if (route().name !== 'loja') { location.hash = 'loja'; setTimeout(() => { const q = $('#q'); q && q.focus(); }, 60); } else { const q = $('#q'); q && (q.focus(), q.scrollIntoView({ block: 'center', behavior: 'smooth' })); } },
  'set-unit': el => { S.unitId = el.dataset.unit; save(); render(); toast(`Unidade selecionada: ${unitName(S.unitId)}`, 'ok'); },
  'cat-all': (el, e) => { e.preventDefault(); UI.cat.group = 'all'; UI.cat.sub = null; UI.cat.brand = null; go('loja'); },
  'cat-pill': el => {
    const v = el.dataset.p; const c = UI.cat;
    if (!v) { c.sub = null; c.brand = null; }
    else if (v.startsWith('brand:')) { c.brand = v.slice(6); c.sub = null; }
    else if (v.startsWith('grp:')) { go('loja-assistencia'); return; }
    else { c.sub = v; c.brand = null; }
    render();
    const on = $('.pillb.on'); on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  },
  'clear-q': () => { UI.cat.q = ''; const q = $('#q'); if (q) { q.value = ''; q.focus(); } rerenderCatalogResults(); },
  'sugg': el => { UI.cat.q = el.dataset.q; UI.cat.sub = null; UI.cat.brand = null; UI.cat.brands = []; UI.cat.price = null; UI.cat.compat = null; UI.cat.avail = false; render(); },
  'open-filters': () => { UI.modal = { type: 'filters' }; render(); },
  'f-brand': el => { const b = el.dataset.v, a = UI.cat.brands; UI.cat.brands = a.includes(b) ? a.filter(x => x !== b) : [...a, b]; refreshFilters(); },
  'f-price': el => { UI.cat.price = UI.cat.price === el.dataset.v ? null : el.dataset.v; refreshFilters(); },
  'f-avail': () => { UI.cat.avail = !UI.cat.avail; refreshFilters(); },
  'f-compat': el => { UI.cat.compat = UI.cat.compat === el.dataset.v ? null : el.dataset.v; refreshFilters(); },
  'rm-filter': el => { const k = el.dataset.k, c = UI.cat; if (k === 'q') c.q = ''; else if (k.startsWith('brand:')) c.brands = c.brands.filter(b => b !== k.slice(6)); else if (k === 'price') c.price = null; else if (k === 'avail') c.avail = false; else if (k === 'compat') c.compat = null; render(); },
  'clear-filters': () => { Object.assign(UI.cat, { q: '', brands: [], price: null, avail: false, compat: null }); render(); },
  'quickadd': el => {
    const p = P(el.dataset.id); const vs = variantsOf(p);
    if (vs.length === 1) { addToCart(p.id, vs[0]); render(); return; }
    UI.modal = { type: 'quick', id: p.id }; render();
  },
  'pick': el => {
    const p = P(el.dataset.id), sel = getSel(p), o = el.dataset.o, v = el.dataset.v;
    if (sel[o] === v) { const opt0 = p.options.find(x => x.name === o); if (opt0.values.length > 1) delete sel[o]; }
    else {
      sel[o] = v;
      (p.options || []).forEach(op => { if (op.name !== o && sel[op.name] && !valueAllowed(p, { ...sel, [op.name]: undefined }, op.name, sel[op.name])) delete sel[op.name]; });
    }
    UI.qty[p.id] = 1;
    render();
  },
  'clear-sel': el => { delete UI.sel[el.dataset.id]; render(); },
  'pd-view': el => { UI.pdView[el.dataset.id] = el.dataset.v; render(); },
  'pd-qty': el => { const id = el.dataset.id; UI.qty[id] = Math.max(1, (UI.qty[id] || 1) + Number(el.dataset.d)); render(); },
  'pd-add': el => { const p = P(el.dataset.id); const sel = getSel(p); if (!selComplete(p, sel)) return; if (addToCart(p.id, { ...sel }, UI.qty[p.id] || 1)) { UI.qty[p.id] = 1; render(); } },
  'qa-add': el => { const p = P(el.dataset.id); const sel = getSel(p); if (!selComplete(p, sel)) return; if (addToCart(p.id, { ...sel }, 1)) { UI.modal = null; render(); } },
  'back-store': (el, e) => { if (history.length > 1 && document.referrer !== undefined && lastWasStore) { e.preventDefault(); history.back(); } },
  'cart-qty': el => { const [pid, vkey] = el.dataset.id.split('::'); const it = S.cart.find(i => i.pid === pid && i.vkey === vkey); if (!it) return; const max = stockOf(pid, vkey, S.unitId); const nq = it.qty + Number(el.dataset.d); if (nq < 1) return; if (nq > Math.max(max, it.qty)) { toast(`Limite do estoque demonstrativo em ${unitName(S.unitId)}.`, 'warn'); return; } it.qty = nq; save(); render(); },
  'cart-rm': el => { const [pid, vkey] = el.dataset.k.split('::'); const it = S.cart.find(i => i.pid === pid && i.vkey === vkey); S.cart = S.cart.filter(i => i !== it); save(); render(); toast(`${P(pid).name} removido da sacola`, 'ok'); },
  'ck-next': () => { const ck = ensureCk(); if (!validateStep(ck, ck.step)) { render(); const b = $('.field.bad input, .ferr'); b && b.focus && b.focus(); return; } ck.step++; render(); window.scrollTo(0, 0); },
  'ck-back': () => { const ck = ensureCk(); ck.err = {}; ck.step = Math.max(1, ck.step - 1); render(); },
  'ck-unit': el => { const ck = ensureCk(); ck.unitId = el.dataset.unit; ck.err = {}; render(); },
  'ck-mode': el => { const ck = ensureCk(); ck.mode = el.dataset.v; render(); },
  'ck-pay': el => { ensureCk().pay = el.dataset.v; render(); },
  'ck-quickfill': () => { const c = custById('c01'); const ck = ensureCk(); ck.name = c.name; ck.phone = c.phone; ck.email = c.email; ck.err = {}; render(); },
  'ck-confirm': () => {
    const ck = ensureCk();
    if (!validateStep(ck, 2)) { ck.step = 2; render(); return; }
    if (!validateStep(ck, 3)) { ck.step = 3; render(); return; }
    const o = createOrder(ck); UI.ck = null; go('pedido-' + o.num);
  },
  'svc-request': el => { const f = ensureSvc(); f.pick = el.dataset.svc; f.service = el.dataset.svc; go('solicitar'); },
  'svc-pick': el => { const f = ensureSvc(); f.pick = el.dataset.svc; f.service = el.dataset.svc; render(); },
  'svc-unit': el => { ensureSvc().unitId = el.dataset.unit; render(); },
  'scroll': (el, e) => { e.preventDefault(); const t = document.getElementById(el.dataset.to); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'track-try': el => { UI.track = el.dataset.v; doTrack(); },
  'contact-open': () => { UI.modal = { type: 'contact', unitId: S.unitId, msg: null }; render(); },
  'contact-unit': el => { UI.modal.unitId = el.dataset.unit; UI.modal.msg = null; render(); },
  'copy': el => {
    const src = document.getElementById(el.dataset.src); if (!src) return; const text = src.value;
    const done = () => toast('Mensagem copiada. Nada foi enviado.', 'ok');
    const legacy = () => { const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } t.remove(); if (ok) done(); else { src.classList.remove('sr'); src.focus(); src.select(); toast('Selecione e copie o texto manualmente.', 'warn'); } };
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(legacy); else legacy(); } catch (e) { legacy(); }
  },
  'demo-profile': () => { S.currentCustomerId = 'c01'; save(); render(); },
  'logout-demo': () => { S.currentCustomerId = null; save(); render(); },
  'modal-close': () => { UI.modal = null; render(); },
  'modal-close-go': () => { UI.modal = null; },
  'reset-ask': () => { UI.menu = false; UI.adm.admNav = false; UI.modal = { type: 'reset' }; render(); },
  'reset-do': () => { resetAll(); UI.modal = null; UI.menu = false; render(); toast('Dados iniciais restaurados', 'ok'); },
  /* gestão */
  'adm-nav': () => { UI.adm.admNav = !UI.adm.admNav; render(); },
  'adm-period': el => { UI.adm.period = el.dataset.v; render(); },
  'adm-open': el => { if (!el.dataset.id) return; UI.adm.drawer = { type: el.dataset.type, id: el.dataset.id }; if (el.dataset.type === 'product') UI.adm.edit = null; render(); setTimeout(() => { const d = $('.drawer'); d && (d.scrollTop = 0); }, 0); },
  'adm-close': () => { UI.adm.drawer = null; render(); },
  'adm-ord-status': el => { UI.adm.ord.status = el.dataset.v; render(); },
  'adm-svc-status': el => { UI.adm.svc.status = el.dataset.v; render(); },
  'adm-svc-view': el => { UI.adm.svc.view = el.dataset.v; render(); },
  'adm-stk-unit': el => { UI.adm.stk.unit = el.dataset.v; UI.adm.stk.limit = 40; render(); },
  'adm-prod-inactive': () => { UI.adm.prod.inactive = !UI.adm.prod.inactive; render(); },
  'stk-more': () => { UI.adm.stk.limit += 40; render(); },
  'stk-preset': () => { Object.assign(UI.adm.stk, { sit: 'low', unit: 'all', q: '', sub: 'all' }); },
  'adm-preset': el => {
    const v = el.dataset.v;
    if (v === 'ord-wait') Object.assign(UI.adm.ord, { status: 'wait', unit: 'all', q: '' });
    else if (v === 'ord-ready') Object.assign(UI.adm.ord, { status: 'pronto', unit: 'all', q: '' });
    else if (v === 'stk-low') Object.assign(UI.adm.stk, { sit: 'low', unit: 'all', q: '', sub: 'all' });
    else if (v.startsWith('stk-unit-')) Object.assign(UI.adm.stk, { unit: v.slice(9), sit: 'all', q: '', sub: 'all' });
    else if (v.startsWith('ord-unit-')) Object.assign(UI.adm.ord, { unit: v.slice(9), status: 'all', q: '' });
    else if (v.startsWith('stk-q-')) Object.assign(UI.adm.stk, { q: v.slice(6), unit: 'all', sit: 'all', sub: 'all' });
    UI.adm.drawer = null;
  },
  'ord-set': el => { const o = S.orders.find(x => x.id === el.dataset.id); if (setOrderStatus(o, el.dataset.v)) { render(); toast(`${o.id}: ${orderStatusLabel(o)}`, 'ok'); } else render(); },
  'svc-set': el => { const sv = S.services.find(x => x.id === el.dataset.id); setServiceStatus(sv, el.dataset.v); render(); toast(`${sv.id}: ${svcLabel(sv.status)}`, 'ok'); },
  'stk-adj': el => { const k = el.dataset.k; S.stock[k] = Math.max(0, (S.stock[k] || 0) + Number(el.dataset.d)); save(); render(); },
  'prod-toggle': el => { const p = P(el.dataset.id); p.active = !p.active; save(); render(); toast(p.active ? `${p.name} reativado na loja` : `${p.name} desativado e oculto da loja`, 'ok'); },
  'np-open': () => { UI.adm.np = { name: '', sub: 'capinhas', brand: 'Diversas', price: '', stock: '5', colors: ['Preto'], desc: '', err: {} }; UI.modal = { type: 'adm', sub: 'np' }; render(); },
  'np-color': el => { const c = el.dataset.v, a = UI.adm.np.colors; UI.adm.np.colors = a.includes(c) ? a.filter(x => x !== c) : [...a, c]; render(); },
};
let lastWasStore = false;
function refreshFilters() { if (UI.modal && UI.modal.type === 'filters') render(); else rerenderCatalogResults(); }
function doTrack() {
  const v = UI.track.trim().toUpperCase().replace(/\s/g, '');
  const m = v.match(/^(PED|OS)?-?(\d{3,5})$/);
  UI.trackErr = '';
  if (m) {
    const num = m[2];
    if ((m[1] === 'PED' || !m[1]) && S.orders.some(o => String(o.num) === num)) return go('pedido-' + num);
    if ((m[1] === 'OS' || !m[1]) && S.services.some(s => String(s.num) === num)) return go('os-' + num);
  }
  UI.trackErr = 'Código não encontrado neste protótipo. Use o formato PED-1044 ou OS-2039.';
  render();
}
const parseMoney = s => { const n = Number(String(s).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isFinite(n) ? n : NaN; };

/* ---------- formulários ---------- */
const FORMS = {
  svc: () => {
    const f = ensureSvc(); const err = {};
    if (f.name.trim().length < 3) err.name = 'Informe seu nome.';
    const d = digits(f.phone); if (d.length < 10 || d.length > 11) err.phone = 'Informe um telefone com DDD.';
    if (!f.brand) err.brand = 'Escolha a marca.';
    if (f.model.trim().length < 2) err.model = 'Informe o modelo.';
    if (!f.service) err.service = 'Escolha o tipo de problema.';
    if (f.desc.trim().length < 8) err.desc = 'Descreva o defeito em poucas palavras.';
    f.err = err;
    if (Object.keys(err).length) { render(); const b = $('.svcform .field.bad input, .svcform .field.bad select, .svcform .field.bad textarea'); b && b.focus(); return; }
    const sv = createService(f); UI.svc = null; go('os-' + sv.num);
  },
  track: () => doTrack(),
  quote: form => {
    const sv = S.services.find(x => x.id === form.dataset.id); const qf = UI.adm.quote[sv.id];
    const v = parseMoney(qf.value);
    if (!(v > 0)) { toast('Informe um valor válido para o orçamento.', 'bad'); return; }
    sv.quote = { value: Math.round(v * 100) / 100, note: qf.note.trim() || 'Valor demonstrativo registrado pela equipe.' };
    if (['recebida', 'avaliacao', 'diagnostico'].includes(sv.status)) setServiceStatus(sv, 'orcamento'); else save();
    delete UI.adm.quote[sv.id];
    render(); toast(`Orçamento demonstrativo registrado em ${sv.id}`, 'ok');
  },
  'prod-edit': form => {
    const p = P(form.dataset.id), e = UI.adm.edit; const price = parseMoney(e.price);
    if (e.name.trim().length < 2 || !(price > 0)) { toast('Confira o nome e o preço.', 'bad'); return; }
    const delta = Math.round((price - p.price) * 100) / 100;
    p.name = e.name.trim(); p.price = price; p.desc = e.desc.trim(); save(); UI.adm.edit = null; render();
    toast(`Alterações salvas neste navegador${delta ? ' · preço ' + (delta > 0 ? '+' : '−') + brl(Math.abs(delta)) : ''}`, 'ok');
  },
  np: () => {
    const np = UI.adm.np; const price = parseMoney(np.price); const err = {};
    if (np.name.trim().length < 3) err.name = 'Informe o nome do produto.';
    if (!(price > 0)) err.price = 'Informe o preço.';
    np.err = err; if (Object.keys(err).length) { render(); return; }
    const sub = SUBS.find(s => s.id === np.sub);
    const n = S.seq.product++;
    const colors = np.colors.length ? np.colors : ['Preto'];
    const p = { id: 'n' + pad2(n), code: 'NOV-' + String(n).padStart(3, '0'), name: np.name.trim(), brand: np.brand.trim() || 'Diversas', model: np.name.trim(), group: sub.group, sub: sub.id, price, rank: 0, isNew: true, active: true, createdAt: Date.now(),
      options: [opt('Cor', colors)], art: AUTO_ART[sub.id] || { kind: 'generic' }, tags: norm(np.name), desc: np.desc.trim() || 'Produto cadastrado durante a demonstração.', specs: [['Cadastro', 'Criado no painel de gestão (demo)']], compat: sub.group === 'acessorios' ? ['Universal'] : null };
    S.products.push(p);
    const q = Math.max(0, Math.min(99, parseInt(np.stock, 10) || 0));
    colors.forEach(c => UNITS.forEach(u => { S.stock[`${p.id}|${c}|${u.id}`] = q; }));
    save(); UI.modal = null; UI.adm.np = null; UI.adm.drawer = { type: 'product', id: p.id }; UI.adm.edit = null; render();
    toast(`${p.name} cadastrado e visível na loja`, 'ok', { label: 'Ver na loja', to: 'produto-' + p.id });
  },
};

/* ---------- ligação de eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'BUTTON' || el.tagName === 'TR' || el.tagName === 'DIV') e.preventDefault();
  fn(el, e);
  if (el.tagName === 'A' && el.getAttribute('href') === location.hash && !e.defaultPrevented) setTimeout(render, 0);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (UI.modal) { UI.modal = null; render(); } else if (UI.menu) { UI.menu = false; render(); } else if (UI.adm.drawer) { UI.adm.drawer = null; render(); } else if (UI.adm.admNav) { UI.adm.admNav = false; render(); }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-act]')) { e.preventDefault(); ACT[e.target.dataset.act](e.target, e); }
});
const setPath = (obj, k, v) => { obj[k] = v; };
let qT;
document.addEventListener('input', e => {
  const el = e.target; const k = el.dataset.in; if (!k) return;
  if (el.dataset.mask === 'phone') { const pos = el.value.length; el.value = maskPhone(el.value); }
  const v = el.value;
  if (k === 'cat-q') { UI.cat.q = v; clearTimeout(qT); qT = setTimeout(rerenderCatalogResults, 110); return; }
  if (k === 'cat-sort') { UI.cat.sort = v; rerenderCatalogResults(); return; }
  if (k.startsWith('ck.')) { const ck = ensureCk(); setPath(ck, k.slice(3), v); if (ck.err[k.slice(3)]) { delete ck.err[k.slice(3)]; const fld = el.closest('.field'); fld && fld.classList.remove('bad'); const fe2 = fld && fld.querySelector('.ferr'); fe2 && fe2.remove(); } return; }
  if (k.startsWith('svc.')) { const f = ensureSvc(); setPath(f, k.slice(4), v); if (f.err[k.slice(4)]) { delete f.err[k.slice(4)]; const fld = el.closest('.field'); fld && fld.classList.remove('bad'); const fe2 = fld && fld.querySelector('.ferr'); fe2 && fe2.remove(); } if (k === 'svc.brand' || k === 'svc.service') { if (k === 'svc.service') f.pick = v || null; render(); } return; }
  if (k === 'track') { UI.track = v; return; }
  if (k === 'contact-msg') { if (UI.modal) UI.modal.msg = v; return; }
  if (k.startsWith('np.')) { UI.adm.np[k.slice(3)] = v; if (k === 'np.sub') render(); return; }
  if (k.startsWith('edit.')) { UI.adm.edit[k.slice(5)] = v; return; }
  if (k.startsWith('quote.')) { UI.adm.quote[el.dataset.id][k.slice(6)] = v; return; }
  const admMap = { 'adm-unit': ['unit'], 'adm-ord-q': ['ord', 'q'], 'adm-ord-unit': ['ord', 'unit'], 'adm-prod-q': ['prod', 'q'], 'adm-prod-sub': ['prod', 'sub'], 'adm-prod-brand': ['prod', 'brand'], 'adm-stk-q': ['stk', 'q'], 'adm-stk-sub': ['stk', 'sub'], 'adm-stk-sit': ['stk', 'sit'], 'adm-cli-q': ['cli', 'q'], 'adm-svc-unit': ['svc', 'unit'] };
  const path = admMap[k];
  if (path) { if (path.length === 1) UI.adm[path[0]] = v; else UI.adm[path[0]][path[1]] = v; if (path[0] === 'stk') UI.adm.stk.limit = 40; render(); }
});
document.addEventListener('change', e => { const el = e.target; if (el.tagName === 'SELECT' && el.dataset.in) el.dispatchEvent(new Event('input', { bubbles: true })); });
document.addEventListener('submit', e => { const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault(); FORMS[f.dataset.form] && FORMS[f.dataset.form](f); });

/* dica de valores do gráfico */
function showTip(el) {
  const t = $('#tip') || (() => { const d = document.createElement('div'); d.id = 'tip'; d.className = 'tip'; d.setAttribute('role', 'tooltip'); document.body.appendChild(d); return d; })();
  const [a, b] = el.dataset.tip.split('|');
  t.textContent = ''; const s1 = document.createElement('b'); s1.textContent = b; const s2 = document.createElement('span'); s2.textContent = a; t.append(s1, s2);
  const r = el.getBoundingClientRect(); t.classList.add('show');
  const tw = t.offsetWidth; let x = r.left + r.width / 2 - tw / 2; x = Math.max(8, Math.min(window.innerWidth - tw - 8, x));
  t.style.left = x + 'px'; t.style.top = (r.top + window.scrollY - t.offsetHeight - 8) + 'px';
}
const hideTip = () => { const t = $('#tip'); t && t.classList.remove('show'); };
document.addEventListener('pointerover', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el); else hideTip(); });
document.addEventListener('focusin', e => { const el = e.target.closest('[data-tip]'); if (el) showTip(el); else hideTip(); });
window.addEventListener('scroll', hideTip, { passive: true });

window.addEventListener('hashchange', () => { const prev = lastHash || ''; lastWasStore = prev === 'loja' || prev.startsWith('loja-'); onRoute(); });
let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (route().admin && route().name === 'dashboard') render(); }, 200); });
load();
onRoute();
