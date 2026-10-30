/* ============ Rotas, renderização e eventos ============ */
function route() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'inicio';
  if (h === 'gestao') return { admin: true, name: 'dashboard', h };
  if (h.startsWith('gestao-')) return { admin: true, name: h.slice(7), h };
  if (h.startsWith('produto-')) return { name: 'produto', id: h.slice(8), h };
  if (h.startsWith('pedido-')) return { name: 'pedido', id: h.slice(7).replace(/\D/g, ''), h };
  if (h.startsWith('os-')) return { name: 'os', id: h.slice(3).replace(/\D/g, ''), h };
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
function storeView(r) {
  if (S.scope !== 'loja') {
    if (S.loadErr) return `<div class="wrap pagepad">${errorBox(S.loadErr, 'catalog')}</div>`;
    loadCatalog('loja').then(() => { if (route().name === 'loja') applyCatalogPreset(route().param); render(); }, () => render());
    return `<div class="wrap pagepad">${loadingBox('Carregando a loja...')}</div>`;
  }
  switch (r.name) {
    case 'loja': return viewCatalog();
    case 'produto': return viewProduct(r.id);
    case 'sacola': return viewBag();
    case 'checkout': return viewCheckout();
    case 'pedido': return viewOrder(r.id);
    case 'os': return viewServiceDetail(r.id);
    case 'assistencia': return viewAssist();
    case 'acompanhar': return viewTrack();
    case 'atendimento': return viewContact();
    case 'unidades': return viewUnits();
    case 'conta': return viewAccount();
    default: return viewHome();
  }
}
function render() {
  const r = route();
  const ae = document.activeElement;
  const fid = ae && ae.id, ss = ae && ae.selectionStart, se = ae && ae.selectionEnd;
  let html;
  if (r.admin) {
    html = adminShell(r);
    document.title = 'Gestão · Doutor do Celular';
  } else {
    const v = storeView(r);
    const showBar = S.scope === 'loja' && (r.name === 'loja' || r.name === 'produto') && cartCount() > 0;
    html = header(r.name === 'inicio' ? 'home' : 'store', r) + `<main id="main" class="main main--${r.name} ${showBar ? 'has-bar' : ''}">${v}</main>` + footer() + (showBar ? bagBar() : '') + bottomNav(r) + menuDrawer();
    document.title = 'Doutor do Celular · Kauan Cell';
  }
  html += modalHtml();
  app().innerHTML = html;
  document.body.classList.toggle('has-bar', !r.admin && S.scope === 'loja' && (r.name === 'loja' || r.name === 'produto') && cartCount() > 0);
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
  const prevAdmin = lastHash && lastHash.startsWith('gestao');
  lastHash = r.h;
  UI.menu = false; UI.modal = null; UI.adm.admNav = false;
  if (!r.admin || !prevAdmin) UI.adm.drawer = null;
  if (r.name === 'loja') applyCatalogPreset(r.param);
  if (r.name === 'checkout' && UI.ck && !cartCount()) UI.ck = null;
  if (r.name !== 'pedido' && r.name !== 'os') UI.fresh = null;
  if (r.name === 'pedido' || r.name === 'os') drop(r.name + '-' + r.id);
  if (r.name === 'conta') drop('conta');
  if (r.admin) { UI.adm.drawer = null; drop('adm-'); }
  render();
  if (r.h === 'solicitar') { const f = $('#svc-form'); if (f) f.scrollIntoView({ block: 'start' }); return; }
  window.scrollTo(0, 0);
}
function go(h) { if (location.hash === '#' + h) onRoute(); else location.hash = h; }
async function busy(fn) { if (UI.busy) return; UI.busy = true; render(); try { await fn(); } finally { UI.busy = false; render(); } }

