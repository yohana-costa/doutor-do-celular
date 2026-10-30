/* ============ Painel de gestão (área da equipe, com login) ============ */
const ADM_NAV = [
  ['dashboard', 'dash', 'Visão geral', 'Indicadores calculados no servidor a partir dos pedidos e serviços'],
  ['pedidos', 'receipt', 'Pedidos e vendas', 'Pedidos do site, com status e regra de estoque'],
  ['produtos', 'box', 'Produtos', 'Catálogo compartilhado com a loja'],
  ['estoque', 'layers', 'Estoque', 'Quantidades por unidade e variação'],
  ['clientes', 'users', 'Clientes', 'Histórico de pedidos e assistências'],
  ['assistencia', 'wrench', 'Assistência técnica', 'Solicitações de reparo e orçamentos'],
  ['unidades', 'pin', 'Unidades', 'Dados das lojas, indicadores e estoque por unidade'],
  ['oportunidades', 'target', 'Oportunidades', 'Regras simples para ações comerciais'],
  ['ajustes', 'edit', 'Ajustes', 'Configurações, categorias, serviços e equipe'],
];
const PERIODS = [['hoje', 'Hoje'], ['7', '7 dias'], ['30', '30 dias'], ['tudo', 'Tudo']];
const staff = () => { const t = TOKENS.equipe(); return t && t.token ? t.user : null; };
const isGerente = () => { const u = staff(); return !!u && (u.perfil === 'ADMIN' || u.perfil === 'GERENTE'); };
const isAdmin = () => { const u = staff(); return !!u && u.perfil === 'ADMIN'; };
const PERFIL_LABEL = { ADMIN: 'Administrador', GERENTE: 'Gerente', OPERADOR: 'Operador' };

/* chamadas da gestão já com o token da equipe */
const gapi = (path, opts = {}) => api('/gestao' + path, { ...opts, auth: 'equipe' });
/* Depois de mudar pedido/estoque: recarrega o que depende disso. */
function admRefresh({ stock = false } = {}) {
  drop('adm-ped', 'adm-dash', 'adm-cont', 'adm-cli', 'adm-opp', 'adm-uni', 'adm-os', 'adm-mov');
  if (stock) loadCatalog('gestao').then(render, () => render());
}
function admFail(e) { if (e && e.status === 401) { render(); } toast(e && e.message ? e.message : 'Não foi possível concluir.', 'bad'); }

function adminLogin() {
  const f = UI.adm.login;
  return `<div class="alog"><div class="alog__card">
    <div class="alog__brand"><img src="${ASSETS.emblem}" alt=""><div><b>Doutor do Celular</b><small>ÁREA DA EQUIPE</small></div></div>
    <h1>Entrar na gestão</h1><p class="muted">Use o e-mail e a senha cadastrados para a equipe.</p>
    <form class="form" data-form="adm-login" novalidate>
      <div class="field"><label for="al-email">E-mail</label><input id="al-email" type="email" data-in="alog.email" value="${esc(f.email)}" autocomplete="username" inputmode="email"></div>
      <div class="field"><label for="al-pass">Senha</label><input id="al-pass" type="password" data-in="alog.pass" value="${esc(f.pass)}" autocomplete="current-password"></div>
      ${f.err ? `<p class="ferr" role="alert">${esc(f.err)}</p>` : ''}
      <button class="btn btn--y btn--block btn--lg" type="submit" ${UI.busy ? 'disabled' : ''}>${UI.busy ? '<span class="spin spin--sm" aria-hidden="true"></span>Entrando...' : 'Entrar'}</button>
    </form>
    <a class="lnk lnk--muted" href="#inicio">${icon('chevL', 15)}Voltar para a loja</a>
  </div></div>`;
}

