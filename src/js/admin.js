/* ============ Painel de gestão (demonstrativo) ============ */
const ADM_NAV = [
  ['dashboard', 'dash', 'Visão geral', 'Indicadores calculados a partir dos pedidos e serviços do protótipo'],
  ['pedidos', 'receipt', 'Pedidos e vendas', 'Pedidos do site e da base inicial, com status e regra de estoque'],
  ['produtos', 'box', 'Produtos', 'Catálogo compartilhado com a loja'],
  ['estoque', 'layers', 'Estoque', 'Quantidades por unidade e variação'],
  ['clientes', 'users', 'Clientes', 'Histórico de pedidos e assistências'],
  ['assistencia', 'wrench', 'Assistência técnica', 'Solicitações de reparo e orçamentos'],
  ['unidades', 'pin', 'Unidades', 'Indicadores e estoque por unidade'],
  ['oportunidades', 'target', 'Oportunidades', 'Regras simples para ações comerciais'],
];
const PERIODS = [['hoje', 'Hoje'], ['7', '7 dias'], ['30', '30 dias'], ['tudo', 'Tudo']];
function lowCount() { let n = 0; activeProducts().forEach(p => variantsOf(p).forEach(sel => UNITS.forEach(u => { const q = stockOf(p.id, vkeyOf(p, sel), u.id); if (q > 0 && q <= 3) n++; }))); return n; }