/* ---------- ações ---------- */
const ACT = {
  'menu': () => { UI.menu = true; render(); setTimeout(() => { const a = $('.mdrawer nav a'); a && a.focus(); }, 0); },
  'menu-close': () => { UI.menu = false; render(); },
  'menu-close-go': el => { UI.menu = false; if (el.getAttribute('href') === location.hash || (el.getAttribute('href') === '#inicio' && !location.hash)) render(); },
  'retry': el => { const k = el.dataset.k; if (k === 'catalog') { S.loadErr = null; S.scope = null; } else delete R[k]; render(); },
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
  'back-store': (el, e) => { if (history.length > 1 && lastWasStore) { e.preventDefault(); history.back(); } },
  'cart-qty': el => { const [pid, vkey] = el.dataset.id.split('::'); const it = S.cart.find(i => i.pid === pid && i.vkey === vkey); if (!it) return; const max = stockOf(pid, vkey, S.unitId); const nq = it.qty + Number(el.dataset.d); if (nq < 1) return; if (nq > Math.max(max, it.qty)) { toast(`Limite do estoque em ${unitName(S.unitId)}.`, 'warn'); return; } it.qty = nq; save(); render(); },
  'cart-rm': el => { const [pid, vkey] = el.dataset.k.split('::'); const it = S.cart.find(i => i.pid === pid && i.vkey === vkey); S.cart = S.cart.filter(i => i !== it); save(); render(); toast(`${(P(pid) || {}).name || 'Item'} removido da sacola`, 'ok'); },
  'ck-next': () => { const ck = ensureCk(); if (!validateStep(ck, ck.step)) { render(); const b = $('.field.bad input, .ferr'); b && b.focus && b.focus(); return; } ck.step++; render(); window.scrollTo(0, 0); },
  'ck-back': () => { const ck = ensureCk(); ck.err = {}; ck.step = Math.max(1, ck.step - 1); render(); },
  'ck-unit': el => { const ck = ensureCk(); ck.unitId = el.dataset.unit; ck.err = {}; render(); },
  'ck-mode': el => { const ck = ensureCk(); ck.mode = el.dataset.v; render(); },
  'ck-pay': el => { ensureCk().pay = el.dataset.v; render(); },
  'ck-confirm': () => {
    const ck = ensureCk();
    if (!validateStep(ck, 2)) { ck.step = 2; render(); return; }
    if (!validateStep(ck, 3)) { ck.step = 3; render(); return; }
    busy(async () => {
      try { const o = await createOrder(ck); UI.ck = null; go('pedido-' + o.num); }
      catch (e) {
        ck.err = { submit: e.message };
        // Estoque mudou desde que a loja carregou: atualiza o catálogo para refletir o saldo real.
        if (e.status === 409) { S.scope = null; loadCatalog('loja').then(render, () => { }); }
      }
    });
  },
  'svc-request': el => { const f = ensureSvc(); f.pick = el.dataset.svc; f.service = el.dataset.svc; go('solicitar'); },
  'svc-pick': el => { const f = ensureSvc(); f.pick = el.dataset.svc; f.service = el.dataset.svc; render(); },
  'svc-unit': el => { ensureSvc().unitId = el.dataset.unit; render(); },
  'scroll': (el, e) => { e.preventDefault(); const t = document.getElementById(el.dataset.to); t && t.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  'contact-open': () => { UI.modal = { type: 'contact', unitId: S.unitId, msg: null }; render(); },
  'contact-unit': el => { UI.modal.unitId = el.dataset.unit; UI.modal.msg = null; render(); },
  'copy': el => {
    const src = document.getElementById(el.dataset.src); if (!src) return; const text = src.value;
    const done = () => toast('Mensagem copiada.', 'ok');
    const legacy = () => { const t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(t); t.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { } t.remove(); if (ok) done(); else { src.classList.remove('sr'); src.focus(); src.select(); toast('Selecione e copie o texto manualmente.', 'warn'); } };
    try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done).catch(legacy); else legacy(); } catch (e) { legacy(); }
  },
  'quote-ask': el => { UI.modal = { type: 'quote', num: el.dataset.num, v: el.dataset.v }; render(); },
  'quote-do': el => {
    const num = el.dataset.num, v = el.dataset.v;
    busy(async () => {
      try {
        const r = await api(`/loja/os/${num}/orcamento`, { method: 'POST', body: { decisao: v }, acesso: TOKENS.acessos()['OS-' + num] || null, auth: loggedCustomer() ? 'cliente' : null });
        R['os-' + num] = { st: 'ok', data: r.service }; UI.modal = null; drop('conta');
        toast(v === 'aprovar' ? 'Orçamento aprovado. A loja já pode iniciar o reparo.' : 'Orçamento recusado. Combine a retirada com a unidade.', 'ok');
      } catch (e) { UI.modal = null; toast(e.message, 'bad'); drop('os-' + num); }
    });
  },
  'acc-mode': el => { Object.assign(UI.acc, { mode: el.dataset.v, err: '', needCode: false }); render(); },
  'acc-logout': () => { LS.set('kc-cliente', null); drop('conta'); UI.ck = null; UI.svc = null; render(); toast('Você saiu da conta.', 'ok'); },
  'modal-close': () => { UI.modal = null; render(); },
  'modal-close-go': () => { UI.modal = null; },

  /* gestão */
  'adm-nav': () => { UI.adm.admNav = !UI.adm.admNav; render(); },
  'adm-logout': () => { LS.set('kc-equipe', null); drop('adm-'); S.scope = null; S.loadErr = null; UI.adm.drawer = null; go('gestao'); },
  'adm-period': el => { UI.adm.period = el.dataset.v; render(); },
  'adm-open': el => { if (!el.dataset.id) return; UI.adm.drawer = { type: el.dataset.type, id: el.dataset.id }; drop('adm-ordd-', 'adm-osd-', 'adm-clid-'); if (el.dataset.type === 'product') { UI.adm.edit = null; UI.adm.showMov = null; } render(); setTimeout(() => { const d = $('.drawer'); d && (d.scrollTop = 0); }, 0); },
  'adm-close': () => { UI.adm.drawer = null; render(); },
  'adm-ord-status': el => { UI.adm.ord.status = el.dataset.v; render(); },
  'adm-svc-status': el => { UI.adm.svc.status = el.dataset.v; render(); },
  'adm-svc-view': el => { UI.adm.svc.view = el.dataset.v; render(); },
  'adm-stk-unit': el => { UI.adm.stk.unit = el.dataset.v; UI.adm.stk.limit = 40; render(); },
  'adm-prod-inactive': () => { UI.adm.prod.inactive = !UI.adm.prod.inactive; render(); },
  'stk-more': () => { UI.adm.stk.limit += 40; render(); },
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
  'ord-set': el => {
    const num = el.dataset.id, st = el.dataset.v;
    busy(async () => {
      try {
        const r = await gapi(`/pedidos/${num}/status`, { method: 'PATCH', body: { status: st } });
        admRefresh({ stock: true });
        R['adm-ordd-' + num] = { st: 'ok', data: r.order };
        toast(`${r.order.id}: ${orderStatusLabel(r.order)}`, 'ok');
      } catch (e) { admFail(e); }
    });
  },
  'svc-set': el => {
    const num = el.dataset.id;
    busy(async () => {
      try { const r = await gapi(`/os/${num}/status`, { method: 'PATCH', body: { status: el.dataset.v } }); admRefresh(); R['adm-osd-' + num] = { st: 'ok', data: r.service }; toast(`${r.service.id}: ${svcLabel(r.service.status)}`, 'ok'); }
      catch (e) { admFail(e); }
    });
  },
  'stk-adj': el => stockSet(el.dataset.pid, el.dataset.vkey, el.dataset.unit, { delta: Number(el.dataset.d) }),
  'prod-toggle': el => {
    const p = P(el.dataset.id);
    busy(async () => {
      try { const r = await gapi(`/produtos/${p.id}/ativo`, { method: 'PATCH', body: { active: !p.active } }); mergeProduct(r); toast(r.product.active ? `${p.name} reativado na loja` : `${p.name} desativado e oculto da loja`, 'ok'); }
      catch (e) { admFail(e); }
    });
  },
  'photo-rm': el => busy(async () => { try { mergeProduct(await gapi(`/produtos/${el.dataset.id}/imagem`, { method: 'DELETE' })); toast('Foto removida.', 'ok'); } catch (e) { admFail(e); } }),
  'mov-toggle': el => { UI.adm.showMov = UI.adm.showMov === el.dataset.id ? null : el.dataset.id; drop('adm-mov-'); render(); },
  'ed-opt-add': () => { UI.adm.edit.options.push({ name: '', type: 'pill', values: [{ v: '', d: '', hex: '' }] }); render(); },
  'ed-opt-rm': el => { const e = UI.adm.edit; const o = e.options.splice(Number(el.dataset.i), 1)[0]; if (o) e.exclude.forEach(x => delete x[o.name]); render(); },
  'ed-val-add': el => { UI.adm.edit.options[Number(el.dataset.i)].values.push({ v: '', d: '', hex: '' }); render(); },
  'ed-val-rm': el => { const o = UI.adm.edit.options[Number(el.dataset.i)]; if (o.values.length > 1) o.values.splice(Number(el.dataset.j), 1); else toast('Cada opção precisa de ao menos um valor.', 'warn'); render(); },
  'ed-ex-add': () => { UI.adm.edit.exclude.push({}); render(); },
  'ed-ex-rm': el => { UI.adm.edit.exclude.splice(Number(el.dataset.k), 1); render(); },
  'user-toggle': el => busy(async () => { try { await api(`/auth/usuarios/${el.dataset.id}`, { method: 'PUT', body: { ativo: el.dataset.v === '1' }, auth: 'equipe' }); drop('adm-users'); toast('Usuário atualizado.', 'ok'); } catch (e) { admFail(e); } }),
  'np-open': () => { UI.adm.np = { name: '', sub: SUBS.find(s => s.id === 'capinhas') ? 'capinhas' : (SUBS[0] || {}).id, brand: 'Diversas', price: '', stock: '0', colors: ['Preto'], desc: '', err: {} }; UI.modal = { type: 'adm', sub: 'np' }; render(); },
  'np-color': el => { const c = el.dataset.v, a = UI.adm.np.colors; UI.adm.np.colors = a.includes(c) ? a.filter(x => x !== c) : [...a, c]; render(); },
};
let lastWasStore = false;
function refreshFilters() { if (UI.modal && UI.modal.type === 'filters') render(); else rerenderCatalogResults(); }
const parseMoney = s => { const t = String(s).trim(); if (!t) return NaN; const n = Number(t.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')); return isFinite(n) ? n : NaN; };

/* Atualiza um produto no cache depois de salvar (produto + saldo por variação). */
function mergeProduct(r) {
  const i = S.products.findIndex(p => p.id === r.product.id);
  if (i >= 0) S.products[i] = r.product; else S.products.push(r.product);
  Object.keys(S.stock).forEach(k => { if (k.startsWith(r.product.id + '|')) delete S.stock[k]; });
  Object.assign(S.stock, r.stock);
  if (UI.adm.edit && UI.adm.edit.id === r.product.id) UI.adm.edit = null;
  drop('adm-cont', 'adm-dash', 'adm-uni', 'adm-opp');
}
function stockSet(pid, vkey, unit, change) {
  busy(async () => {
    try {
      const r = await gapi('/estoque/ajuste', { method: 'POST', body: { produtoId: pid, chave: vkey, unidadeId: unit, ...change, motivo: 'Ajuste pelo painel' } });
      S.stock[r.key] = r.quantity;
      drop('adm-cont', 'adm-dash', 'adm-uni', 'adm-opp', 'adm-mov-');
    } catch (e) { admFail(e); }
  });
}
function editBody(e) {
  const price = parseMoney(e.price);
  if (e.name.trim().length < 2) throw new Error('Informe o nome do produto.');
  if (!(price > 0)) throw new Error('Informe um preço base válido.');
  const options = e.options.map(o => ({
    name: o.name.trim(), type: o.type === 'color' ? 'color' : 'pill',
    values: o.values.filter(v => v.v.trim()).map(v => { const d = parseMoney(v.d); const x = { v: v.v.trim() }; if (isFinite(d) && d) x.d = d; if (v.hex && v.hex.trim()) x.hex = v.hex.trim(); return x; }),
  }));
  if (options.some(o => !o.name)) throw new Error('Dê um nome para cada opção (ex.: Cor).');
  if (options.some(o => !o.values.length)) throw new Error('Cada opção precisa de ao menos um valor.');
  const exclude = e.exclude.map(x => Object.fromEntries(Object.entries(x).filter(([k, v]) => v && options.some(o => o.name === k)))).filter(x => Object.keys(x).length);
  const specs = e.specs.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const i = l.indexOf(':'); return i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, '']; });
  const compat = e.compat.split(',').map(s => s.trim()).filter(Boolean);
  return { name: e.name.trim(), brand: e.brand.trim() || 'Diversas', model: e.model.trim(), sub: e.sub, code: e.code.trim(), price, rank: Number(e.rank) || 0, isNew: !!e.isNew, desc: e.desc.trim(), tags: e.tags.trim(), specs, compat: compat.length ? compat : null, options, exclude };
}
const formData = form => { const o = {}; new FormData(form).forEach((v, k) => { o[k] = v; }); form.querySelectorAll('input[type=checkbox][name]').forEach(c => { o[c.name] = c.checked; }); return o; };

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
    busy(async () => { try { const sv = await createService(f); UI.svc = null; go('os-' + sv.num); } catch (e) { f.err = { submit: e.message }; } });
  },
  track: () => {
    const code = UI.track.trim().toUpperCase().replace(/\s/g, '');
    UI.trackErr = '';
    if (!/^(PED|OS)?-?\d{3,7}$/.test(code)) { UI.trackErr = 'Use o formato PED-1001 ou OS-2001.'; render(); return; }
    if (digits(UI.trackPhone).length < 10) { UI.trackErr = 'Informe o telefone com DDD usado no pedido ou na solicitação.'; render(); return; }
    busy(async () => {
      try {
        const r = await api('/loja/consulta', { method: 'POST', body: { codigo: code, telefone: UI.trackPhone } });
        const c = (r.type === 'pedido' ? 'PED-' : 'OS-') + r.num; guardarAcesso(c, r.access);
        UI.track = ''; UI.trackPhone = '';
        go((r.type === 'pedido' ? 'pedido-' : 'os-') + r.num);
      } catch (e) { UI.trackErr = e.message; }
    });
  },
  unlock: form => {
    const code = form.dataset.code; const f = UI.look[code];
    busy(async () => {
      try {
        const r = await api('/loja/consulta', { method: 'POST', body: { codigo: code, telefone: f.phone } });
        guardarAcesso(code, r.access); f.err = ''; drop(code.startsWith('PED') ? 'pedido-' : 'os-');
      } catch (e) { f.err = e.message; }
    });
  },
  acc: () => {
    const a = UI.acc; a.err = '';
    const cad = a.mode === 'cadastro';
    if (digits(a.phone).length < 10) { a.err = 'Informe o telefone com DDD.'; render(); return; }
    if (cad && a.name.trim().length < 3) { a.err = 'Informe o nome completo.'; render(); return; }
    if (cad && a.pass.length < 6) { a.err = 'A senha precisa de ao menos 6 caracteres.'; render(); return; }
    busy(async () => {
      try {
        const r = cad
          ? await api('/conta/cadastro', { method: 'POST', body: { nome: a.name, telefone: a.phone, email: a.email, senha: a.pass, codigo: a.code || undefined } })
          : await api('/conta/login', { method: 'POST', body: { telefone: a.phone, senha: a.pass } });
        LS.set('kc-cliente', r);
        Object.assign(UI.acc, { pass: '', code: '', needCode: false, err: '' });
        UI.ck = null; UI.svc = null; drop('conta', 'pedido-', 'os-');
        toast(cad ? 'Conta criada.' : `Olá, ${r.customer.name.split(' ')[0]}!`, 'ok');
      } catch (e) { a.err = e.message; if (e.details && e.details.precisaCodigo) a.needCode = true; }
    });
  },
  'adm-login': () => {
    const f = UI.adm.login; f.err = '';
    busy(async () => {
      try { const r = await api('/auth/login', { method: 'POST', body: { email: f.email, senha: f.pass } }); LS.set('kc-equipe', r); f.pass = ''; S.scope = null; S.loadErr = null; drop('adm-'); }
      catch (e) { f.err = e.message; }
    });
  },
  quote: form => {
    const num = form.dataset.id; const qf = UI.adm.quote[num];
    const v = parseMoney(qf.value);
    if (!(v > 0)) { toast('Informe um valor válido para o orçamento.', 'bad'); return; }
    busy(async () => {
      try { const r = await gapi(`/os/${num}/orcamento`, { method: 'PUT', body: { valor: v, observacao: qf.note } }); delete UI.adm.quote[num]; admRefresh(); R['adm-osd-' + num] = { st: 'ok', data: r.service }; toast(`Orçamento registrado em ${r.service.id}`, 'ok'); }
      catch (e) { admFail(e); }
    });
  },
  'prod-edit': form => {
    const e = UI.adm.edit; let body;
    try { body = editBody(e); } catch (err) { e.err = err.message; render(); return; }
    e.err = '';
    busy(async () => { try { mergeProduct(await gapi(`/produtos/${form.dataset.id}`, { method: 'PUT', body })); toast('Produto salvo.', 'ok'); } catch (err) { if (UI.adm.edit) UI.adm.edit.err = err.message; admFail(err); } });
  },
  np: () => {
    const np = UI.adm.np; const price = parseMoney(np.price); const err = {};
    if (np.name.trim().length < 2) err.name = 'Informe o nome do produto.';
    if (!(price > 0)) err.price = 'Informe o preço.';
    np.err = err; if (Object.keys(err).length) { render(); return; }
    const sub = SUBS.find(s => s.id === np.sub) || {};
    const colors = np.colors.length ? np.colors : ['Preto'];
    const body = { name: np.name.trim(), sub: np.sub, brand: np.brand.trim() || 'Diversas', model: np.name.trim(), price, desc: np.desc.trim(), tags: norm(np.name), art: AUTO_ART[np.sub] || { kind: 'generic' }, compat: sub.group === 'acessorios' ? ['Universal'] : null, options: [{ name: 'Cor', type: 'color', values: colors.map(v => ({ v })) }], initialStock: Math.max(0, parseInt(np.stock, 10) || 0) };
    busy(async () => {
      try {
        const r = await gapi('/produtos', { method: 'POST', body }); mergeProduct(r);
        UI.modal = null; UI.adm.np = null; UI.adm.drawer = { type: 'product', id: r.product.id }; UI.adm.edit = null;
        toast(`${r.product.name} cadastrado e visível na loja`, 'ok');
      } catch (e) { np.err = { submit: e.message }; }
    });
  },
  unit: form => {
    const d = formData(form);
    busy(async () => { try { await gapi(`/unidades/${form.dataset.id}`, { method: 'PUT', body: d }); S.scope = null; await loadCatalog('gestao'); drop('adm-uni'); toast('Unidade salva.', 'ok'); } catch (e) { admFail(e); } });
  },
  cfg: form => {
    const d = formData(form);
    busy(async () => { try { R['adm-cfg'] = { st: 'ok', data: await gapi('/configuracoes', { method: 'PUT', body: d }) }; await loadCatalog('gestao'); drop('adm-cont', 'adm-dash', 'adm-uni', 'adm-opp'); toast('Configurações salvas.', 'ok'); } catch (e) { admFail(e); } });
  },
  cat: form => { const d = formData(form); busy(async () => { try { await gapi(`/categorias/${form.dataset.id}`, { method: 'PUT', body: d }); await loadCatalog('gestao'); toast('Categoria salva.', 'ok'); } catch (e) { admFail(e); } }); },
  'cat-new': form => { const d = formData(form); busy(async () => { try { await gapi('/categorias', { method: 'POST', body: d }); await loadCatalog('gestao'); toast('Categoria criada.', 'ok'); } catch (e) { admFail(e); } }); },
  'svc-cat': form => { const d = formData(form); busy(async () => { try { await gapi(`/servicos/${form.dataset.id}`, { method: 'PUT', body: d }); await loadCatalog('gestao'); toast('Serviço salvo.', 'ok'); } catch (e) { admFail(e); } }); },
  'svc-cat-new': form => { const d = formData(form); busy(async () => { try { await gapi('/servicos', { method: 'POST', body: d }); await loadCatalog('gestao'); toast('Serviço criado.', 'ok'); } catch (e) { admFail(e); } }); },
  'my-pass': form => { const d = formData(form); busy(async () => { try { await api('/auth/senha', { method: 'POST', body: d, auth: 'equipe' }); form.reset(); toast('Senha alterada.', 'ok'); } catch (e) { admFail(e); } }); },
  'user-new': form => { const d = formData(form); busy(async () => { try { await api('/auth/usuarios', { method: 'POST', body: d, auth: 'equipe' }); drop('adm-users'); toast('Usuário criado.', 'ok'); } catch (e) { admFail(e); } }); },
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
let qT;
/* Busca nas listas do servidor: espera o usuário parar de digitar antes de consultar. */
const debounced = fn => { clearTimeout(qT); qT = setTimeout(fn, 350); };
document.addEventListener('input', e => {
  const el = e.target; const k = el.dataset.in; if (!k) return;
  if (el.dataset.mask === 'phone') el.value = maskPhone(el.value);
  const v = el.type === 'checkbox' ? el.checked : el.value;
  if (k === 'cat-q') { UI.cat.q = v; debounced(rerenderCatalogResults); return; }
  if (k === 'cat-sort') { UI.cat.sort = v; rerenderCatalogResults(); return; }
  if (k.startsWith('ck.')) { const ck = ensureCk(); ck[k.slice(3)] = v; if (ck.err[k.slice(3)]) { delete ck.err[k.slice(3)]; const fld = el.closest('.field'); fld && fld.classList.remove('bad'); const fe2 = fld && fld.querySelector('.ferr'); fe2 && fe2.remove(); } return; }
  if (k.startsWith('svc.')) { const f = ensureSvc(); f[k.slice(4)] = v; if (f.err[k.slice(4)]) { delete f.err[k.slice(4)]; const fld = el.closest('.field'); fld && fld.classList.remove('bad'); const fe2 = fld && fld.querySelector('.ferr'); fe2 && fe2.remove(); } if (k === 'svc.brand' || k === 'svc.service') { if (k === 'svc.service') f.pick = v || null; render(); } return; }
  if (k === 'track') { UI.track = v; return; }
  if (k === 'trackPhone') { UI.trackPhone = v; return; }
  if (k === 'look.phone') { (UI.look[el.dataset.code] = UI.look[el.dataset.code] || { phone: '', err: '' }).phone = v; return; }
  if (k.startsWith('acc.')) { UI.acc[k.slice(4)] = v; return; }
  if (k.startsWith('alog.')) { UI.adm.login[k.slice(5)] = v; return; }
  if (k === 'contact-msg') { if (UI.modal) UI.modal.msg = v; const a = $('#wa-go'); if (a) a.href = a.href.split('?')[0] + '?text=' + encodeURIComponent(v); return; }
  if (k.startsWith('np.')) { UI.adm.np[k.slice(3)] = v; if (k === 'np.sub') render(); return; }
  if (k === 'edit.opt') { const o = UI.adm.edit.options[Number(el.dataset.i)]; const old = o.name; o[el.dataset.f] = v; if (el.dataset.f === 'name') UI.adm.edit.exclude.forEach(x => { if (old in x) { x[v] = x[old]; delete x[old]; } }); if (el.dataset.f === 'type') render(); return; }
  if (k === 'edit.val') { UI.adm.edit.options[Number(el.dataset.i)].values[Number(el.dataset.j)][el.dataset.f] = v; return; }
  if (k === 'edit.ex') { const x = UI.adm.edit.exclude[Number(el.dataset.k)]; if (v) x[el.dataset.o] = v; else delete x[el.dataset.o]; return; }
  if (k.startsWith('edit.')) { UI.adm.edit[k.slice(5)] = v; return; }
  if (k.startsWith('quote.')) { UI.adm.quote[el.dataset.id][k.slice(6)] = v; return; }
  const admMap = { 'adm-unit': ['unit'], 'adm-ord-q': ['ord', 'q'], 'adm-ord-unit': ['ord', 'unit'], 'adm-prod-q': ['prod', 'q'], 'adm-prod-sub': ['prod', 'sub'], 'adm-prod-brand': ['prod', 'brand'], 'adm-stk-q': ['stk', 'q'], 'adm-stk-sub': ['stk', 'sub'], 'adm-stk-sit': ['stk', 'sit'], 'adm-cli-q': ['cli', 'q'], 'adm-svc-unit': ['svc', 'unit'] };
  const path = admMap[k];
  if (path) {
    if (path.length === 1) UI.adm[path[0]] = v; else UI.adm[path[0]][path[1]] = v;
    if (path[0] === 'stk') UI.adm.stk.limit = 40;
    if (k === 'adm-ord-q' || k === 'adm-cli-q') debounced(render); else render();
  }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.tagName === 'SELECT' && el.dataset.in) { el.dispatchEvent(new Event('input', { bubbles: true })); return; }
  if (el.type === 'checkbox' && el.dataset.in) return;
  if (el.dataset.stkSet) { const q = parseInt(el.value, 10); if (!(q >= 0)) { toast('Informe uma quantidade válida.', 'bad'); render(); return; } stockSet(el.dataset.pid, el.dataset.vkey, el.dataset.unit, { quantidade: q }); return; }
  if (el.dataset.userPerfil) { busy(async () => { try { await api(`/auth/usuarios/${el.dataset.userPerfil}`, { method: 'PUT', body: { perfil: el.value }, auth: 'equipe' }); drop('adm-users'); toast('Perfil atualizado.', 'ok'); } catch (err) { drop('adm-users'); admFail(err); } }); return; }
  if (el.dataset.up === 'photo' && el.files && el.files[0]) {
    const id = el.dataset.id, file = el.files[0];
    busy(async () => {
      try {
        const small = await reduzirImagem(file);
        if (small.size > 4 * 1024 * 1024) throw new Error('A imagem continua grande demais (limite de 4 MB).');
        const fd = new FormData(); fd.append('imagem', small);
        mergeProduct(await gapi(`/produtos/${id}/imagem`, { method: 'POST', form: fd }));
        toast('Foto atualizada.', 'ok');
      } catch (err) { admFail(err); }
    });
  }
});
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
onRoute();