function adminShell(r) {
  if (!staff()) return adminLogin();
  if (S.scope !== 'gestao') {
    if (!S.loadErr) loadCatalog('gestao').then(render, () => render());
    return `<div class="adm adm--loading">${S.loadErr ? errorBox(S.loadErr, 'catalog') : loadingBox('Carregando painel...')}</div>`;
  }
  const mod = ADM_NAV.find(n => n[0] === r.name) || ADM_NAV[0];
  const cont = need('adm-cont', () => gapi('/contadores'));
  const badges = cont.st === 'ok' ? cont.data : {};
  let content = '';
  switch (mod[0]) {
    case 'pedidos': content = admOrders(); break;
    case 'produtos': content = admProducts(); break;
    case 'estoque': content = admStock(); break;
    case 'clientes': content = admClients(); break;
    case 'assistencia': content = admServices(); break;
    case 'unidades': content = admUnits(); break;
    case 'oportunidades': content = admOpps(); break;
    case 'ajustes': content = admSettings(); break;
    default: content = admDashboard();
  }
  const u = staff();
  return `<div class="adm">
    <aside class="adm__side ${UI.adm.admNav ? 'open' : ''}" aria-label="Módulos de gestão">
      <div class="adm__brand"><img src="${ASSETS.emblem}" alt=""><div><b>Doutor do Celular</b><small>Gestão</small></div><button class="hd__btn adm__close" data-act="adm-nav" aria-label="Fechar menu">${icon('x', 22)}</button></div>
      <nav>${ADM_NAV.map(([id, ic, l]) => `<a href="#gestao${id === 'dashboard' ? '' : '-' + id}" class="${mod[0] === id ? 'on' : ''}" ${mod[0] === id ? 'aria-current="page"' : ''}>${icon(ic, 20)}<span>${l}</span>${badges[id] ? `<em title="${id === 'estoque' ? 'variações com estoque baixo' : 'aguardando ação'}">${badges[id]}</em>` : ''}</a>`).join('')}</nav>
      <div class="adm__foot"><a class="btn btn--y btn--block" href="#inicio">${icon('store', 18)}Ver loja</a><button class="adm__reset" data-act="adm-logout">${icon('logout', 16)}Sair (${esc(u.nome)})</button><p>${esc(PERFIL_LABEL[u.perfil] || u.perfil)} · ${esc(u.email)}</p></div>
    </aside>
    ${UI.adm.admNav ? '<div class="scrim scrim--adm" data-act="adm-nav"></div>' : ''}
    <div class="adm__main">
      <header class="adm__top"><button class="hd__btn adm__menu" data-act="adm-nav" aria-label="Abrir módulos">${icon('menu', 24)}</button>
        <div class="adm__title"><h1>${mod[2]}</h1><p>${mod[3]}</p></div>
        <a class="btn btn--dark btn--sm adm__shop" href="#inicio">${icon('store', 16)}Loja</a></header>
      <div class="adm__content">${content}</div>
    </div>
    ${admDrawer()}
  </div>`;
}
const seg = (act, cur, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
const unitSelect = (id, cur, act) => `<label class="sel"><span class="sr">Unidade</span><select id="${id}" data-in="${act}"><option value="all" ${cur === 'all' ? 'selected' : ''}>Todas as unidades</option>${UNITS.map(u => `<option value="${u.id}" ${cur === u.id ? 'selected' : ''}>${esc(u.name)}</option>`).join('')}</select></label>`;
const thumb = (pid, vkey) => { const p = P(pid); return `<span class="thumb">${p ? productArt(p, vkey ? selFromKey(p, vkey) : {}) : ''}</span>`; };
const remoteBox = (r, key, fn) => r.st === 'ok' ? fn(r.data) : r.st === 'err' ? errorBox(r.err, key) : loadingBox();

/* ---------- visão geral ---------- */
function admDashboard() {
  const a = UI.adm;
  const key = `adm-dash-${a.period}-${a.unit}`;
  const r = need(key, () => gapi(`/dashboard?periodo=${a.period}&unidade=${a.unit}`));
  const head = `<div class="filters-row">${seg('adm-period', a.period, PERIODS)}${unitSelect('dash-unit', a.unit, 'adm-unit')}</div>`;
  if (r.st !== 'ok') return head + remoteBox(r, key);
  const m = r.data;
  const perLabel = { hoje: 'hoje', '7': 'nos últimos 7 dias', '30': 'nos últimos 30 dias', tudo: 'desde o primeiro pedido' }[a.period];
  const alerts = [
    m.waiting && ['warn', 'receipt', `${plural(m.waiting, 'pedido aguardando', 'pedidos aguardando')} confirmação`, 'gestao-pedidos', 'ord-wait'],
    m.ready && ['go', 'box', `${plural(m.ready, 'pedido pronto', 'pedidos prontos')} para retirada ou envio`, 'gestao-pedidos', 'ord-ready'],
    m.evals && ['warn', 'wrench', `${plural(m.evals, 'aparelho aguardando', 'aparelhos aguardando')} avaliação`, 'gestao-assistencia', ''],
    m.quotes && ['info', 'receipt', `${plural(m.quotes, 'orçamento aguardando', 'orçamentos aguardando')} aprovação do cliente`, 'gestao-assistencia', ''],
    (m.low || m.out) && ['bad', 'layers', `${m.low} variações com estoque baixo e ${m.out} esgotadas`, 'gestao-estoque', 'stk-low'],
  ].filter(Boolean);
  const maxU = Math.max(...m.byUnit.map(u => u.v), 1);
  const maxT = Math.max(...m.top.map(t => t.qty), 1);
  return head + `<div class="kpis">
    <div class="kpi kpi--hero"><span>Faturamento realizado</span><b>${brl(m.revenue)}</b><small>${plural(m.doneCount, 'venda concluída', 'vendas concluídas')} ${perLabel}</small></div>
    <div class="kpi"><span>Vendas hoje</span><b>${brl(m.todayRevenue)}</b><small>${plural(m.todayCount, 'pedido concluído', 'pedidos concluídos')}</small></div>
    <div class="kpi"><span>Ticket médio</span><b>${brl(m.ticket)}</b><small>por venda concluída</small></div>
    <div class="kpi"><span>Produtos vendidos</span><b>${m.unitsSold}</b><small>unidades no período</small></div>
    <a class="kpi kpi--link" href="#gestao-pedidos"><span>Pedidos em aberto</span><b>${m.openCount}</b><small>${m.createdCount} criados no período</small></a>
    <a class="kpi kpi--link" href="#gestao-assistencia"><span>Assistências em andamento</span><b>${m.svcOpenCount}</b><small>${m.svcNewCount} abertas no período</small></a>
    <a class="kpi kpi--link ${m.low ? 'kpi--warn' : ''}" href="#gestao-estoque" data-act="adm-preset" data-v="stk-low"><span>Estoque baixo</span><b>${m.low}</b><small>${m.out} variações esgotadas</small></a>
  </div>
  <div class="dgrid">
    <section class="panel panel--wide"><div class="panel__h"><h2>Faturamento realizado por ${a.period === 'hoje' ? 'faixa de horário' : 'dia'}</h2><span class="muted small">pedidos concluídos · ${a.unit === 'all' ? 'todas as unidades' : esc(unitName(a.unit))}</span></div>${colChart(m.series)}</section>
    <section class="panel"><div class="panel__h"><h2>Vendas por unidade</h2><span class="muted small">faturamento realizado</span></div>
      <ul class="hbars">${m.byUnit.map(u => `<li class="${a.unit !== 'all' && a.unit !== u.id ? 'dim' : ''}"><span class="hbars__l">${esc(u.name)}</span><span class="hbars__t"><i style="width:${(u.v / maxU * 100).toFixed(1)}%"></i></span><span class="hbars__v"><b>${brlCompact(u.v)}</b><small>${plural(u.n, 'venda', 'vendas')}</small></span></li>`).join('')}</ul>
      <p class="fine">Distribuição considera todas as unidades para comparação.</p></section>
    <section class="panel"><div class="panel__h"><h2>Mais vendidos</h2><span class="muted small">unidades no período</span></div>
      ${m.top.length ? `<ol class="topl">${m.top.map((t, i) => `<li><span class="topl__n">${i + 1}</span>${thumb(t.pid)}<span class="topl__t"><b>${esc(t.name)}</b><span class="mbar"><i style="width:${(t.qty / maxT * 100).toFixed(0)}%"></i></span></span><span class="topl__v"><b>${t.qty} un.</b><small>${brl(t.v)}</small></span></li>`).join('')}</ol>` : '<p class="muted">Sem vendas concluídas no período.</p>'}</section>
    <section class="panel"><div class="panel__h"><h2>Alertas</h2></div>
      ${alerts.length ? `<ul class="alerts">${alerts.map(([tone, ic, t, to, preset]) => `<li><a class="al al--${tone}" href="#${to}" ${preset ? `data-act="adm-preset" data-v="${preset}"` : ''}>${icon(ic, 19)}<span>${t}</span>${icon('chevR', 16)}</a></li>`).join('')}</ul>` : '<p class="muted">Nada pendente agora.</p>'}</section>
    <section class="panel"><div class="panel__h"><h2>Atalhos</h2></div>
      <div class="shortcuts">${[['gestao-pedidos', 'receipt', 'Pedidos'], ['gestao-produtos', 'box', 'Produtos'], ['gestao-estoque', 'layers', 'Estoque'], ['gestao-assistencia', 'wrench', 'Assistência'], ['gestao-clientes', 'users', 'Clientes'], ['gestao-oportunidades', 'target', 'Oportunidades']].map(([h, ic, l]) => `<a href="#${h}">${icon(ic, 22)}<span>${l}</span></a>`).join('')}</div></section>
    <section class="panel panel--full"><div class="panel__h"><h2>Pedidos recentes</h2><a class="lnk" href="#gestao-pedidos">Ver todos ${icon('arrowR', 15)}</a></div>${ordersTable(m.recent)}</section>
  </div>
  <p class="rules">${icon('alert', 15)}<span><b>Regras:</b> faturamento, vendas e ticket médio consideram apenas pedidos <b>concluídos</b>. O estoque é baixado quando o pedido é <b>confirmado</b> e devolvido se ele for cancelado ou voltar. Estoque baixo: de 1 a ${m.lowLimit} unidades.</span></p>`;
}
function niceMax(v) { if (v <= 0) return 100; const e = Math.pow(10, Math.floor(Math.log10(v))); const f = v / e; const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10; return n * e; }
function colChart(series) {
  const max = niceMax(Math.max(...series.map(s => s.v), 0));
  const n = series.length;
  const every = Math.ceil(n / (window.innerWidth < 640 ? 5 : 10));
  const peak = series.reduce((b, s, i) => s.v > (series[b] || { v: -1 }).v ? i : b, 0);
  return `<div class="cchart" role="img" aria-label="Gráfico de colunas do faturamento realizado. Máximo de ${brl(series[peak] ? series[peak].v : 0)}.">
    <div class="cchart__y">${[1, 0.5, 0].map(f => `<span style="bottom:${f * 100}%">${brlCompact(max * f)}</span>`).join('')}</div>
    <div class="cchart__plot">${[1, 0.5, 0].map(f => `<i class="cchart__g" style="bottom:${f * 100}%"></i>`).join('')}
      <div class="cchart__cols" style="--n:${n}">${series.map((s, i) => `<div class="cc" tabindex="0" data-tip="${esc(s.full)}|${brl(s.v)}" aria-label="${esc(s.full)}: ${brl(s.v)}"><i style="height:${(s.v / max * 100).toFixed(2)}%" class="${s.v ? '' : 'z'}">${i === peak && s.v ? `<em>${brlCompact(s.v)}</em>` : ''}</i></div>`).join('')}</div></div>
    <div class="cchart__x" style="--n:${n}">${series.map((s, i) => `<span>${(i % every === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= every / 2) ? (s.today ? 'hoje' : esc(s.label)) : ''}</span>`).join('')}</div>
  </div>`;
}

/* ---------- pedidos ---------- */
function ordersTable(list) {
  if (!list.length) return `<div class="empty empty--sm"><p>Nenhum pedido com esses filtros.</p></div>`;
  return `<div class="tblw"><table class="tbl"><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Itens</th><th class="r">Total</th><th>Unidade</th><th>Modalidade</th><th>Status</th></tr></thead><tbody>${list.map(o => {
    const n = o.items.reduce((s, l) => s + l.qty, 0);
    return `<tr data-act="adm-open" data-type="order" data-id="${o.num}" tabindex="0"><td data-l="Pedido"><b class="mono">${o.id}</b></td><td data-l="Cliente">${esc(o.customer.name)}</td><td data-l="Data">${fmtDateTime(o.createdAt)}</td><td data-l="Itens"><span class="clip">${plural(n, 'item', 'itens')} · ${esc(o.items[0] ? o.items[0].name : '')}${o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</span></td><td data-l="Total" class="r num">${brl(o.total)}</td><td data-l="Unidade">${esc(unitName(o.unitId))}</td><td data-l="Modalidade">${o.mode === 'retirada' ? 'Retirada' : 'Entrega'}</td><td data-l="Status">${pill(orderStatusLabel(o), orderTone(o.status))}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function admOrders() {
  const f = UI.adm.ord;
  const key = `adm-ped-${f.status}-${f.unit}-${f.q}`;
  const r = need(key, () => gapi(`/pedidos?status=${encodeURIComponent(f.status)}&unidade=${encodeURIComponent(f.unit)}&busca=${encodeURIComponent(f.q)}`));
  const counts = r.st === 'ok' ? r.data.counts : {};
  return `<div class="filters-row"><label class="search-s"><span>${icon('search', 18)}</span><input id="ord-q" data-in="adm-ord-q" value="${esc(f.q)}" placeholder="Buscar por pedido, cliente ou telefone"></label>${unitSelect('ord-unit', f.unit, 'adm-ord-unit')}</div>
   <div class="stchips">${[['all', 'Todos'], ['open', 'Em aberto'], ...ORDER_STATUS.map(s => [s.id, s.label])].map(([v, l]) => `<button class="stchip ${f.status === v ? 'on' : ''}" data-act="adm-ord-status" data-v="${v}">${l}${ORDER_STATUS.find(s => s.id === v) ? ` <em>${counts[v] || 0}</em>` : ''}</button>`).join('')}</div>
   ${remoteBox(r, key, d => `<div class="sumline"><span>${plural(d.total, 'pedido', 'pedidos')}${d.total > d.orders.length ? ` (mostrando ${d.orders.length})` : ''}</span><span>Concluídos: <b>${brl(d.doneSum)}</b></span><span>Em aberto: <b>${brl(d.openSum)}</b></span></div>${ordersTable(d.orders)}`)}
   <p class="rules">${icon('alert', 15)}<span>Pedido criado não é venda: só entra no faturamento ao ser <b>concluído</b>. A baixa de estoque acontece uma única vez, ao confirmar.</span></p>`;
}

/* ---------- produtos ---------- */
function admProducts() {
  const f = UI.adm.prod;
  let list = S.products.filter(p => f.inactive || p.active);
  if (f.sub !== 'all') list = list.filter(p => p.sub === f.sub);
  if (f.brand !== 'all') list = list.filter(p => p.brand === f.brand);
  if (f.q) list = list.filter(p => matchQuery(haystack(p) + ' ' + norm(p.code), f.q));
  const brands = [...new Set(S.products.map(p => p.brand))];
  const low = LOW();
  return `<div class="filters-row"><label class="search-s"><span>${icon('search', 18)}</span><input id="prod-q" data-in="adm-prod-q" value="${esc(f.q)}" placeholder="Buscar nome, marca ou código"></label>
    <label class="sel"><span class="sr">Categoria</span><select id="prod-sub" data-in="adm-prod-sub"><option value="all">Todas as categorias</option>${SUBS.map(s => `<option value="${s.id}" ${f.sub === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select></label>
    <label class="sel"><span class="sr">Marca</span><select id="prod-brand" data-in="adm-prod-brand"><option value="all">Todas as marcas</option>${brands.map(b => `<option ${f.brand === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
    <button class="switch ${f.inactive ? 'on' : ''}" data-act="adm-prod-inactive" aria-pressed="${f.inactive}"><i></i>Mostrar inativos</button>
    ${isGerente() ? `<button class="btn btn--y btn--sm push" data-act="np-open">${icon('plus', 18)}Novo produto</button>` : ''}</div>
  <div class="sumline"><span>${plural(list.length, 'produto', 'produtos')}</span><span>${S.products.filter(p => !p.active).length} inativos</span></div>
  ${list.length ? `<div class="tblw"><table class="tbl tbl--prod"><thead><tr><th>Produto</th><th>Categoria</th><th>Marca</th><th class="r">Preço</th><th>Variações</th>${UNITS.map(u => `<th class="r">${esc(u.short)}</th>`).join('')}<th>Status</th></tr></thead><tbody>${list.map(p => {
    const [mn, mx] = priceRange(p);
    return `<tr data-act="adm-open" data-type="product" data-id="${p.id}" tabindex="0" class="${p.active ? '' : 'off'}"><td data-l="Produto" class="tdp">${thumb(p.id)}<span><b>${esc(p.name)}</b><small class="mono">${esc(p.code)}</small></span></td><td data-l="Categoria">${esc(subLabel(p.sub))}</td><td data-l="Marca">${esc(p.brand)}</td><td data-l="Preço" class="r num">${mn !== mx ? `${brl(mn)}<small> a ${brl(mx)}</small>` : brl(mn)}</td><td data-l="Variações">${variantsOf(p).length}</td>${UNITS.map(u => { const q = unitStock(p, u.id); return `<td data-l="${esc(u.short)}" class="r num"><span class="qn ${q === 0 ? 'out' : availState(p, u.id) === 'low' ? 'low' : ''}">${q}</span></td>`; }).join('')}<td data-l="Status">${p.active ? pill('Ativo', 'ok') : pill('Inativo', 'mute')}</td></tr>`;
  }).join('')}</tbody></table></div>` : '<div class="empty empty--sm"><p>Nenhum produto encontrado.</p></div>'}
  <p class="rules">${icon('alert', 15)}<span>Alterações valem na hora para a loja. Estoque baixo: de 1 a ${low} unidades.</span></p>`;
}

/* ---------- estoque ---------- */
function stockRows() {
  const f = UI.adm.stk;
  const low = LOW();
  const rows = [];
  S.products.filter(p => p.active && (f.sub === 'all' || p.sub === f.sub) && (!f.q || matchQuery(haystack(p) + ' ' + norm(p.code), f.q))).forEach(p => {
    variantsOf(p).forEach(sel => {
      const vkey = vkeyOf(p, sel);
      const qs = Object.fromEntries(UNITS.map(u => [u.id, stockOf(p.id, vkey, u.id)]));
      const scope = f.unit === 'all' ? Object.values(qs) : [qs[f.unit]];
      const sitOf = q => q === 0 ? 'out' : q <= low ? 'low' : 'ok';
      if (f.sit !== 'all' && !scope.some(q => sitOf(q) === f.sit)) return;
      rows.push({ p, sel, vkey, qs, sku: skuOf(p, sel), label: variantLabel(p, sel) || 'Única' });
    });
  });
  return rows;
}
function admStock() {
  const f = UI.adm.stk;
  const rows = stockRows();
  const shown = rows.slice(0, f.limit);
  const low = LOW();
  const tag = q => q === 0 ? '<span class="st st--bad"><i></i>Esgotado</span>' : q <= low ? '<span class="st st--warn"><i></i>Baixo</span>' : '<span class="st st--ok"><i></i>Disponível</span>';
  return `<div class="filters-row">${seg('adm-stk-unit', f.unit, [['all', 'Todas'], ...UNITS.map(u => [u.id, u.short])])}
    <label class="search-s"><span>${icon('search', 18)}</span><input id="stk-q" data-in="adm-stk-q" value="${esc(f.q)}" placeholder="Buscar produto ou SKU"></label>
    <label class="sel"><span class="sr">Categoria</span><select id="stk-sub" data-in="adm-stk-sub"><option value="all">Todas as categorias</option>${SUBS.map(s => `<option value="${s.id}" ${f.sub === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select></label>
    <label class="sel"><span class="sr">Situação</span><select id="stk-sit" data-in="adm-stk-sit"><option value="all" ${f.sit === 'all' ? 'selected' : ''}>Todas as situações</option><option value="ok" ${f.sit === 'ok' ? 'selected' : ''}>Disponível</option><option value="low" ${f.sit === 'low' ? 'selected' : ''}>Estoque baixo (1 a ${low})</option><option value="out" ${f.sit === 'out' ? 'selected' : ''}>Esgotado</option></select></label></div>
  <div class="sumline"><span>${plural(rows.length, 'variação', 'variações')}</span><span>${f.unit === 'all' ? 'Escolha uma unidade para lançar quantidades.' : 'Lançamentos em ' + esc(unitName(f.unit)) + '. Cada alteração vira uma movimentação.'}</span></div>
  ${rows.length ? `<div class="tblw"><table class="tbl tbl--stk"><thead><tr><th>Produto</th><th>Variação</th><th>SKU</th>${f.unit === 'all' ? UNITS.map(u => `<th class="r">${esc(u.short)}</th>`).join('') : '<th class="r">Quantidade</th><th>Situação</th>'}</tr></thead><tbody>${shown.map(r => `<tr><td data-l="Produto" class="tdp">${thumb(r.p.id, r.vkey)}<b>${esc(r.p.name)}</b></td><td data-l="Variação">${esc(r.label)}</td><td data-l="SKU"><span class="mono small">${esc(r.sku)}</span></td>${f.unit === 'all'
      ? UNITS.map(u => `<td data-l="${esc(u.short)}" class="r num"><span class="qn ${r.qs[u.id] === 0 ? 'out' : r.qs[u.id] <= low ? 'low' : ''}">${r.qs[u.id]}</span></td>`).join('')
      : `<td data-l="Quantidade" class="r"><div class="qty qty--sm"><button data-act="stk-adj" data-pid="${r.p.id}" data-vkey="${esc(r.vkey)}" data-unit="${f.unit}" data-d="-1" ${r.qs[f.unit] === 0 ? 'disabled' : ''} aria-label="Diminuir">${icon('minus', 16)}</button><input class="num qty__in" type="number" min="0" max="99999" inputmode="numeric" value="${r.qs[f.unit]}" data-stk-set="1" data-pid="${r.p.id}" data-vkey="${esc(r.vkey)}" data-unit="${f.unit}" aria-label="Quantidade de ${esc(r.p.name)} ${esc(r.label)}"><button data-act="stk-adj" data-pid="${r.p.id}" data-vkey="${esc(r.vkey)}" data-unit="${f.unit}" data-d="1" aria-label="Aumentar">${icon('plus', 16)}</button></div></td><td data-l="Situação">${tag(r.qs[f.unit])}</td>`}</tr>`).join('')}</tbody></table></div>
  ${rows.length > f.limit ? `<div class="row row--c"><button class="btn btn--soft" data-act="stk-more">Mostrar mais ${Math.min(40, rows.length - f.limit)} de ${rows.length - f.limit}</button></div>` : ''}` : '<div class="empty empty--sm"><p>Nenhuma variação com esses filtros.</p></div>'}
  <p class="rules">${icon('alert', 15)}<span>A baixa automática acontece ao confirmar pedidos; cancelamentos devolvem os itens. O estoque nunca fica negativo.</span></p>`;
}

/* ---------- clientes ---------- */
function admClients() {
  const f = UI.adm.cli;
  const key = `adm-cli-${f.q}`;
  const r = need(key, () => gapi(`/clientes?busca=${encodeURIComponent(f.q)}`));
  return `<div class="filters-row"><label class="search-s"><span>${icon('search', 18)}</span><input id="cli-q" data-in="adm-cli-q" value="${esc(f.q)}" placeholder="Buscar por nome ou telefone"></label></div>
  ${remoteBox(r, key, list => `<div class="sumline"><span>${plural(list.length, 'cliente', 'clientes')}</span></div>
  ${list.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Cliente</th><th>Telefone</th><th class="r">Pedidos</th><th class="r">Compras concluídas</th><th>Último registro</th><th class="r">Assistências</th><th>Unidade preferida</th></tr></thead><tbody>${list.map(c => `<tr data-act="adm-open" data-type="client" data-id="${c.id}" tabindex="0"><td data-l="Cliente"><b>${esc(c.name)}</b>${c.hasAccount ? '<span class="srcb">conta</span>' : ''}</td><td data-l="Telefone" class="num">${esc(c.phone)}</td><td data-l="Pedidos" class="r num">${c.stats.orders}</td><td data-l="Compras" class="r num">${brl(c.stats.spent)}</td><td data-l="Último">${c.stats.last ? fmtDateTime(c.stats.last) : '-'}</td><td data-l="Assistências" class="r num">${c.stats.services}</td><td data-l="Unidade">${c.stats.fav ? esc(unitName(c.stats.fav)) : '-'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty empty--sm"><p>Nenhum cliente ainda. Eles aparecem aqui a partir do primeiro pedido ou solicitação.</p></div>'}`)}
  <p class="rules">${icon('alert', 15)}<span>Um cliente é identificado pelo telefone informado no pedido ou na assistência.</span></p>`;
}

/* ---------- assistência ---------- */
function admServices() {
  const f = UI.adm.svc;
  const r = need('adm-os', () => gapi('/os?status=all'));
  const head = `<div class="filters-row">${seg('adm-svc-view', f.view, [['board', 'Quadro'], ['list', 'Lista']])}${unitSelect('svc-unit', f.unit, 'adm-svc-unit')}</div>`;
  if (r.st !== 'ok') return head + remoteBox(r, 'adm-os');
  let list = r.data.services.slice();
  if (f.unit !== 'all') list = list.filter(s => s.unitId === f.unit);
  const card = sv => `<button class="kcard" data-act="adm-open" data-type="service" data-id="${sv.num}"><span class="kcard__h"><b class="mono">${sv.id}</b><small>${fmtDate(sv.createdAt)}</small></span><b>${esc(sv.brand)} ${esc(sv.model)}</b><span>${esc(sv.service)}</span><span class="kcard__f"><small>${esc(sv.customer.name)} · ${esc((UNITS.find(u => u.id === sv.unitId) || {}).short || '')}</small>${sv.quote ? `<em>${brl(sv.quote.value)}</em>` : ''}</span></button>`;
  let body;
  if (f.view === 'board') {
    body = `<div class="board">${SVC_STATUS.map(st => { const items = list.filter(s => s.status === st.id); return `<section class="bcol bcol--${st.tone}"><h3><i></i>${st.label}<em>${items.length}</em></h3>${items.map(card).join('') || '<p class="bcol__empty">Vazio</p>'}</section>`; }).join('')}</div>`;
  } else {
    if (f.status === 'open') list = list.filter(s => SVC_OPEN.has(s.status)); else if (f.status !== 'all') list = list.filter(s => s.status === f.status);
    body = `<div class="stchips">${[['open', 'Em andamento'], ['all', 'Todas'], ...SVC_STATUS.map(s => [s.id, s.label])].map(([v, l]) => `<button class="stchip ${f.status === v ? 'on' : ''}" data-act="adm-svc-status" data-v="${v}">${l}</button>`).join('')}</div>` +
      (list.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Solicitação</th><th>Cliente</th><th>Aparelho</th><th>Serviço</th><th>Unidade</th><th>Data</th><th>Status</th><th class="r">Orçamento</th></tr></thead><tbody>${list.map(sv => `<tr data-act="adm-open" data-type="service" data-id="${sv.num}" tabindex="0"><td data-l="OS"><b class="mono">${sv.id}</b></td><td data-l="Cliente">${esc(sv.customer.name)}</td><td data-l="Aparelho">${esc(sv.brand)} ${esc(sv.model)}</td><td data-l="Serviço">${esc(sv.service)}</td><td data-l="Unidade">${esc(unitName(sv.unitId))}</td><td data-l="Data">${fmtDateTime(sv.createdAt)}</td><td data-l="Status">${pill(svcLabel(sv.status), svcTone(sv.status))}</td><td data-l="Orçamento" class="r num">${sv.quote ? brl(sv.quote.value) : '-'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty empty--sm"><p>Nenhuma solicitação com esses filtros.</p></div>');
  }
  return head + body + `<p class="rules">${icon('alert', 15)}<span>Registrar orçamento move a solicitação para "Aguardando aprovação do orçamento". O cliente aprova ou recusa pelo acompanhamento.</span></p>`;
}

/* ---------- unidades ---------- */
function admUnits() {
  const r = need('adm-uni', () => gapi('/unidades/resumo'));
  const res = r.st === 'ok' ? Object.fromEntries(r.data.units.map(u => [u.id, u])) : {};
  const can = isGerente();
  return `<div class="ugrid">${UNITS.map(u => {
    const m = res[u.id];
    const f = (UI.adm.unitEdit || {})[u.id] || u;
    return `<section class="panel ucard2"><div class="ucard2__h">${icon('pin', 22)}<h2>${esc(u.name)}</h2>${u.active === false ? pill('Inativa', 'mute') : ''}</div>
      ${m ? `<dl class="umet"><div><dt>Faturamento realizado (30 dias)</dt><dd>${brl(m.revenue)}</dd></div><div><dt>Vendas concluídas</dt><dd>${m.doneCount}</dd></div><div><dt>Pedidos em aberto</dt><dd>${m.openCount}</dd></div><div><dt>Assistências em andamento</dt><dd>${m.svcOpenCount}</dd></div><div><dt>Produtos com estoque</dt><dd>${m.skus} de ${m.totalProducts}</dd></div><div><dt>Variações baixas ou esgotadas</dt><dd>${m.lowCount}</dd></div></dl>
      <h3>Repor primeiro</h3><ul class="lowl">${m.lows.map(l => { const p = P(l.pid); return p ? `<li>${thumb(l.pid, l.vkey)}<span><b>${esc(p.name)}</b><small>${esc(variantLabel(p, selFromKey(p, l.vkey)) || 'Única')}</small></span><span class="qn ${l.q ? 'low' : 'out'}">${l.q}</span></li>` : ''; }).join('') || '<li class="muted">Nada crítico.</li>'}</ul>` : r.st === 'err' ? errorBox(r.err, 'adm-uni') : loadingBox()}
      <form class="form unitf" data-form="unit" data-id="${u.id}" novalidate>
        <h3>Dados da unidade</h3>
        <div class="form form--2"><div class="field"><label for="un-name-${u.id}">Nome</label><input id="un-name-${u.id}" name="name" value="${esc(f.name)}" ${can ? '' : 'disabled'}></div><div class="field"><label for="un-short-${u.id}">Nome curto</label><input id="un-short-${u.id}" name="short" value="${esc(f.short)}" ${can ? '' : 'disabled'}></div></div>
        <div class="field"><label for="un-addr-${u.id}">Endereço</label><input id="un-addr-${u.id}" name="address" value="${esc(f.address)}" placeholder="Rua, número, bairro, cidade" ${can ? '' : 'disabled'}></div>
        <div class="field"><label for="un-hours-${u.id}">Horário</label><input id="un-hours-${u.id}" name="hours" value="${esc(f.hours)}" placeholder="Seg a sáb, 9h às 19h" ${can ? '' : 'disabled'}></div>
        <div class="form form--2"><div class="field"><label for="un-wa-${u.id}">WhatsApp</label><input id="un-wa-${u.id}" name="whatsapp" value="${esc(f.whatsapp ? maskPhone(f.whatsapp) : '')}" data-mask="phone" inputmode="tel" placeholder="(11) 90000-0000" ${can ? '' : 'disabled'}></div><div class="field"><label for="un-ph-${u.id}">Telefone</label><input id="un-ph-${u.id}" name="phone" value="${esc(f.phone)}" ${can ? '' : 'disabled'}></div></div>
        <label class="chk"><input type="checkbox" name="active" ${u.active !== false ? 'checked' : ''} ${can ? '' : 'disabled'}> Unidade ativa na loja</label>
        ${can ? `<button class="btn btn--dark btn--sm" type="submit">Salvar unidade</button>` : '<p class="fine">Só gerentes e administradores alteram os dados das unidades.</p>'}
      </form>
      <div class="row"><a class="btn btn--soft btn--sm" href="#gestao-estoque" data-act="adm-preset" data-v="stk-unit-${u.id}">Ver estoque</a><a class="btn btn--soft btn--sm" href="#gestao-pedidos" data-act="adm-preset" data-v="ord-unit-${u.id}">Ver pedidos</a></div></section>`;
  }).join('')}</div>`;
}

/* ---------- oportunidades ---------- */
function oppMsg(name, unit, model) { return `Olá, ${name.split(' ')[0]}! Aqui é da Doutor do Celular, unidade ${unitName(unit)}. Temos capa e película compatíveis com o seu ${model}. Quer que a gente separe para você?`; }
function admOpps() {
  const r = need('adm-opp', () => gapi('/oportunidades'));
  if (r.st !== 'ok') return remoteBox(r, 'adm-opp');
  const o = r.data;
  const maxCat = Math.max(1, ...o.catList.map(c => c[1]));
  const sg = pid => { const p = P(pid); return p ? `<span class="sg">${thumb(pid)}${esc(p.name)}</span>` : ''; };
  return `<div class="opps">
    <section class="panel opp"><div class="panel__h"><h2>Acessórios para quem comprou celular</h2><span class="cnt">${o.phoneBuys.length}</span></div>
      <p class="rule">Regra: cliente comprou um smartphone e ainda não levou capa ou película compatível com o modelo.</p>
      ${o.phoneBuys.length ? `<ul class="oppl">${o.phoneBuys.map((x, i) => `<li><div class="oppl__t"><button class="lnk" data-act="adm-open" data-type="client" data-id="${x.customer.id}"><b>${esc(x.customer.name)}</b></button><small>${esc(x.model)} · <button class="lnk" data-act="adm-open" data-type="order" data-id="${x.order.num}">${x.order.id}</button> · ${fmtDate(x.order.createdAt)} · falta ${x.missing.map(subLabel).join(' e ').toLowerCase()}</small></div>
        <div class="oppl__s">${x.sugg.map(sg).join('')}</div>
        <textarea class="sr" id="opp-msg-${i}" readonly>${esc(oppMsg(x.customer.name, x.order.unitId, x.model))}</textarea><button class="btn btn--soft btn--sm" data-act="copy" data-src="opp-msg-${i}">${icon('copy', 16)}Copiar mensagem sugerida</button></li>`).join('')}</ul>` : '<p class="muted">Nenhuma oportunidade agora.</p>'}</section>
    <section class="panel opp"><div class="panel__h"><h2>Clientes da assistência</h2><span class="cnt">${o.svcOpps.length}</span></div>
      <p class="rule">Regra: aparelho em reparo, aguardando retirada ou concluído nos últimos 20 dias. Ofereça proteção na retirada.</p>
      ${o.svcOpps.length ? `<ul class="oppl">${o.svcOpps.map(x => `<li><div class="oppl__t"><button class="lnk" data-act="adm-open" data-type="service" data-id="${x.service.num}"><b>${esc(x.customer.name)}</b></button><small>${x.service.id} · ${esc(x.service.brand)} ${esc(x.service.model)} · ${esc(svcLabel(x.service.status))}${x.model ? '' : ' · modelo fora do catálogo, sugestão genérica'}</small></div><div class="oppl__s">${x.sugg.map(sg).join('')}</div></li>`).join('')}</ul>` : '<p class="muted">Nenhuma oportunidade agora.</p>'}</section>
    <section class="panel opp"><div class="panel__h"><h2>Comprados juntos</h2></div><p class="rule">Regra: pares de produtos que aparecem no mesmo pedido (exceto cancelados).</p>
      ${o.pairs.length ? `<ul class="pairs">${o.pairs.map(x => { const a = P(x.a), b = P(x.b); return a && b ? `<li><span class="pairs__th">${thumb(a.id)}${thumb(b.id)}</span><span class="pairs__t"><b>${esc(a.name)}</b><small>+ ${esc(b.name)}</small></span><em>${plural(x.n, 'pedido', 'pedidos')}</em></li>` : ''; }).join('')}</ul><p class="fine">Sugestão: montar combos ou destacar na página do produto.</p>` : '<p class="muted">Ainda não há pedidos com mais de um produto.</p>'}</section>
    <section class="panel opp"><div class="panel__h"><h2>Categorias em movimento</h2></div><p class="rule">Regra: unidades em pedidos dos últimos 30 dias, exceto cancelados.</p>
      ${o.catList.length ? `<ul class="hbars">${o.catList.map(([s, n]) => `<li><span class="hbars__l">${esc(subLabel(s))}</span><span class="hbars__t"><i style="width:${(n / maxCat * 100).toFixed(0)}%"></i></span><span class="hbars__v"><b>${n}</b><small>un.</small></span></li>`).join('')}</ul>` : '<p class="muted">Sem pedidos nos últimos 30 dias.</p>'}</section>
    <section class="panel opp opp--wide"><div class="panel__h"><h2>Reposição sugerida</h2></div><p class="rule">Regra: variação com ${o.lowLimit} unidades ou menos em uma unidade e com vendas nos últimos 30 dias.</p>
      ${o.lows.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Produto</th><th>Variação</th><th>Unidade</th><th class="r">Estoque</th><th class="r">Vendido (30 dias)</th></tr></thead><tbody>${o.lows.map(l => { const p = P(l.pid); return p ? `<tr><td data-l="Produto" class="tdp">${thumb(p.id, l.vkey)}<b>${esc(p.name)}</b></td><td data-l="Variação">${esc(variantLabel(p, selFromKey(p, l.vkey)) || 'Única')}</td><td data-l="Unidade">${esc(unitName(l.unitId))}</td><td data-l="Estoque" class="r num"><span class="qn ${l.q ? 'low' : 'out'}">${l.q}</span></td><td data-l="Vendido" class="r num">${l.sold}</td></tr>` : ''; }).join('')}</tbody></table></div>` : '<p class="muted">Nada a repor com base nas vendas recentes.</p>'}</section>
  </div>
  <p class="rules">${icon('alert', 15)}<span>Sugestões baseadas em regras simples e transparentes. Nenhuma campanha ou mensagem é disparada automaticamente.</span></p>`;
}

/* ---------- ajustes: configurações, categorias, serviços, equipe ---------- */
function admSettings() {
  const cfgR = need('adm-cfg', () => gapi('/configuracoes'));
  const usersR = isAdmin() ? need('adm-users', () => api('/auth/usuarios', { auth: 'equipe' })) : null;
  const admin = isAdmin(), ger = isGerente();
  const cfg = cfgR.st === 'ok' ? cfgR.data : null;
  return `<div class="ugrid">
    <section class="panel"><div class="panel__h"><h2>Configurações da loja</h2></div>
      ${cfg ? `<form class="form" data-form="cfg" novalidate>
        <div class="field"><label for="cf-low">Estoque baixo: até quantas unidades</label><input id="cf-low" name="estoque_baixo_limite" type="number" min="0" max="1000" value="${esc(cfg.estoque_baixo_limite)}" ${admin ? '' : 'disabled'}></div>
        <div class="field"><label for="cf-wa">WhatsApp geral da loja</label><input id="cf-wa" name="whatsapp_geral" data-mask="phone" inputmode="tel" value="${esc(cfg.whatsapp_geral ? maskPhone(cfg.whatsapp_geral) : '')}" placeholder="(11) 90000-0000" ${admin ? '' : 'disabled'}><small class="fine">Usado quando a unidade não tem WhatsApp próprio.</small></div>
        <div class="field"><label for="cf-del">Texto da entrega</label><textarea id="cf-del" name="texto_entrega" rows="2" ${admin ? '' : 'disabled'}>${esc(cfg.texto_entrega)}</textarea></div>
        <div class="field"><label for="cf-pay">Texto do pagamento</label><textarea id="cf-pay" name="texto_pagamento" rows="2" ${admin ? '' : 'disabled'}>${esc(cfg.texto_pagamento)}</textarea></div>
        ${admin ? '<button class="btn btn--dark btn--sm" type="submit">Salvar configurações</button>' : '<p class="fine">Somente administradores alteram estas configurações.</p>'}
      </form>` : remoteBox(cfgR, 'adm-cfg')}</section>
    <section class="panel"><div class="panel__h"><h2>Categorias</h2></div>
      <ul class="setl">${SUBS.map(s => `<li><form class="setl__f" data-form="cat" data-id="${s.id}" novalidate><input name="label" value="${esc(s.label)}" aria-label="Nome da categoria" ${ger ? '' : 'disabled'}><select name="group" aria-label="Grupo" ${ger ? '' : 'disabled'}><option value="celulares" ${s.group === 'celulares' ? 'selected' : ''}>Celulares</option><option value="acessorios" ${s.group === 'acessorios' ? 'selected' : ''}>Acessórios</option></select><label class="chk"><input type="checkbox" name="active" ${s.active !== false ? 'checked' : ''} ${ger ? '' : 'disabled'}> Ativa</label>${ger ? '<button class="btn btn--soft btn--sm" type="submit">Salvar</button>' : ''}</form></li>`).join('')}</ul>
      ${ger ? `<form class="setl__f setl__new" data-form="cat-new" novalidate><input name="label" placeholder="Nova categoria" aria-label="Nova categoria"><select name="group" aria-label="Grupo"><option value="acessorios">Acessórios</option><option value="celulares">Celulares</option></select><button class="btn btn--y btn--sm" type="submit">${icon('plus', 16)}Adicionar</button></form>` : ''}</section>
    <section class="panel"><div class="panel__h"><h2>Serviços da assistência</h2></div>
      <ul class="setl">${SERVICES.map(s => `<li><form class="setl__f" data-form="svc-cat" data-id="${s.id}" novalidate><input name="name" value="${esc(s.name)}" aria-label="Nome do serviço" ${ger ? '' : 'disabled'}><input name="desc" value="${esc(s.desc)}" aria-label="Descrição" ${ger ? '' : 'disabled'}><label class="chk"><input type="checkbox" name="active" ${s.active !== false ? 'checked' : ''} ${ger ? '' : 'disabled'}> Ativo</label>${ger ? '<button class="btn btn--soft btn--sm" type="submit">Salvar</button>' : ''}</form></li>`).join('')}</ul>
      ${ger ? `<form class="setl__f setl__new" data-form="svc-cat-new" novalidate><input name="name" placeholder="Novo serviço" aria-label="Novo serviço"><input name="desc" placeholder="Descrição" aria-label="Descrição"><button class="btn btn--y btn--sm" type="submit">${icon('plus', 16)}Adicionar</button></form>` : ''}</section>
    <section class="panel"><div class="panel__h"><h2>Minha senha</h2></div>
      <form class="form" data-form="my-pass" novalidate><div class="field"><label for="mp-cur">Senha atual</label><input id="mp-cur" name="senhaAtual" type="password" autocomplete="current-password"></div><div class="field"><label for="mp-new">Nova senha</label><input id="mp-new" name="novaSenha" type="password" minlength="6" autocomplete="new-password"></div><button class="btn btn--dark btn--sm" type="submit">Trocar senha</button></form></section>
    ${admin ? `<section class="panel panel--full"><div class="panel__h"><h2>Equipe</h2></div>
      ${usersR.st === 'ok' ? `<div class="tblw"><table class="tbl"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th></th></tr></thead><tbody>${usersR.data.map(u => `<tr><td data-l="Nome"><b>${esc(u.nome)}</b></td><td data-l="E-mail">${esc(u.email)}</td><td data-l="Perfil"><select data-user-perfil="${u.id}" aria-label="Perfil de ${esc(u.nome)}">${['ADMIN', 'GERENTE', 'OPERADOR'].map(p => `<option value="${p}" ${u.perfil === p ? 'selected' : ''}>${PERFIL_LABEL[p]}</option>`).join('')}</select></td><td data-l="Situação">${u.ativo ? pill('Ativo', 'ok') : pill('Inativo', 'mute')}</td><td><button class="btn btn--soft btn--sm" data-act="user-toggle" data-id="${u.id}" data-v="${u.ativo ? '0' : '1'}">${u.ativo ? 'Desativar' : 'Reativar'}</button></td></tr>`).join('')}</tbody></table></div>` : remoteBox(usersR, 'adm-users')}
      <form class="setl__f setl__new" data-form="user-new" novalidate><input name="nome" placeholder="Nome" aria-label="Nome"><input name="email" type="email" placeholder="E-mail" aria-label="E-mail"><input name="senha" type="password" placeholder="Senha inicial" aria-label="Senha inicial" autocomplete="new-password"><select name="perfil" aria-label="Perfil"><option value="OPERADOR">Operador</option><option value="GERENTE">Gerente</option><option value="ADMIN">Administrador</option></select><button class="btn btn--y btn--sm" type="submit">${icon('plus', 16)}Adicionar</button></form>
      <p class="fine">Operador: pedidos, assistência e estoque. Gerente: também catálogo, unidades e categorias. Administrador: também configurações e equipe.</p></section>` : ''}
  </div>`;
}

/* ---------- gaveta de detalhes ---------- */
function admDrawer() {
  const d = UI.adm.drawer; if (!d) return '';
  let inner = '';
  if (d.type === 'order') { const r = need('adm-ordd-' + d.id, () => gapi('/pedidos/' + d.id).then(x => x.order)); inner = remoteBox(r, 'adm-ordd-' + d.id, drawerOrder); }
  else if (d.type === 'service') { const r = need('adm-osd-' + d.id, () => gapi('/os/' + d.id).then(x => x.service)); inner = remoteBox(r, 'adm-osd-' + d.id, drawerService); }
  else if (d.type === 'client') { const r = need('adm-clid-' + d.id, () => gapi('/clientes/' + d.id)); inner = remoteBox(r, 'adm-clid-' + d.id, drawerClient); }
  else if (d.type === 'product') inner = drawerProduct(P(d.id));
  return `<div class="scrim scrim--drawer" data-act="adm-close"></div><aside class="drawer" role="dialog" aria-modal="true"><button class="modal__x" data-act="adm-close" aria-label="Fechar">${icon('x', 22)}</button>${inner}</aside>`;
}
function histList(h, labelFn) { return `<ol class="hist">${[...h].reverse().map(x => `<li><b>${esc(labelFn(x.s))}</b><small>${fmtDateTime(x.at)}${x.by === 'cliente' ? ' · pelo cliente' : ''}${x.note ? ' · ' + esc(x.note) : ''}</small></li>`).join('')}</ol>`; }
function drawerOrder(o) {
  return `<div class="dw"><span class="muted small">Pedido · ${o.source === 'site' ? 'feito pelo site' : esc(o.source)}</span><h2 class="mono">${o.id}</h2>
    <div class="dw__st">${pill(orderStatusLabel(o), orderTone(o.status))}<small>Criado em ${fmtDateTime(o.createdAt)}</small></div>
    <h3>Alterar status</h3><div class="stset">${ORDER_STATUS.map(s => `<button class="stset__b st--${s.tone} ${o.status === s.id ? 'on' : ''}" data-act="ord-set" data-id="${o.num}" data-v="${s.id}" aria-pressed="${o.status === s.id}" ${UI.busy ? 'disabled' : ''}><i></i>${orderStatusLabel(o, s.id)}</button>`).join('')}</div>
    <p class="stockinfo ${o.stockApplied ? 'yes' : ''}">${icon(o.stockApplied ? 'check' : 'clock', 16)}${o.stockApplied ? `Estoque baixado em ${esc(unitName(o.unitId))}. Cancelar devolve os itens.` : `Estoque ainda não baixado. A baixa ocorre ao confirmar.`}</p>
    <h3>Cliente</h3><button class="dwlink" data-act="adm-open" data-type="client" data-id="${o.customerId}"><b>${esc(o.customer.name)}</b><small>${esc(o.customer.phone)}${o.customer.email ? ' · ' + esc(o.customer.email) : ''}</small>${icon('chevR', 16)}</button>
    <h3>Itens</h3><ul class="mini">${o.items.map(l => `<li>${thumb(l.pid, l.vkey)}<span class="mini__t"><b>${esc(l.name)}</b><small>${esc(l.variant)} · <span class="mono">${esc(l.sku)}</span> · ${l.qty} × ${brl(l.price)}</small></span><b>${brl(l.qty * l.price)}</b></li>`).join('')}</ul>
    <div class="summary__tot"><span>Total</span><b>${brl(o.total)}</b></div>
    <dl class="dwdl"><div><dt>Unidade</dt><dd>${esc(unitName(o.unitId))}</dd></div><div><dt>Modalidade</dt><dd>${o.mode === 'retirada' ? 'Retirada' : 'Entrega · ' + esc(o.address)}</dd></div><div><dt>Pagamento</dt><dd>${esc(PAY[o.pay] || o.pay)} (combinar com o cliente)</dd></div><div><dt>Conta como venda</dt><dd>${o.status === 'concluido' ? 'Sim, concluído em ' + fmtDateTime(o.completedAt) : 'Não, ainda não concluído'}</dd></div>${o.note ? `<div class="full"><dt>Observação do cliente</dt><dd>${esc(o.note)}</dd></div>` : ''}</dl>
    <h3>Histórico</h3>${histList(o.history, s => orderStatusLabel(o, s))}</div>`;
}
function drawerService(sv) {
  const qf = UI.adm.quote[sv.num] || (UI.adm.quote[sv.num] = { value: sv.quote ? String(sv.quote.value).replace('.', ',') : '', note: sv.quote ? sv.quote.note : '' });
  const dec = sv.quote && sv.quote.decision ? (sv.quote.decision === 'aprovado' ? pill('Aprovado pelo cliente', 'ok') : pill('Recusado pelo cliente', 'bad')) : sv.quote ? pill('Aguardando o cliente', 'warn') : '';
  return `<div class="dw"><span class="muted small">Assistência técnica</span><h2 class="mono">${sv.id}</h2>
    <div class="dw__st">${pill(svcLabel(sv.status), svcTone(sv.status))}<small>Aberta em ${fmtDateTime(sv.createdAt)} · ${esc(unitName(sv.unitId))}</small></div>
    <dl class="dwdl"><div><dt>Aparelho</dt><dd>${esc(sv.brand)} ${esc(sv.model)}</dd></div><div><dt>Serviço</dt><dd>${esc(sv.service)}</dd></div><div class="full"><dt>Problema relatado</dt><dd>${esc(sv.desc)}</dd></div></dl>
    <h3>Cliente</h3><button class="dwlink" data-act="adm-open" data-type="client" data-id="${sv.customerId}"><b>${esc(sv.customer.name)}</b><small>${esc(sv.customer.phone)}</small>${icon('chevR', 16)}</button>
    <h3>Alterar status</h3><div class="stset">${SVC_STATUS.map(s => `<button class="stset__b st--${s.tone} ${sv.status === s.id ? 'on' : ''}" data-act="svc-set" data-id="${sv.num}" data-v="${s.id}" aria-pressed="${sv.status === s.id}" ${UI.busy ? 'disabled' : ''}><i></i>${s.label}</button>`).join('')}</div>
    <h3>Orçamento ${dec}</h3>
    <form class="quotef" data-form="quote" data-id="${sv.num}" novalidate><div class="field"><label for="qv-${sv.num}">Valor (R$)</label><input id="qv-${sv.num}" inputmode="decimal" data-in="quote.value" data-id="${sv.num}" value="${esc(qf.value)}" placeholder="0,00"></div><div class="field"><label for="qn-${sv.num}">Observação</label><input id="qn-${sv.num}" data-in="quote.note" data-id="${sv.num}" value="${esc(qf.note)}" placeholder="Ex.: peça sob consulta, prazo de 3 dias"></div><button class="btn btn--dark btn--sm" type="submit">${sv.quote ? 'Atualizar orçamento' : 'Registrar orçamento'}</button></form>
    <p class="fine">O valor aparece no acompanhamento do cliente, que aprova ou recusa por lá. Atualizar o valor pede uma nova resposta.</p>
    <h3>Histórico</h3>${histList(sv.history, svcLabel)}</div>`;
}
function drawerClient(d) {
  const c = d.customer, orders = d.orders, svcs = d.services;
  const spent = orders.filter(o => o.status === 'concluido').reduce((s, o) => s + o.total, 0);
  return `<div class="dw"><span class="muted small">Cliente${c.hasAccount ? ' · tem conta no site' : ''}</span><h2>${esc(c.name)}</h2><p class="muted">${esc(c.phone)}${c.email ? ' · ' + esc(c.email) : ''}</p>
    <div class="kpis3"><div><span>Pedidos</span><b>${orders.length}</b></div><div><span>Compras concluídas</span><b>${brl(spent)}</b></div><div><span>Assistências</span><b>${svcs.length}</b></div></div>
    <h3>Pedidos</h3>${orders.length ? `<ul class="recs recs--dw">${orders.map(o => `<li><button data-act="adm-open" data-type="order" data-id="${o.num}"><span class="recs__t"><b class="mono">${o.id}</b><small>${fmtDateTime(o.createdAt)} · ${brl(o.total)} · ${esc(o.items.map(l => l.name).join(', '))}</small></span>${pill(orderStatusLabel(o), orderTone(o.status))}</button></li>`).join('')}</ul>` : '<p class="muted">Sem pedidos.</p>'}
    <h3>Assistências</h3>${svcs.length ? `<ul class="recs recs--dw">${svcs.map(sv => `<li><button data-act="adm-open" data-type="service" data-id="${sv.num}"><span class="recs__t"><b class="mono">${sv.id}</b><small>${esc(sv.brand)} ${esc(sv.model)} · ${esc(sv.service)}</small></span>${pill(svcLabel(sv.status), svcTone(sv.status))}</button></li>`).join('')}</ul>` : '<p class="muted">Sem assistências.</p>'}</div>`;
}

/* Edição completa do produto: dados, preço, variações (opções e combinações bloqueadas) e foto. */
function editFrom(p) {
  return {
    id: p.id, name: p.name, brand: p.brand, model: p.model, sub: p.sub, code: p.code, price: String(p.price).replace('.', ','), rank: String(p.rank), isNew: !!p.isNew, desc: p.desc, tags: p.tags || '',
    specs: (p.specs || []).map(([k, v]) => `${k}: ${v}`).join('\n'), compat: (p.compat || []).join(', '),
    options: JSON.parse(JSON.stringify(p.options || [])).map(o => ({ ...o, values: o.values.map(v => ({ v: v.v, d: v.d ? String(v.d).replace('.', ',') : '', hex: v.hex || '' })) })),
    exclude: JSON.parse(JSON.stringify(p.exclude || [])), err: '',
  };
}
function drawerProduct(p) {
  if (!p) return '<p>Produto não encontrado.</p>';
  const e = UI.adm.edit && UI.adm.edit.id === p.id ? UI.adm.edit : (UI.adm.edit = editFrom(p));
  const can = isGerente();
  const dis = can ? '' : 'disabled';
  const vs = variantsOf(p);
  const low = LOW();
  const optEditor = e.options.map((o, i) => `<div class="opted"><div class="opted__h"><input data-in="edit.opt" data-i="${i}" data-f="name" value="${esc(o.name)}" aria-label="Nome da opção" placeholder="Ex.: Cor" ${dis}><select data-in="edit.opt" data-i="${i}" data-f="type" aria-label="Tipo" ${dis}><option value="pill" ${o.type !== 'color' ? 'selected' : ''}>Botões</option><option value="color" ${o.type === 'color' ? 'selected' : ''}>Cores</option></select>${can ? `<button type="button" class="iconbtn" data-act="ed-opt-rm" data-i="${i}" aria-label="Remover opção">${icon('trash', 17)}</button>` : ''}</div>
      ${o.values.map((v, j) => `<div class="opted__v"><input data-in="edit.val" data-i="${i}" data-j="${j}" data-f="v" value="${esc(v.v)}" aria-label="Valor" placeholder="Valor" ${dis}><input data-in="edit.val" data-i="${i}" data-j="${j}" data-f="d" value="${esc(v.d)}" inputmode="decimal" aria-label="Acréscimo em reais" placeholder="+ R$" ${dis}>${o.type === 'color' ? `<input data-in="edit.val" data-i="${i}" data-j="${j}" data-f="hex" value="${esc(v.hex)}" aria-label="Cor (#RRGGBB)" placeholder="#RRGGBB" ${dis}>` : ''}${can ? `<button type="button" class="iconbtn" data-act="ed-val-rm" data-i="${i}" data-j="${j}" aria-label="Remover valor">${icon('x', 16)}</button>` : ''}</div>`).join('')}
      ${can ? `<button type="button" class="lnk" data-act="ed-val-add" data-i="${i}">${icon('plus', 15)}Adicionar valor</button>` : ''}</div>`).join('');
  const exEditor = e.exclude.map((ex, k) => `<div class="opted__v">${e.options.filter(o => o.values.length > 1).map(o => `<select data-in="edit.ex" data-k="${k}" data-o="${esc(o.name)}" aria-label="${esc(o.name)}" ${dis}><option value="">${esc(o.name)}: qualquer</option>${o.values.map(v => `<option value="${esc(v.v)}" ${ex[o.name] === v.v ? 'selected' : ''}>${esc(v.v)}</option>`).join('')}</select>`).join('')}${can ? `<button type="button" class="iconbtn" data-act="ed-ex-rm" data-k="${k}" aria-label="Remover combinação">${icon('x', 16)}</button>` : ''}</div>`).join('');
  const mov = UI.adm.showMov === p.id ? need('adm-mov-' + p.id, () => gapi('/estoque/movimentacoes?produtoId=' + encodeURIComponent(p.id) + '&limite=40')) : null;
  return `<div class="dw"><span class="muted small mono">${esc(p.code)}</span><h2>${esc(p.name)}</h2>
    <div class="dw__st">${p.active ? pill('Ativo na loja', 'ok') : pill('Inativo', 'mute')}<small>${esc(subLabel(p.sub))} · ${esc(p.brand)}</small></div>
    <div class="dw__img">${productArt(p)}</div>
    ${can ? `<div class="row"><label class="btn btn--soft btn--sm" for="ph-up">${icon('camera', 16)}${p.image ? 'Trocar foto' : 'Enviar foto'}</label><input id="ph-up" class="sr" type="file" accept="image/jpeg,image/png,image/webp" data-up="photo" data-id="${p.id}">${p.image ? `<button class="btn btn--soft btn--sm" data-act="photo-rm" data-id="${p.id}">${icon('trash', 16)}Remover foto</button>` : ''}</div><p class="fine">JPG, PNG ou WEBP. A foto é reduzida antes do envio. Sem foto, a loja usa a ilustração da categoria.</p>` : ''}
    <form data-form="prod-edit" data-id="${p.id}" class="form" novalidate>
      <div class="field"><label for="pe-name">Nome</label><input id="pe-name" data-in="edit.name" value="${esc(e.name)}" ${dis}></div>
      <div class="form form--2">
        <div class="field"><label for="pe-brand">Marca</label><input id="pe-brand" data-in="edit.brand" value="${esc(e.brand)}" ${dis}></div>
        <div class="field"><label for="pe-model">Modelo</label><input id="pe-model" data-in="edit.model" value="${esc(e.model)}" ${dis}></div>
        <div class="field"><label for="pe-sub">Categoria</label><select id="pe-sub" data-in="edit.sub" ${dis}>${SUBS.map(s => `<option value="${s.id}" ${e.sub === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select></div>
        <div class="field"><label for="pe-code">Código</label><input id="pe-code" data-in="edit.code" value="${esc(e.code)}" ${dis}></div>
        <div class="field"><label for="pe-price">Preço base (R$)</label><input id="pe-price" inputmode="decimal" data-in="edit.price" value="${esc(e.price)}" ${dis}></div>
        <div class="field"><label for="pe-rank">Ordem na vitrine</label><input id="pe-rank" type="number" min="0" data-in="edit.rank" value="${esc(e.rank)}" ${dis}></div>
      </div>
      <label class="chk"><input type="checkbox" data-in="edit.isNew" ${e.isNew ? 'checked' : ''} ${dis}> Marcar como novidade</label>
      <div class="field"><label for="pe-desc">Descrição</label><textarea id="pe-desc" rows="3" data-in="edit.desc" ${dis}>${esc(e.desc)}</textarea></div>
      <div class="field"><label for="pe-specs">Especificações <span class="opt-l">uma por linha, "Rótulo: valor"</span></label><textarea id="pe-specs" rows="3" data-in="edit.specs" ${dis}>${esc(e.specs)}</textarea></div>
      <div class="form form--2"><div class="field"><label for="pe-tags">Palavras de busca</label><input id="pe-tags" data-in="edit.tags" value="${esc(e.tags)}" ${dis}></div>
      <div class="field"><label for="pe-compat">Compatibilidade (famílias)</label><input id="pe-compat" data-in="edit.compat" value="${esc(e.compat)}" placeholder="iPhone, Samsung Galaxy, Universal" ${dis}></div></div>
      <h3>Variações</h3><p class="fine">Cada opção gera variações combinadas. O acréscimo soma ao preço base (use negativo para desconto).</p>
      ${optEditor}${can ? `<button type="button" class="lnk" data-act="ed-opt-add">${icon('plus', 15)}Adicionar opção</button>` : ''}
      ${e.options.filter(o => o.values.length > 1).length > 1 ? `<h3>Combinações que não existem</h3>${exEditor || '<p class="fine">Nenhuma combinação bloqueada.</p>'}${can ? `<button type="button" class="lnk" data-act="ed-ex-add">${icon('plus', 15)}Bloquear combinação</button>` : ''}` : ''}
      ${e.err ? `<p class="ferr" role="alert">${esc(e.err)}</p>` : ''}
      ${can ? `<div class="row"><button class="btn btn--dark btn--sm" type="submit" ${UI.busy ? 'disabled' : ''}>Salvar alterações</button><button type="button" class="btn btn--soft btn--sm" data-act="prod-toggle" data-id="${p.id}">${icon('power', 16)}${p.active ? 'Desativar' : 'Reativar'}</button>${p.active ? `<a class="lnk" href="#produto-${p.id}">${icon('eye', 16)}Ver na loja</a>` : ''}</div>` : '<p class="fine">Só gerentes e administradores editam o catálogo.</p>'}
    </form>
    <h3>Variações e estoque por unidade</h3>
    <div class="tblw"><table class="tbl tbl--mini"><thead><tr><th>Variação</th><th class="r">Preço</th>${UNITS.map(u => `<th class="r">${esc(u.short)}</th>`).join('')}</tr></thead><tbody>${vs.map(sel => { const k = vkeyOf(p, sel); return `<tr><td data-l="Variação">${esc(variantLabel(p, sel) || 'Única')}<small class="mono"> ${esc(skuOf(p, sel))}</small></td><td data-l="Preço" class="r num">${brl(variantPrice(p, sel))}</td>${UNITS.map(u => { const q = stockOf(p.id, k, u.id); return `<td data-l="${esc(u.short)}" class="r num"><span class="qn ${q === 0 ? 'out' : q <= low ? 'low' : ''}">${q}</span></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>
    <div class="row"><a class="lnk" href="#gestao-estoque" data-act="adm-preset" data-v="stk-q-${esc(p.code)}">${icon('layers', 16)}Lançar estoque</a><button class="lnk" data-act="mov-toggle" data-id="${p.id}">${icon('list', 16)}${mov ? 'Ocultar movimentações' : 'Ver movimentações'}</button></div>
    ${mov ? remoteBox(mov, 'adm-mov-' + p.id, list => list.length ? `<ol class="hist">${list.map(m => `<li><b>${m.qty > 0 ? '+' : ''}${m.qty} · ${esc(m.type === 'VENDA' ? 'Venda' : m.type === 'DEVOLUCAO' ? 'Devolução' : 'Ajuste')} · ${esc(unitName(m.unitId))}</b><small>${fmtDateTime(m.at)} · saldo ${m.balance} · ${esc(variantLabel(p, selFromKey(p, m.vkey)) || 'Única')}${m.order ? ' · ' + m.order : ''}${m.user ? ' · ' + esc(m.user) : ''}${m.reason ? ' · ' + esc(m.reason) : ''}</small></li>`).join('')}</ol>` : '<p class="muted">Sem movimentações ainda.</p>') : ''}
  </div>`;
}
function admModal(m) {
  if (m.sub === 'np') {
    const np = UI.adm.np;
    const colors = ['Preto', 'Branco', 'Cinza', 'Prata', 'Azul', 'Azul-marinho', 'Verde-menta', 'Lilás', 'Rosa', 'Amarelo', 'Vermelho', 'Laranja'];
    const fe = k => np.err && np.err[k] ? `<p class="ferr">${esc(np.err[k])}</p>` : '';
    return `<div class="scrim scrim--modal" data-act="modal-close"></div><div class="modal modal--wide" role="dialog" aria-modal="true"><button class="modal__x" data-act="modal-close" aria-label="Fechar">${icon('x', 22)}</button>
      <h2>Novo produto</h2><p class="muted">O produto aparece na loja assim que for cadastrado. Variações extras, foto e combinações podem ser ajustadas depois, na ficha do produto.</p>
      <form data-form="np" novalidate><div class="np">
        <div class="np__prev">${productArt({ id: 'np', art: AUTO_ART[np.sub] || {}, options: [opt('Cor', np.colors.length ? np.colors : ['Preto'])] }, { 'Cor': np.colors[0] || 'Preto' })}<small>Ilustração gerada pela categoria</small></div>
        <div class="form">
          <div class="field ${np.err && np.err.name ? 'bad' : ''}"><label for="np-name">Nome *</label><input id="np-name" data-in="np.name" value="${esc(np.name)}" placeholder="Ex.: Capa de couro">${fe('name')}</div>
          <div class="form form--2"><div class="field"><label for="np-sub">Categoria</label><select id="np-sub" data-in="np.sub">${SUBS.map(s => `<option value="${s.id}" ${np.sub === s.id ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select></div>
          <div class="field"><label for="np-brand">Marca</label><input id="np-brand" data-in="np.brand" value="${esc(np.brand)}"></div>
          <div class="field ${np.err && np.err.price ? 'bad' : ''}"><label for="np-price">Preço (R$) *</label><input id="np-price" inputmode="decimal" data-in="np.price" value="${esc(np.price)}" placeholder="0,00">${fe('price')}</div>
          <div class="field"><label for="np-stock">Estoque inicial por unidade</label><input id="np-stock" type="number" min="0" max="9999" data-in="np.stock" value="${esc(np.stock)}"></div></div>
          <div class="field"><span class="lbl">Cores</span><div class="opt__vals opt__vals--sw">${colors.map(c => `<button type="button" class="sw ${np.colors.includes(c) ? 'on' : ''}" data-act="np-color" data-v="${c}" aria-pressed="${np.colors.includes(c)}"><i style="background:${COLOR_HEX[c]}"></i><span>${c}</span></button>`).join('')}</div></div>
          <div class="field"><label for="np-desc">Descrição</label><textarea id="np-desc" rows="2" data-in="np.desc">${esc(np.desc)}</textarea></div>
          ${np.err && np.err.submit ? `<p class="ferr" role="alert">${esc(np.err.submit)}</p>` : ''}
        </div></div>
        <div class="row"><button type="button" class="btn btn--soft grow" data-act="modal-close">Cancelar</button><button class="btn btn--y grow" type="submit" ${UI.busy ? 'disabled' : ''}>${icon('plus', 18)}Cadastrar produto</button></div>
      </form></div>`;
  }
  return '';
}