function adminShell(r) {
  const mod = ADM_NAV.find(n => n[0] === r.name) || ADM_NAV[0];
  const badges = { pedidos: S.orders.filter(o => o.status === 'recebido' || o.status === 'aguardando').length, assistencia: S.services.filter(s => SVC_OPEN.has(s.status)).length, estoque: lowCount() };
  let content = '';
  switch (mod[0]) {
    case 'pedidos': content = admOrders(); break;
    case 'produtos': content = admProducts(); break;
    case 'estoque': content = admStock(); break;
    case 'clientes': content = admClients(); break;
    case 'assistencia': content = admServices(); break;
    case 'unidades': content = admUnits(); break;
    case 'oportunidades': content = admOpps(); break;
    default: content = admDashboard();
  }
  return `<div class="adm">
    <aside class="adm__side ${UI.adm.admNav ? 'open' : ''}" aria-label="Módulos de gestão">
      <div class="adm__brand"><img src="${ASSETS.emblem}" alt=""><div><b>Doutor do Celular</b><small>Gestão · demonstração</small></div><button class="hd__btn adm__close" data-act="adm-nav" aria-label="Fechar menu">${icon('x', 22)}</button></div>
      <nav>${ADM_NAV.map(([id, ic, l]) => `<a href="#gestao${id === 'dashboard' ? '' : '-' + id}" class="${mod[0] === id ? 'on' : ''}" ${mod[0] === id ? 'aria-current="page"' : ''}>${icon(ic, 20)}<span>${l}</span>${badges[id] ? `<em title="${id === 'estoque' ? 'variações com estoque baixo' : 'aguardando ação'}">${badges[id]}</em>` : ''}</a>`).join('')}</nav>
      <div class="adm__foot"><a class="btn btn--y btn--block" href="#inicio">${icon('store', 18)}Ver loja</a><button class="adm__reset" data-act="reset-ask">${icon('refresh', 16)}Restaurar dados iniciais</button><p>Ambiente demonstrativo da SMG, sem login. Alterações ficam salvas apenas neste navegador.</p></div>
    </aside>
    ${UI.adm.admNav ? '<div class="scrim scrim--adm" data-act="adm-nav"></div>' : ''}
    <div class="adm__main">
      <header class="adm__top"><button class="hd__btn adm__menu" data-act="adm-nav" aria-label="Abrir módulos">${icon('menu', 24)}</button>
        <div class="adm__title"><h1>${mod[2]}</h1><p>${mod[3]}</p><span class="adm__simm">${icon('alert', 12)}Dados simulados</span></div>
        <span class="simchip">${icon('alert', 14)}Dados simulados</span>
        <a class="btn btn--dark btn--sm adm__shop" href="#inicio">${icon('store', 16)}Loja</a></header>
      <div class="adm__content">${content}</div>
    </div>
    ${admDrawer()}
  </div>`;
}
const seg = (act, cur, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;
const unitSelect = (id, cur, act) => `<label class="sel"><span class="sr">Unidade</span><select id="${id}" data-in="${act}"><option value="all" ${cur === 'all' ? 'selected' : ''}>Todas as unidades</option>${UNITS.map(u => `<option value="${u.id}" ${cur === u.id ? 'selected' : ''}>${u.name}</option>`).join('')}</select></label>`;
const thumb = (pid, vkey) => { const p = P(pid); return `<span class="thumb">${p ? productArt(p, vkey ? selFromKey(p, vkey) : {}) : ''}</span>`; };

/* ---------- visão geral ---------- */
function admDashboard() {
  const a = UI.adm, m = metrics(a.period, a.unit);
  const perLabel = { hoje: 'hoje', '7': 'nos últimos 7 dias', '30': 'nos últimos 30 dias', tudo: 'desde o início da base' }[a.period];
  const waiting = m.open.filter(o => o.status === 'recebido' || o.status === 'aguardando');
  const ready = m.open.filter(o => o.status === 'pronto');
  const quotes = m.svcOpen.filter(s => s.status === 'orcamento');
  const evals = m.svcOpen.filter(s => s.status === 'recebida' || s.status === 'avaliacao');
  const alerts = [
    waiting.length && ['warn', 'receipt', `${plural(waiting.length, 'pedido aguardando', 'pedidos aguardando')} confirmação`, 'gestao-pedidos', 'ord-wait'],
    ready.length && ['go', 'box', `${plural(ready.length, 'pedido pronto', 'pedidos prontos')} para retirada ou envio`, 'gestao-pedidos', 'ord-ready'],
    evals.length && ['warn', 'wrench', `${plural(evals.length, 'aparelho aguardando', 'aparelhos aguardando')} avaliação`, 'gestao-assistencia', ''],
    quotes.length && ['info', 'receipt', `${plural(quotes.length, 'orçamento aguardando', 'orçamentos aguardando')} aprovação do cliente`, 'gestao-assistencia', ''],
    (m.low || m.out) && ['bad', 'layers', `${m.low} variações com estoque baixo e ${m.out} esgotadas`, 'gestao-estoque', 'stk-low'],
  ].filter(Boolean);
  const maxU = Math.max(...m.byUnit.map(u => u.v), 1);
  const maxT = Math.max(...m.top.map(t => t.qty), 1);
  const recent = [...S.orders].filter(o => a.unit === 'all' || o.unitId === a.unit).sort((x, y) => y.createdAt - x.createdAt).slice(0, 6);
  return `<div class="filters-row">${seg('adm-period', a.period, PERIODS)}${unitSelect('dash-unit', a.unit, 'adm-unit')}</div>
  <div class="kpis">
    <div class="kpi kpi--hero"><span>Faturamento realizado</span><b>${brl(m.revenue)}</b><small>${plural(m.done.length, 'venda concluída', 'vendas concluídas')} ${perLabel}</small></div>
    <div class="kpi"><span>Vendas hoje</span><b>${brl(m.todayRevenue)}</b><small>${plural(m.today.length, 'pedido concluído', 'pedidos concluídos')}</small></div>
    <div class="kpi"><span>Ticket médio</span><b>${brl(m.ticket)}</b><small>por venda concluída</small></div>
    <div class="kpi"><span>Produtos vendidos</span><b>${m.unitsSold}</b><small>unidades no período</small></div>
    <a class="kpi kpi--link" href="#gestao-pedidos"><span>Pedidos em aberto</span><b>${m.open.length}</b><small>${m.created.length} criados no período</small></a>
    <a class="kpi kpi--link" href="#gestao-assistencia"><span>Assistências em andamento</span><b>${m.svcOpen.length}</b><small>${m.svcNew.length} abertas no período</small></a>
    <a class="kpi kpi--link ${m.low ? 'kpi--warn' : ''}" href="#gestao-estoque" data-act="stk-preset" data-v="low"><span>Estoque baixo</span><b>${m.low}</b><small>${m.out} variações esgotadas</small></a>
  </div>
  <div class="dgrid">
    <section class="panel panel--wide"><div class="panel__h"><h2>Faturamento realizado por ${a.period === 'hoje' ? 'faixa de horário' : 'dia'}</h2><span class="muted small">pedidos concluídos · ${a.unit === 'all' ? 'todas as unidades' : esc(unitName(a.unit))}</span></div>${colChart(m.series)}</section>
    <section class="panel"><div class="panel__h"><h2>Vendas por unidade</h2><span class="muted small">faturamento realizado</span></div>
      <ul class="hbars">${m.byUnit.map(u => `<li class="${a.unit !== 'all' && a.unit !== u.id ? 'dim' : ''}"><span class="hbars__l">${u.name}</span><span class="hbars__t"><i style="width:${(u.v / maxU * 100).toFixed(1)}%"></i></span><span class="hbars__v"><b>${brlCompact(u.v)}</b><small>${plural(u.n, 'venda', 'vendas')}</small></span></li>`).join('')}</ul>
      <p class="fine">Distribuição considera todas as unidades para comparação.</p></section>
    <section class="panel"><div class="panel__h"><h2>Mais vendidos</h2><span class="muted small">unidades no período</span></div>
      ${m.top.length ? `<ol class="topl">${m.top.map((t, i) => `<li><span class="topl__n">${i + 1}</span>${thumb(t.pid)}<span class="topl__t"><b>${esc(t.name)}</b><span class="mbar"><i style="width:${(t.qty / maxT * 100).toFixed(0)}%"></i></span></span><span class="topl__v"><b>${t.qty} un.</b><small>${brl(t.v)}</small></span></li>`).join('')}</ol>` : '<p class="muted">Sem vendas concluídas no período.</p>'}</section>
    <section class="panel"><div class="panel__h"><h2>Alertas</h2></div>
      ${alerts.length ? `<ul class="alerts">${alerts.map(([tone, ic, t, to, preset]) => `<li><a class="al al--${tone}" href="#${to}" ${preset ? `data-act="adm-preset" data-v="${preset}"` : ''}>${icon(ic, 19)}<span>${t}</span>${icon('chevR', 16)}</a></li>`).join('')}</ul>` : '<p class="muted">Nada pendente agora.</p>'}</section>
    <section class="panel"><div class="panel__h"><h2>Atalhos</h2></div>
      <div class="shortcuts">${[['gestao-pedidos', 'receipt', 'Pedidos'], ['gestao-produtos', 'box', 'Produtos'], ['gestao-estoque', 'layers', 'Estoque'], ['gestao-assistencia', 'wrench', 'Assistência'], ['gestao-clientes', 'users', 'Clientes'], ['gestao-oportunidades', 'target', 'Oportunidades']].map(([h, ic, l]) => `<a href="#${h}">${icon(ic, 22)}<span>${l}</span></a>`).join('')}</div></section>
    <section class="panel panel--full"><div class="panel__h"><h2>Pedidos recentes</h2><a class="lnk" href="#gestao-pedidos">Ver todos ${icon('arrowR', 15)}</a></div>${ordersTable(recent)}</section>
  </div>
  <p class="rules">${icon('alert', 15)}<span><b>Regras desta demonstração:</b> faturamento, vendas e ticket médio consideram apenas pedidos <b>concluídos</b>. O estoque é baixado quando o pedido é <b>confirmado</b> e devolvido se ele for cancelado. Todos os números são simulados.</span></p>`;
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
    const c = custById(o.customerId); const n = o.items.reduce((s, l) => s + l.qty, 0);
    return `<tr data-act="adm-open" data-type="order" data-id="${o.id}" tabindex="0"><td data-l="Pedido"><b class="mono">${o.id}</b>${o.source === 'site' ? '<span class="srcb">site</span>' : ''}</td><td data-l="Cliente">${esc(c ? c.name : '—')}</td><td data-l="Data">${fmtDateTime(o.createdAt)}</td><td data-l="Itens"><span class="clip">${plural(n, 'item', 'itens')} · ${esc(o.items[0].name)}${o.items.length > 1 ? ` +${o.items.length - 1}` : ''}</span></td><td data-l="Total" class="r num">${brl(o.total)}</td><td data-l="Unidade">${esc(unitName(o.unitId))}</td><td data-l="Modalidade">${o.mode === 'retirada' ? 'Retirada' : 'Entrega'}</td><td data-l="Status">${pill(orderStatusLabel(o), orderTone(o.status))}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function admOrders() {
  const f = UI.adm.ord;
  let list = [...S.orders].sort((a, b) => b.createdAt - a.createdAt);
  if (f.unit !== 'all') list = list.filter(o => o.unitId === f.unit);
  if (f.status === 'open') list = list.filter(o => ORDER_OPEN.has(o.status));
  else if (f.status === 'wait') list = list.filter(o => o.status === 'recebido' || o.status === 'aguardando');
  else if (f.status !== 'all') list = list.filter(o => o.status === f.status);
  if (f.q) { const q = norm(f.q); list = list.filter(o => norm(o.id + ' ' + (custById(o.customerId) || {}).name + ' ' + (custById(o.customerId) || {}).phone).includes(q)); }
  const counts = s => S.orders.filter(o => (f.unit === 'all' || o.unitId === f.unit) && o.status === s).length;
  const doneSum = list.filter(o => o.status === 'concluido').reduce((s, o) => s + o.total, 0);
  const openSum = list.filter(o => ORDER_OPEN.has(o.status)).reduce((s, o) => s + o.total, 0);
  return `<div class="filters-row"><label class="search-s"><span>${icon('search', 18)}</span><input id="ord-q" data-in="adm-ord-q" value="${esc(f.q)}" placeholder="Buscar por pedido ou cliente"></label>${unitSelect('ord-unit', f.unit, 'adm-ord-unit')}</div>
   <div class="stchips">${[['all', 'Todos'], ['open', 'Em aberto'], ...ORDER_STATUS.map(s => [s.id, s.label])].map(([v, l]) => `<button class="stchip ${f.status === v ? 'on' : ''}" data-act="adm-ord-status" data-v="${v}">${l}${ORDER_STATUS.find(s => s.id === v) ? ` <em>${counts(v)}</em>` : ''}</button>`).join('')}</div>
   <div class="sumline"><span>${plural(list.length, 'pedido', 'pedidos')}</span><span>Concluídos: <b>${brl(doneSum)}</b></span><span>Em aberto: <b>${brl(openSum)}</b></span></div>
   ${ordersTable(list)}
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
  return `<div class="filters-row"><label class="search-s"><span>${icon('search', 18)}</span><input id="prod-q" data-in="adm-prod-q" value="${esc(f.q)}" placeholder="Buscar nome, marca ou código"></label>
    <label class="sel"><span class="sr">Categoria</span><select id="prod-sub" data-in="adm-prod-sub"><option value="all">Todas as categorias</option>${SUBS.map(s => `<option value="${s.id}" ${f.sub === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label>
    <label class="sel"><span class="sr">Marca</span><select id="prod-brand" data-in="adm-prod-brand"><option value="all">Todas as marcas</option>${brands.map(b => `<option ${f.brand === b ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></label>
    <button class="switch ${f.inactive ? 'on' : ''}" data-act="adm-prod-inactive" aria-pressed="${f.inactive}"><i></i>Mostrar inativos</button>
    <button class="btn btn--y btn--sm push" data-act="np-open">${icon('plus', 18)}Novo produto</button></div>
  <div class="sumline"><span>${plural(list.length, 'produto', 'produtos')}</span><span>${S.products.filter(p => !p.active).length} inativos</span></div>
  ${list.length ? `<div class="tblw"><table class="tbl tbl--prod"><thead><tr><th>Produto</th><th>Categoria</th><th>Marca</th><th class="r">Preço</th><th>Variações</th>${UNITS.map(u => `<th class="r">${u.short}</th>`).join('')}<th>Status</th></tr></thead><tbody>${list.map(p => {
    const [mn, mx] = priceRange(p);
    return `<tr data-act="adm-open" data-type="product" data-id="${p.id}" tabindex="0" class="${p.active ? '' : 'off'}"><td data-l="Produto" class="tdp">${thumb(p.id)}<span><b>${esc(p.name)}</b><small class="mono">${p.code}</small></span></td><td data-l="Categoria">${esc(subLabel(p.sub))}</td><td data-l="Marca">${esc(p.brand)}</td><td data-l="Preço" class="r num">${mn !== mx ? `${brl(mn)}<small> a ${brl(mx)}</small>` : brl(mn)}</td><td data-l="Variações">${variantsOf(p).length}</td>${UNITS.map(u => { const q = unitStock(p, u.id); return `<td data-l="${u.short}" class="r num"><span class="qn ${q === 0 ? 'out' : availState(p, u.id) === 'low' ? 'low' : ''}">${q}</span></td>`; }).join('')}<td data-l="Status">${p.active ? pill('Ativo', 'ok') : pill('Inativo', 'mute')}</td></tr>`;
  }).join('')}</tbody></table></div>` : '<div class="empty empty--sm"><p>Nenhum produto encontrado.</p></div>'}
  <p class="rules">${icon('alert', 15)}<span>Alterações ficam salvas apenas neste navegador, para fins de demonstração. Produtos novos ou editados aparecem imediatamente na loja.</span></p>`;
}

/* ---------- estoque ---------- */
function stockRows() {
  const f = UI.adm.stk;
  const rows = [];
  S.products.filter(p => p.active && (f.sub === 'all' || p.sub === f.sub) && (!f.q || matchQuery(haystack(p) + ' ' + norm(p.code), f.q))).forEach(p => {
    variantsOf(p).forEach(sel => {
      const vkey = vkeyOf(p, sel);
      const qs = Object.fromEntries(UNITS.map(u => [u.id, stockOf(p.id, vkey, u.id)]));
      const scope = f.unit === 'all' ? Object.values(qs) : [qs[f.unit]];
      const sitOf = q => q === 0 ? 'out' : q <= 3 ? 'low' : 'ok';
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
  const tag = q => q === 0 ? '<span class="st st--bad"><i></i>Esgotado</span>' : q <= 3 ? '<span class="st st--warn"><i></i>Baixo</span>' : '<span class="st st--ok"><i></i>Disponível</span>';
  return `<div class="filters-row">${seg('adm-stk-unit', f.unit, [['all', 'Todas'], ...UNITS.map(u => [u.id, u.short])])}
    <label class="search-s"><span>${icon('search', 18)}</span><input id="stk-q" data-in="adm-stk-q" value="${esc(f.q)}" placeholder="Buscar produto ou SKU"></label>
    <label class="sel"><span class="sr">Categoria</span><select id="stk-sub" data-in="adm-stk-sub"><option value="all">Todas as categorias</option>${SUBS.map(s => `<option value="${s.id}" ${f.sub === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></label>
    <label class="sel"><span class="sr">Situação</span><select id="stk-sit" data-in="adm-stk-sit"><option value="all" ${f.sit === 'all' ? 'selected' : ''}>Todas as situações</option><option value="ok" ${f.sit === 'ok' ? 'selected' : ''}>Disponível</option><option value="low" ${f.sit === 'low' ? 'selected' : ''}>Estoque baixo (1–3)</option><option value="out" ${f.sit === 'out' ? 'selected' : ''}>Esgotado</option></select></label></div>
  <div class="sumline"><span>${plural(rows.length, 'variação', 'variações')}</span><span>${f.unit === 'all' ? 'Escolha uma unidade para ajustar quantidades.' : 'Ajustes simulados em ' + esc(unitName(f.unit))}</span></div>
  ${rows.length ? `<div class="tblw"><table class="tbl tbl--stk"><thead><tr><th>Produto</th><th>Variação</th><th>SKU</th>${f.unit === 'all' ? UNITS.map(u => `<th class="r">${u.short}</th>`).join('') : '<th class="r">Quantidade</th><th>Situação</th>'}</tr></thead><tbody>${shown.map(r => `<tr><td data-l="Produto" class="tdp">${thumb(r.p.id, r.vkey)}<b>${esc(r.p.name)}</b></td><td data-l="Variação">${esc(r.label)}</td><td data-l="SKU"><span class="mono small">${r.sku}</span></td>${f.unit === 'all'
      ? UNITS.map(u => `<td data-l="${u.short}" class="r num"><span class="qn ${r.qs[u.id] === 0 ? 'out' : r.qs[u.id] <= 3 ? 'low' : ''}">${r.qs[u.id]}</span></td>`).join('')
      : `<td data-l="Quantidade" class="r"><div class="qty qty--sm"><button data-act="stk-adj" data-k="${r.p.id}|${esc(r.vkey)}|${f.unit}" data-d="-1" ${r.qs[f.unit] === 0 ? 'disabled' : ''} aria-label="Diminuir">${icon('minus', 16)}</button><output class="num">${r.qs[f.unit]}</output><button data-act="stk-adj" data-k="${r.p.id}|${esc(r.vkey)}|${f.unit}" data-d="1" aria-label="Aumentar">${icon('plus', 16)}</button></div></td><td data-l="Situação">${tag(r.qs[f.unit])}</td>`}</tr>`).join('')}</tbody></table></div>
  ${rows.length > f.limit ? `<div class="row row--c"><button class="btn btn--soft" data-act="stk-more">Mostrar mais ${Math.min(40, rows.length - f.limit)} de ${rows.length - f.limit}</button></div>` : ''}` : '<div class="empty empty--sm"><p>Nenhuma variação com esses filtros.</p></div>'}
  <p class="rules">${icon('alert', 15)}<span>Estoque fictício. Baixo = 1 a 3 unidades. A baixa automática acontece ao confirmar pedidos; cancelamentos devolvem os itens.</span></p>`;
}

/* ---------- clientes ---------- */
function custStats(c) {
  const orders = S.orders.filter(o => o.customerId === c.id).sort((a, b) => b.createdAt - a.createdAt);
  const svcs = S.services.filter(s => s.customerId === c.id).sort((a, b) => b.createdAt - a.createdAt);
  const spent = orders.filter(o => o.status === 'concluido').reduce((s, o) => s + o.total, 0);
  const uc = {}; [...orders, ...svcs].forEach(x => uc[x.unitId] = (uc[x.unitId] || 0) + 1);
  const fav = Object.entries(uc).sort((a, b) => b[1] - a[1])[0];
  const last = Math.max(0, ...orders.map(o => o.createdAt), ...svcs.map(s => s.createdAt));
  return { orders, svcs, spent, fav: fav ? fav[0] : null, last };
}
function admClients() {
  const f = UI.adm.cli;
  let list = S.customers.map(c => ({ c, s: custStats(c) })).sort((a, b) => b.s.last - a.s.last);
  if (f.q) { const q = norm(f.q), d = digits(f.q); list = list.filter(({ c }) => norm(c.name).includes(q) || (d && digits(c.phone).includes(d))); }
  return `<div class="filters-row"><label class="search-s"><span>${icon('search', 18)}</span><input id="cli-q" data-in="adm-cli-q" value="${esc(f.q)}" placeholder="Buscar por nome ou telefone"></label></div>
  <div class="sumline"><span>${plural(list.length, 'cliente', 'clientes')} fictícios</span></div>
  ${list.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Cliente</th><th>Telefone</th><th class="r">Pedidos</th><th class="r">Compras concluídas</th><th>Último registro</th><th class="r">Assistências</th><th>Unidade preferida</th></tr></thead><tbody>${list.map(({ c, s }) => `<tr data-act="adm-open" data-type="client" data-id="${c.id}" tabindex="0"><td data-l="Cliente"><b>${esc(c.name)}</b>${c.source === 'site' ? '<span class="srcb">site</span>' : ''}</td><td data-l="Telefone" class="num">${esc(c.phone)}</td><td data-l="Pedidos" class="r num">${s.orders.length}</td><td data-l="Compras" class="r num">${brl(s.spent)}</td><td data-l="Último">${s.last ? fmtDateTime(s.last) : '—'}</td><td data-l="Assistências" class="r num">${s.svcs.length}</td><td data-l="Unidade">${s.fav ? esc(unitName(s.fav)) : '—'}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty empty--sm"><p>Nenhum cliente encontrado.</p></div>'}
  <p class="rules">${icon('alert', 15)}<span>Clientes, nomes e telefones fictícios. Um cliente é identificado pelo telefone informado no pedido ou na assistência.</span></p>`;
}

/* ---------- assistência ---------- */
function admServices() {
  const f = UI.adm.svc;
  let list = [...S.services].sort((a, b) => b.createdAt - a.createdAt);
  if (f.unit !== 'all') list = list.filter(s => s.unitId === f.unit);
  const card = sv => { const c = custById(sv.customerId); return `<button class="kcard" data-act="adm-open" data-type="service" data-id="${sv.id}"><span class="kcard__h"><b class="mono">${sv.id}</b><small>${fmtDate(sv.createdAt)}</small></span><b>${esc(sv.brand)} ${esc(sv.model)}</b><span>${esc(sv.service)}</span><span class="kcard__f"><small>${esc(c ? c.name : '—')} · ${esc(UNITS.find(u => u.id === sv.unitId).short)}</small>${sv.quote ? `<em>${brl(sv.quote.value)}</em>` : ''}</span></button>`; };
  let body;
  if (f.view === 'board') {
    body = `<div class="board">${SVC_STATUS.map(st => { const items = list.filter(s => s.status === st.id); return `<section class="bcol bcol--${st.tone}"><h3><i></i>${st.label}<em>${items.length}</em></h3>${items.map(card).join('') || '<p class="bcol__empty">Vazio</p>'}</section>`; }).join('')}</div>`;
  } else {
    if (f.status === 'open') list = list.filter(s => SVC_OPEN.has(s.status)); else if (f.status !== 'all') list = list.filter(s => s.status === f.status);
    body = `<div class="stchips">${[['open', 'Em andamento'], ['all', 'Todas'], ...SVC_STATUS.map(s => [s.id, s.label])].map(([v, l]) => `<button class="stchip ${f.status === v ? 'on' : ''}" data-act="adm-svc-status" data-v="${v}">${l}</button>`).join('')}</div>` +
      (list.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Solicitação</th><th>Cliente</th><th>Aparelho</th><th>Serviço</th><th>Unidade</th><th>Data</th><th>Status</th><th class="r">Orçamento</th></tr></thead><tbody>${list.map(sv => { const c = custById(sv.customerId); return `<tr data-act="adm-open" data-type="service" data-id="${sv.id}" tabindex="0"><td data-l="OS"><b class="mono">${sv.id}</b>${sv.source === 'site' ? '<span class="srcb">site</span>' : ''}</td><td data-l="Cliente">${esc(c ? c.name : '—')}</td><td data-l="Aparelho">${esc(sv.brand)} ${esc(sv.model)}</td><td data-l="Serviço">${esc(sv.service)}</td><td data-l="Unidade">${esc(unitName(sv.unitId))}</td><td data-l="Data">${fmtDateTime(sv.createdAt)}</td><td data-l="Status">${pill(svcLabel(sv.status), svcTone(sv.status))}</td><td data-l="Orçamento" class="r num">${sv.quote ? brl(sv.quote.value) : '—'}</td></tr>`; }).join('')}</tbody></table></div>` : '<div class="empty empty--sm"><p>Nenhuma solicitação com esses filtros.</p></div>');
  }
  return `<div class="filters-row">${seg('adm-svc-view', f.view, [['board', 'Quadro'], ['list', 'Lista']])}${unitSelect('svc-unit', f.unit, 'adm-svc-unit')}</div>${body}
  <p class="rules">${icon('alert', 15)}<span>Status e orçamentos são demonstrativos. Sem assinatura digital, aceite contratual, emissão fiscal ou integração externa.</span></p>`;
}

/* ---------- unidades ---------- */
function admUnits() {
  return `<div class="ugrid">${UNITS.map(u => {
    const m = metrics('30', u.id);
    const lows = [];
    activeProducts().forEach(p => variantsOf(p).forEach(sel => { const q = stockOf(p.id, vkeyOf(p, sel), u.id); if (q <= 3) lows.push({ p, sel, q }); }));
    lows.sort((a, b) => a.q - b.q);
    const skus = activeProducts().filter(p => unitStock(p, u.id) > 0).length;
    return `<section class="panel ucard2"><div class="ucard2__h">${icon('pin', 22)}<h2>${u.name}</h2></div>
      <dl class="umet"><div><dt>Faturamento realizado (30 dias)</dt><dd>${brl(m.revenue)}</dd></div><div><dt>Vendas concluídas</dt><dd>${m.done.length}</dd></div><div><dt>Pedidos em aberto</dt><dd>${m.open.length}</dd></div><div><dt>Assistências em andamento</dt><dd>${m.svcOpen.length}</dd></div><div><dt>Produtos com estoque</dt><dd>${skus} de ${activeProducts().length}</dd></div><div><dt>Variações baixas ou esgotadas</dt><dd>${lows.length}</dd></div></dl>
      <h3>Repor primeiro</h3><ul class="lowl">${lows.slice(0, 4).map(l => `<li>${thumb(l.p.id, vkeyOf(l.p, l.sel))}<span><b>${esc(l.p.name)}</b><small>${esc(variantLabel(l.p, l.sel) || 'Única')}</small></span><span class="qn ${l.q ? 'low' : 'out'}">${l.q}</span></li>`).join('') || '<li class="muted">Nada crítico.</li>'}</ul>
      <p class="fine">Endereço, horário e contato: a configurar.</p>
      <div class="row"><a class="btn btn--soft btn--sm" href="#gestao-estoque" data-act="adm-preset" data-v="stk-unit-${u.id}">Ver estoque</a><a class="btn btn--soft btn--sm" href="#gestao-pedidos" data-act="adm-preset" data-v="ord-unit-${u.id}">Ver pedidos</a></div></section>`;
  }).join('')}</div>`;
}

/* ---------- oportunidades ---------- */
function opportunities() {
  const valid = S.orders.filter(o => o.status !== 'cancelado');
  const phoneBuys = [];
  S.customers.forEach(c => {
    const mine = valid.filter(o => o.customerId === c.id);
    const phones = mine.flatMap(o => o.items.filter(l => { const p = P(l.pid); return p && p.group === 'celulares'; }).map(l => ({ o, l, p: P(l.pid) })));
    if (!phones.length) return;
    const last = phones.sort((a, b) => b.o.createdAt - a.o.createdAt)[0];
    const model = last.p.model;
    const has = sub => mine.some(o => o.items.some(l => { const p = P(l.pid); return p && p.sub === sub && l.vkey.split('|').includes(model); }));
    const missing = ['capinhas', 'peliculas'].filter(s => !has(s));
    if (!missing.length) return;
    const sugg = activeProducts().filter(p => missing.includes(p.sub) && (p.options || []).some(o => o.name === COMPAT && o.values.some(v => v.v === model))).slice(0, 3);
    phoneBuys.push({ c, o: last.o, model, missing, sugg });
  });
  const svcOpps = S.services.filter(s => ['reparo', 'retirada', 'concluido'].includes(s.status) && Date.now() - s.createdAt < 20 * 864e5).map(sv => {
    const model = ALL_MODELS.find(m => norm(sv.model) === norm(m));
    const sugg = model ? activeProducts().filter(p => ['capinhas', 'peliculas'].includes(p.sub) && (p.options || []).some(o => o.name === COMPAT && o.values.some(v => v.v === model))).slice(0, 2) : activeProducts().filter(p => ['a05', 'a08'].includes(p.id));
    return { sv, c: custById(sv.customerId), model, sugg };
  });
  const pairs = {};
  valid.forEach(o => { const ids = [...new Set(o.items.map(l => l.pid))].sort(); for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) { const k = ids[i] + '+' + ids[j]; pairs[k] = (pairs[k] || 0) + 1; } });
  const pairList = Object.entries(pairs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => ({ a: P(k.split('+')[0]), b: P(k.split('+')[1]), n })).filter(x => x.a && x.b);
  const from = Date.now() - 30 * 864e5, cats = {};
  valid.filter(o => o.createdAt >= from).forEach(o => o.items.forEach(l => { const p = P(l.pid); if (p) cats[p.sub] = (cats[p.sub] || 0) + l.qty; }));
  const catList = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const sold = {}; valid.filter(o => o.createdAt >= from).forEach(o => o.items.forEach(l => sold[l.pid] = (sold[l.pid] || 0) + l.qty));
  const lows = [];
  activeProducts().forEach(p => variantsOf(p).forEach(sel => UNITS.forEach(u => { const q = stockOf(p.id, vkeyOf(p, sel), u.id); if (q <= 3 && sold[p.id]) lows.push({ p, sel, u, q, sold: sold[p.id] }); })));
  lows.sort((a, b) => b.sold - a.sold || a.q - b.q);
  return { phoneBuys, svcOpps, pairList, catList, lows: lows.slice(0, 6) };
}
function oppMsg(name, unit, model) { return `Olá, ${name.split(' ')[0]}! Aqui é da Doutor do Celular, unidade ${unitName(unit)}. Temos capa e película compatíveis com o seu ${model}. Quer que a gente separe para você?`; }
function admOpps() {
  const o = opportunities();
  const maxCat = Math.max(1, ...o.catList.map(c => c[1]));
  return `<div class="opps">
    <section class="panel opp"><div class="panel__h"><h2>Acessórios para quem comprou celular</h2><span class="cnt">${o.phoneBuys.length}</span></div>
      <p class="rule">Regra: cliente comprou um smartphone e ainda não levou capa ou película compatível com o modelo.</p>
      ${o.phoneBuys.length ? `<ul class="oppl">${o.phoneBuys.map((x, i) => `<li><div class="oppl__t"><button class="lnk" data-act="adm-open" data-type="client" data-id="${x.c.id}"><b>${esc(x.c.name)}</b></button><small>${esc(x.model)} · <button class="lnk" data-act="adm-open" data-type="order" data-id="${x.o.id}">${x.o.id}</button> · ${fmtDate(x.o.createdAt)} · falta ${x.missing.map(subLabel).join(' e ').toLowerCase()}</small></div>
        <div class="oppl__s">${x.sugg.map(p => `<span class="sg">${thumb(p.id)}${esc(p.name)}</span>`).join('')}</div>
        <textarea class="sr" id="opp-msg-${i}" readonly>${esc(oppMsg(x.c.name, x.o.unitId, x.model))}</textarea><button class="btn btn--soft btn--sm" data-act="copy" data-src="opp-msg-${i}">${icon('copy', 16)}Copiar mensagem sugerida</button></li>`).join('')}</ul>` : '<p class="muted">Nenhuma oportunidade agora.</p>'}</section>
    <section class="panel opp"><div class="panel__h"><h2>Clientes da assistência</h2><span class="cnt">${o.svcOpps.length}</span></div>
      <p class="rule">Regra: aparelho em reparo, aguardando retirada ou concluído nos últimos 20 dias. Ofereça proteção na retirada.</p>
      ${o.svcOpps.length ? `<ul class="oppl">${o.svcOpps.map(x => `<li><div class="oppl__t"><button class="lnk" data-act="adm-open" data-type="service" data-id="${x.sv.id}"><b>${esc(x.c ? x.c.name : '—')}</b></button><small>${x.sv.id} · ${esc(x.sv.brand)} ${esc(x.sv.model)} · ${esc(svcLabel(x.sv.status))}${x.model ? '' : ' · modelo fora do catálogo, sugestão genérica'}</small></div><div class="oppl__s">${x.sugg.map(p => `<span class="sg">${thumb(p.id)}${esc(p.name)}</span>`).join('')}</div></li>`).join('')}</ul>` : '<p class="muted">Nenhuma oportunidade agora.</p>'}</section>
    <section class="panel opp"><div class="panel__h"><h2>Comprados juntos</h2></div><p class="rule">Regra: pares de produtos que aparecem no mesmo pedido (exceto cancelados).</p>
      <ul class="pairs">${o.pairList.map(x => `<li><span class="pairs__th">${thumb(x.a.id)}${thumb(x.b.id)}</span><span class="pairs__t"><b>${esc(x.a.name)}</b><small>+ ${esc(x.b.name)}</small></span><em>${plural(x.n, 'pedido', 'pedidos')}</em></li>`).join('')}</ul><p class="fine">Sugestão: montar combos ou exibir “combina com” na página do produto.</p></section>
    <section class="panel opp"><div class="panel__h"><h2>Categorias em movimento</h2></div><p class="rule">Regra: unidades em pedidos dos últimos 30 dias, exceto cancelados.</p>
      <ul class="hbars">${o.catList.map(([s, n]) => `<li><span class="hbars__l">${esc(subLabel(s))}</span><span class="hbars__t"><i style="width:${(n / maxCat * 100).toFixed(0)}%"></i></span><span class="hbars__v"><b>${n}</b><small>un.</small></span></li>`).join('')}</ul></section>
    <section class="panel opp opp--wide"><div class="panel__h"><h2>Reposição sugerida</h2></div><p class="rule">Regra: variação com 3 unidades ou menos em uma unidade e com vendas nos últimos 30 dias.</p>
      <div class="tblw"><table class="tbl"><thead><tr><th>Produto</th><th>Variação</th><th>Unidade</th><th class="r">Estoque</th><th class="r">Vendido (30 dias)</th></tr></thead><tbody>${o.lows.map(l => `<tr><td data-l="Produto" class="tdp">${thumb(l.p.id, vkeyOf(l.p, l.sel))}<b>${esc(l.p.name)}</b></td><td data-l="Variação">${esc(variantLabel(l.p, l.sel) || 'Única')}</td><td data-l="Unidade">${esc(l.u.name)}</td><td data-l="Estoque" class="r num"><span class="qn ${l.q ? 'low' : 'out'}">${l.q}</span></td><td data-l="Vendido" class="r num">${l.sold}</td></tr>`).join('')}</tbody></table></div></section>
  </div>
  <p class="rules">${icon('alert', 15)}<span>Sugestões baseadas em regras simples e transparentes, não em previsões. Nenhuma campanha ou mensagem é disparada automaticamente.</span></p>`;
}

/* ---------- gaveta de detalhes ---------- */
function admDrawer() {
  const d = UI.adm.drawer; if (!d) return '';
  let inner = '';
  if (d.type === 'order') inner = drawerOrder(S.orders.find(o => o.id === d.id));
  else if (d.type === 'service') inner = drawerService(S.services.find(s => s.id === d.id));
  else if (d.type === 'client') inner = drawerClient(custById(d.id));
  else if (d.type === 'product') inner = drawerProduct(P(d.id));
  return `<div class="scrim scrim--drawer" data-act="adm-close"></div><aside class="drawer" role="dialog" aria-modal="true"><button class="modal__x" data-act="adm-close" aria-label="Fechar">${icon('x', 22)}</button>${inner}</aside>`;
}
function histList(h, labelFn) { return `<ol class="hist">${[...h].reverse().map(x => `<li><b>${esc(labelFn(x.s))}</b><small>${fmtDateTime(x.at)}</small></li>`).join('')}</ol>`; }
function drawerOrder(o) {
  if (!o) return '<p>Pedido não encontrado.</p>';
  const c = custById(o.customerId);
  return `<div class="dw"><span class="muted small">Pedido · ${o.source === 'site' ? 'criado pelo site (demo)' : 'base inicial'}</span><h2 class="mono">${o.id}</h2>
    <div class="dw__st">${pill(orderStatusLabel(o), orderTone(o.status))}<small>Criado em ${fmtDateTime(o.createdAt)}</small></div>
    <h3>Alterar status</h3><div class="stset">${ORDER_STATUS.map(s => `<button class="stset__b st--${s.tone} ${o.status === s.id ? 'on' : ''}" data-act="ord-set" data-id="${o.id}" data-v="${s.id}" aria-pressed="${o.status === s.id}"><i></i>${orderStatusLabel(o, s.id)}</button>`).join('')}</div>
    <p class="stockinfo ${o.stockApplied ? 'yes' : ''}">${icon(o.stockApplied ? 'check' : 'clock', 16)}${o.stockApplied ? `Estoque baixado em ${esc(unitName(o.unitId))}. Cancelar devolve os itens.` : `Estoque ainda não baixado. A baixa ocorre ao confirmar.`}</p>
    <h3>Cliente</h3><button class="dwlink" data-act="adm-open" data-type="client" data-id="${c ? c.id : ''}"><b>${esc(c ? c.name : '—')}</b><small>${esc(c ? c.phone : '')}</small>${icon('chevR', 16)}</button>
    <h3>Itens</h3><ul class="mini">${o.items.map(l => `<li>${thumb(l.pid, l.vkey)}<span class="mini__t"><b>${esc(l.name)}</b><small>${esc(l.variant)} · <span class="mono">${l.sku}</span> · ${l.qty} × ${brl(l.price)}</small></span><b>${brl(l.qty * l.price)}</b></li>`).join('')}</ul>
    <div class="summary__tot"><span>Total</span><b>${brl(o.total)}</b></div>
    <dl class="dwdl"><div><dt>Unidade</dt><dd>${esc(unitName(o.unitId))}</dd></div><div><dt>Modalidade</dt><dd>${o.mode === 'retirada' ? 'Retirada' : 'Entrega · ' + esc(o.address)}</dd></div><div><dt>Pagamento</dt><dd>${esc(PAY[o.pay] || o.pay)} (ilustrativo)</dd></div><div><dt>Conta como venda</dt><dd>${o.status === 'concluido' ? 'Sim, concluído em ' + fmtDateTime(o.completedAt) : 'Não, ainda não concluído'}</dd></div></dl>
    <h3>Histórico</h3>${histList(o.history, s => orderStatusLabel(o, s))}
    <a class="lnk" href="#pedido-${o.num}">${icon('eye', 16)}Ver como o cliente vê</a></div>`;
}
function drawerService(sv) {
  if (!sv) return '<p>Solicitação não encontrada.</p>';
  const c = custById(sv.customerId); const qf = UI.adm.quote[sv.id] || { value: sv.quote ? String(sv.quote.value).replace('.', ',') : '', note: sv.quote ? sv.quote.note : '' };
  UI.adm.quote[sv.id] = qf;
  return `<div class="dw"><span class="muted small">Assistência técnica · ${sv.source === 'site' ? 'criada pelo site (demo)' : 'base inicial'}</span><h2 class="mono">${sv.id}</h2>
    <div class="dw__st">${pill(svcLabel(sv.status), svcTone(sv.status))}<small>Aberta em ${fmtDateTime(sv.createdAt)} · ${esc(unitName(sv.unitId))}</small></div>
    <dl class="dwdl"><div><dt>Aparelho</dt><dd>${esc(sv.brand)} ${esc(sv.model)}</dd></div><div><dt>Serviço</dt><dd>${esc(sv.service)}</dd></div><div class="full"><dt>Problema relatado</dt><dd>${esc(sv.desc)}</dd></div></dl>
    <h3>Cliente</h3><button class="dwlink" data-act="adm-open" data-type="client" data-id="${c ? c.id : ''}"><b>${esc(c ? c.name : '—')}</b><small>${esc(c ? c.phone : '')}</small>${icon('chevR', 16)}</button>
    <h3>Alterar status</h3><div class="stset">${SVC_STATUS.map(s => `<button class="stset__b st--${s.tone} ${sv.status === s.id ? 'on' : ''}" data-act="svc-set" data-id="${sv.id}" data-v="${s.id}" aria-pressed="${sv.status === s.id}"><i></i>${s.label}</button>`).join('')}</div>
    <h3>Orçamento demonstrativo</h3>
    <form class="quotef" data-form="quote" data-id="${sv.id}" novalidate><div class="field"><label for="qv-${sv.num}">Valor (R$)</label><input id="qv-${sv.num}" inputmode="decimal" data-in="quote.value" data-id="${sv.id}" value="${esc(qf.value)}" placeholder="0,00"></div><div class="field"><label for="qn-${sv.num}">Observação</label><input id="qn-${sv.num}" data-in="quote.note" data-id="${sv.id}" value="${esc(qf.note)}" placeholder="Ex.: peça sob consulta"></div><button class="btn btn--dark btn--sm" type="submit">${sv.quote ? 'Atualizar orçamento' : 'Registrar orçamento'}</button></form>
    <p class="fine">O valor é ilustrativo e aparece no acompanhamento do cliente. Registrar move a solicitação para “Aguardando aprovação do orçamento” quando ela estiver em etapa anterior.</p>
    <h3>Histórico</h3>${histList(sv.history, svcLabel)}
    <a class="lnk" href="#os-${sv.num}">${icon('eye', 16)}Ver acompanhamento do cliente</a></div>`;
}
function drawerClient(c) {
  if (!c) return '<p>Cliente não encontrado.</p>';
  const s = custStats(c);
  return `<div class="dw"><span class="muted small">Cliente fictício</span><h2>${esc(c.name)}</h2><p class="muted">${esc(c.phone)}${c.email ? ' · ' + esc(c.email) : ''}</p>
    <div class="kpis3"><div><span>Pedidos</span><b>${s.orders.length}</b></div><div><span>Compras concluídas</span><b>${brl(s.spent)}</b></div><div><span>Assistências</span><b>${s.svcs.length}</b></div></div>
    <dl class="dwdl"><div><dt>Unidade preferida</dt><dd>${s.fav ? esc(unitName(s.fav)) : '—'}</dd></div><div><dt>Último pedido</dt><dd>${s.orders[0] ? s.orders[0].id + ' · ' + fmtDateTime(s.orders[0].createdAt) : '—'}</dd></div></dl>
    <h3>Pedidos</h3>${s.orders.length ? `<ul class="recs recs--dw">${s.orders.map(o => `<li><button data-act="adm-open" data-type="order" data-id="${o.id}"><span class="recs__t"><b class="mono">${o.id}</b><small>${fmtDateTime(o.createdAt)} · ${brl(o.total)} · ${esc(o.items.map(l => l.name).join(', '))}</small></span>${pill(orderStatusLabel(o), orderTone(o.status))}</button></li>`).join('')}</ul>` : '<p class="muted">Sem pedidos.</p>'}
    <h3>Assistências</h3>${s.svcs.length ? `<ul class="recs recs--dw">${s.svcs.map(sv => `<li><button data-act="adm-open" data-type="service" data-id="${sv.id}"><span class="recs__t"><b class="mono">${sv.id}</b><small>${esc(sv.brand)} ${esc(sv.model)} · ${esc(sv.service)}</small></span>${pill(svcLabel(sv.status), svcTone(sv.status))}</button></li>`).join('')}</ul>` : '<p class="muted">Sem assistências.</p>'}</div>`;
}
function drawerProduct(p) {
  if (!p) return '<p>Produto não encontrado.</p>';
  const e = UI.adm.edit && UI.adm.edit.id === p.id ? UI.adm.edit : (UI.adm.edit = { id: p.id, name: p.name, price: String(p.price).replace('.', ','), desc: p.desc });
  const vs = variantsOf(p);
  return `<div class="dw"><span class="muted small mono">${p.code}</span><h2>${esc(p.name)}</h2>
    <div class="dw__st">${p.active ? pill('Ativo na loja', 'ok') : pill('Inativo', 'mute')}<small>${esc(subLabel(p.sub))} · ${esc(p.brand)}</small></div>
    <div class="dw__img">${productArt(p)}</div>
    <form data-form="prod-edit" data-id="${p.id}" class="form" novalidate>
      <div class="field"><label for="pe-name">Nome</label><input id="pe-name" data-in="edit.name" value="${esc(e.name)}"></div>
      <div class="field"><label for="pe-price">Preço base (R$)</label><input id="pe-price" inputmode="decimal" data-in="edit.price" value="${esc(e.price)}"></div>
      <div class="field"><label for="pe-desc">Descrição</label><textarea id="pe-desc" rows="3" data-in="edit.desc">${esc(e.desc)}</textarea></div>
      <div class="row"><button class="btn btn--dark btn--sm" type="submit">Salvar alterações (demo)</button><button type="button" class="btn btn--soft btn--sm" data-act="prod-toggle" data-id="${p.id}">${icon('power', 16)}${p.active ? 'Desativar' : 'Reativar'}</button>${p.active ? `<a class="lnk" href="#produto-${p.id}">${icon('eye', 16)}Ver na loja</a>` : ''}</div>
    </form>
    <h3>Variações e estoque por unidade</h3>
    <div class="tblw"><table class="tbl tbl--mini"><thead><tr><th>Variação</th><th class="r">Preço</th>${UNITS.map(u => `<th class="r">${u.short}</th>`).join('')}</tr></thead><tbody>${vs.map(sel => { const k = vkeyOf(p, sel); return `<tr><td data-l="Variação">${esc(variantLabel(p, sel) || 'Única')}<small class="mono"> ${skuOf(p, sel)}</small></td><td data-l="Preço" class="r num">${brl(variantPrice(p, sel))}</td>${UNITS.map(u => { const q = stockOf(p.id, k, u.id); return `<td data-l="${u.short}" class="r num"><span class="qn ${q === 0 ? 'out' : q <= 3 ? 'low' : ''}">${q}</span></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>
    <a class="lnk" href="#gestao-estoque" data-act="adm-preset" data-v="stk-q-${p.code}">${icon('layers', 16)}Ajustar no estoque</a></div>`;
}
function admModal(m) {
  if (m.sub === 'np') {
    const np = UI.adm.np;
    const colors = ['Preto', 'Branco', 'Cinza', 'Prata', 'Azul', 'Azul-marinho', 'Verde-menta', 'Lilás', 'Rosa', 'Amarelo', 'Vermelho', 'Laranja'];
    const fe = k => np.err && np.err[k] ? `<p class="ferr">${np.err[k]}</p>` : '';
    return `<div class="scrim scrim--modal" data-act="modal-close"></div><div class="modal modal--wide" role="dialog" aria-modal="true"><button class="modal__x" data-act="modal-close" aria-label="Fechar">${icon('x', 22)}</button>
      <h2>Novo produto (demo)</h2><p class="muted">O produto aparece na loja assim que for cadastrado, com estoque inicial em cada unidade.</p>
      <form data-form="np" novalidate><div class="np">
        <div class="np__prev">${productArt({ id: 'np', art: AUTO_ART[np.sub] || {}, options: [opt('Cor', np.colors.length ? np.colors : ['Preto'])] }, { 'Cor': np.colors[0] || 'Preto' })}<small>Ilustração gerada pela categoria</small></div>
        <div class="form">
          <div class="field ${np.err && np.err.name ? 'bad' : ''}"><label for="np-name">Nome *</label><input id="np-name" data-in="np.name" value="${esc(np.name)}" placeholder="Ex.: Capa de couro">${fe('name')}</div>
          <div class="form form--2"><div class="field"><label for="np-sub">Categoria</label><select id="np-sub" data-in="np.sub">${SUBS.map(s => `<option value="${s.id}" ${np.sub === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}</select></div>
          <div class="field"><label for="np-brand">Marca</label><input id="np-brand" data-in="np.brand" value="${esc(np.brand)}"></div>
          <div class="field ${np.err && np.err.price ? 'bad' : ''}"><label for="np-price">Preço (R$) *</label><input id="np-price" inputmode="decimal" data-in="np.price" value="${esc(np.price)}" placeholder="0,00">${fe('price')}</div>
          <div class="field"><label for="np-stock">Estoque inicial por unidade</label><input id="np-stock" type="number" min="0" max="99" data-in="np.stock" value="${esc(np.stock)}"></div></div>
          <div class="field"><span class="lbl">Cores</span><div class="opt__vals opt__vals--sw">${colors.map(c => `<button type="button" class="sw ${np.colors.includes(c) ? 'on' : ''}" data-act="np-color" data-v="${c}" aria-pressed="${np.colors.includes(c)}"><i style="background:${COLOR_HEX[c]}"></i><span>${c}</span></button>`).join('')}</div></div>
          <div class="field"><label for="np-desc">Descrição</label><textarea id="np-desc" rows="2" data-in="np.desc">${esc(np.desc)}</textarea></div>
        </div></div>
        <div class="row"><button type="button" class="btn btn--soft grow" data-act="modal-close">Cancelar</button><button class="btn btn--y grow" type="submit">${icon('plus', 18)}Cadastrar produto</button></div>
      </form></div>`;
  }
  return '';
}
