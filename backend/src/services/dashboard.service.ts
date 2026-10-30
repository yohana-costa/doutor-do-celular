import { prisma } from '../lib/prisma';
import { DIA_MS, inicioDoDia, rotuloDia } from '../lib/datas';
import { incluirPedido, num, pedidoFront, opcoesDe } from '../lib/serializar';
import { COMPAT } from '../lib/variacoes';
import { ORDER_OPEN } from './pedidos.service';
import { SVC_OPEN } from './os.service';
import { limiteEstoqueBaixo } from './config.service';

// Indicadores com as mesmas definicoes do prototipo:
// faturamento = soma dos pedidos CONCLUIDOS (pela data de conclusao); pedido criado ou confirmado nao e venda.
// estoque baixo = variacao ativa com 1 ate o limite configurado (padrao 3) numa unidade; esgotado = 0.

type Periodo = 'hoje' | '7' | '30' | 'tudo';
const PERIODOS: Periodo[] = ['hoje', '7', '30', 'tudo'];
const r2 = (v: number) => Math.round(v * 100) / 100;
const pad2 = (n: number) => String(n).padStart(2, '0');

async function inicioPeriodo(per: Periodo): Promise<Date> {
  const agora = Date.now();
  if (per === 'hoje') return inicioDoDia(agora);
  if (per === '7') return inicioDoDia(agora - 6 * DIA_MS);
  if (per === '30') return inicioDoDia(agora - 29 * DIA_MS);
  const primeiro = await prisma.pedido.findFirst({ orderBy: { criadoEm: 'asc' }, select: { criadoEm: true } });
  return inicioDoDia(Math.min(primeiro ? primeiro.criadoEm.getTime() : agora, agora));
}

// Saldo de cada variacao ativa (de produto ativo) em cada unidade ativa; sem linha = 0.
async function saldosAtivos(unidade?: string) {
  const [variacoes, unidades, estoques] = await Promise.all([
    prisma.produtoVariacao.findMany({ where: { ativo: true, produto: { ativo: true } }, select: { id: true, chave: true, produtoId: true } }),
    prisma.unidade.findMany({ where: { ativo: true, id: unidade && unidade !== 'all' ? unidade : undefined }, orderBy: { ordem: 'asc' } }),
    prisma.estoque.findMany({ select: { variacaoId: true, unidadeId: true, quantidade: true } }),
  ]);
  const mapa = new Map(estoques.map((e) => [`${e.variacaoId}|${e.unidadeId}`, e.quantidade]));
  const linhas: { variacaoId: string; produtoId: string; chave: string; unidadeId: string; q: number }[] = [];
  for (const v of variacoes) for (const u of unidades) linhas.push({ variacaoId: v.id, produtoId: v.produtoId, chave: v.chave, unidadeId: u.id, q: mapa.get(`${v.id}|${u.id}`) || 0 });
  return { linhas, unidades };
}

export async function metricas(perIn: string, unidadeIn: string) {
  const per: Periodo = (PERIODOS as string[]).includes(perIn) ? (perIn as Periodo) : '30';
  const unidade = unidadeIn && unidadeIn !== 'all' ? unidadeIn : undefined;
  const de = await inicioPeriodo(per);
  const agora = Date.now();
  const hoje = inicioDoDia(agora);
  const limite = await limiteEstoqueBaixo();

  const [concluidos, criados, abertos, svcAbertas, svcNovas, recentes, unidades] = await Promise.all([
    prisma.pedido.findMany({ where: { status: 'concluido', concluidoEm: { gte: de } }, include: { itens: true } }),
    prisma.pedido.count({ where: { unidadeId: unidade, criadoEm: { gte: de } } }),
    prisma.pedido.groupBy({ by: ['status'], where: { unidadeId: unidade, status: { in: [...ORDER_OPEN] } }, _count: true }),
    prisma.ordemServico.groupBy({ by: ['status'], where: { unidadeId: unidade, status: { in: [...SVC_OPEN] } }, _count: true }),
    prisma.ordemServico.count({ where: { unidadeId: unidade, criadoEm: { gte: de } } }),
    prisma.pedido.findMany({ where: { unidadeId: unidade }, include: incluirPedido, orderBy: { criadoEm: 'desc' }, take: 6 }),
    prisma.unidade.findMany({ where: { ativo: true }, orderBy: { ordem: 'asc' } }),
  ]);

  const done = concluidos.filter((o) => !unidade || o.unidadeId === unidade);
  const receita = done.reduce((s, o) => s + num(o.total), 0);
  const hojeDone = done.filter((o) => o.concluidoEm && o.concluidoEm >= hoje);
  const quando = (o: { concluidoEm: Date | null }) => (o.concluidoEm ? o.concluidoEm.getTime() : 0);

  const series: { label: string; full: string; v: number; today?: boolean }[] = [];
  if (per === 'hoje') {
    for (let h = 8; h < 22; h += 2) {
      const a = de.getTime() + h * 36e5;
      const b = a + 2 * 36e5;
      series.push({ label: `${pad2(h)}h`, full: `${pad2(h)}h às ${pad2(h + 2)}h`, v: r2(done.filter((o) => quando(o) >= a && quando(o) < b).reduce((s, o) => s + num(o.total), 0)) });
    }
  } else {
    for (let t = de.getTime(); t <= agora; t += DIA_MS) {
      const a = inicioDoDia(t).getTime();
      const b = a + DIA_MS;
      series.push({ label: rotuloDia(new Date(a)), full: rotuloDia(new Date(a)), v: r2(done.filter((o) => quando(o) >= a && quando(o) < b).reduce((s, o) => s + num(o.total), 0)), today: a === hoje.getTime() });
    }
  }

  const porUnidade = unidades.map((u) => {
    const os = concluidos.filter((o) => o.unidadeId === u.id);
    return { id: u.id, name: u.nome, v: r2(os.reduce((s, o) => s + num(o.total), 0)), n: os.length };
  });

  const prod: Record<string, { pid: string; name: string; qty: number; v: number }> = {};
  for (const o of done)
    for (const l of o.itens) {
      const p = (prod[l.produtoId] = prod[l.produtoId] || { pid: l.produtoId, name: l.nome, qty: 0, v: 0 });
      p.qty += l.quantidade;
      p.v = r2(p.v + l.quantidade * num(l.preco));
    }
  const top = Object.values(prod)
    .sort((a, b) => b.qty - a.qty || b.v - a.v)
    .slice(0, 5);

  const { linhas } = await saldosAtivos(unidade);
  const low = linhas.filter((l) => l.q > 0 && l.q <= limite).length;
  const out = linhas.filter((l) => l.q === 0).length;
  const cont = (g: { status: string; _count: number }[], ...st: string[]) => g.filter((x) => st.includes(x.status)).reduce((s, x) => s + x._count, 0);

  return {
    period: per,
    unit: unidade || 'all',
    from: de.getTime(),
    lowLimit: limite,
    revenue: r2(receita),
    doneCount: done.length,
    unitsSold: done.reduce((s, o) => s + o.itens.reduce((a, l) => a + l.quantidade, 0), 0),
    ticket: done.length ? r2(receita / done.length) : 0,
    createdCount: criados,
    openCount: abertos.reduce((s, x) => s + x._count, 0),
    todayRevenue: r2(hojeDone.reduce((s, o) => s + num(o.total), 0)),
    todayCount: hojeDone.length,
    svcOpenCount: svcAbertas.reduce((s, x) => s + x._count, 0),
    svcNewCount: svcNovas,
    low,
    out,
    waiting: cont(abertos, 'recebido', 'aguardando'),
    ready: cont(abertos, 'pronto'),
    quotes: cont(svcAbertas, 'orcamento'),
    evals: cont(svcAbertas, 'recebida', 'avaliacao'),
    series,
    byUnit: porUnidade,
    top,
    recent: recentes.map(pedidoFront),
  };
}

// Numeros dos selos do menu lateral da gestao.
export async function contadores() {
  const limite = await limiteEstoqueBaixo();
  const [aguardando, svc, { linhas }] = await Promise.all([
    prisma.pedido.count({ where: { status: { in: ['recebido', 'aguardando'] } } }),
    prisma.ordemServico.count({ where: { status: { in: [...SVC_OPEN] } } }),
    saldosAtivos(),
  ]);
  return { pedidos: aguardando, assistencia: svc, estoque: linhas.filter((l) => l.q > 0 && l.q <= limite).length };
}

export async function resumoUnidades() {
  const limite = await limiteEstoqueBaixo();
  const unidades = await prisma.unidade.findMany({ orderBy: { ordem: 'asc' } });
  const { linhas } = await saldosAtivos();
  const totalAtivos = await prisma.produto.count({ where: { ativo: true } });
  const out = [];
  for (const u of unidades) {
    const m = await metricas('30', u.id);
    const daUnidade = linhas.filter((l) => l.unidadeId === u.id);
    const comEstoque = new Set(daUnidade.filter((l) => l.q > 0).map((l) => l.produtoId)).size;
    const baixas = daUnidade
      .filter((l) => l.q <= limite)
      .sort((a, b) => a.q - b.q)
      .map((l) => ({ pid: l.produtoId, vkey: l.chave, q: l.q }));
    out.push({
      id: u.id,
      revenue: m.revenue,
      doneCount: m.doneCount,
      openCount: m.openCount,
      svcOpenCount: m.svcOpenCount,
      skus: comEstoque,
      totalProducts: totalAtivos,
      lowCount: baixas.length,
      lows: baixas.slice(0, 4),
    });
  }
  return { units: out, lowLimit: limite };
}

/* ---------- oportunidades: regras simples e visiveis, nada e disparado automaticamente ---------- */

const norm = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export async function oportunidades() {
  const limite = await limiteEstoqueBaixo();
  const [pedidos, produtos, ordens] = await Promise.all([
    prisma.pedido.findMany({ where: { status: { not: 'cancelado' } }, include: { itens: true, cliente: true }, orderBy: { criadoEm: 'desc' } }),
    prisma.produto.findMany({ include: { categoria: true, opcoes: { include: { valores: true } } }, orderBy: { ordem: 'asc' } }),
    prisma.ordemServico.findMany({
      where: { status: { in: ['reparo', 'retirada', 'concluido'] }, criadoEm: { gte: new Date(Date.now() - 20 * DIA_MS) } },
      include: { cliente: true },
      orderBy: { criadoEm: 'desc' },
    }),
  ]);
  const P = new Map(produtos.map((p) => [p.id, p]));
  const ativos = produtos.filter((p) => p.ativo);
  const compativel = (p: (typeof produtos)[number], modelo: string) => opcoesDe(p).some((o) => o.name === COMPAT && o.values.some((v) => v.v === modelo));

  // 1) Comprou celular e nao levou capa ou pelicula compativel com o modelo.
  const porCliente = new Map<string, typeof pedidos>();
  for (const o of pedidos) porCliente.set(o.clienteId, [...(porCliente.get(o.clienteId) || []), o]);
  const phoneBuys = [];
  for (const [, meus] of porCliente) {
    const celulares = meus.flatMap((o) => o.itens.filter((l) => P.get(l.produtoId)?.categoria.grupo === 'celulares').map((l) => ({ o, l })));
    if (!celulares.length) continue;
    const ultimo = celulares.sort((a, b) => b.o.criadoEm.getTime() - a.o.criadoEm.getTime())[0];
    const modelo = P.get(ultimo.l.produtoId)!.modelo;
    const tem = (sub: string) => meus.some((o) => o.itens.some((l) => P.get(l.produtoId)?.categoriaId === sub && l.chave.split('|').includes(modelo)));
    const faltando = ['capinhas', 'peliculas'].filter((s) => !tem(s));
    if (!faltando.length) continue;
    const sugestoes = ativos.filter((p) => faltando.includes(p.categoriaId) && compativel(p, modelo)).slice(0, 3);
    phoneBuys.push({
      customer: { id: ultimo.o.cliente.id, name: ultimo.o.cliente.nome },
      order: { id: `PED-${ultimo.o.numero}`, num: ultimo.o.numero, createdAt: ultimo.o.criadoEm.getTime(), unitId: ultimo.o.unidadeId },
      model: modelo,
      missing: faltando,
      sugg: sugestoes.map((p) => p.id),
    });
  }

  // 2) Clientes da assistencia: aparelho em reparo, aguardando retirada ou concluido nos ultimos 20 dias.
  const modelosCatalogo = produtos.filter((p) => p.categoria.grupo === 'celulares').map((p) => p.modelo);
  const genericos = ativos.filter((p) => ['peliculas', 'carregadores'].includes(p.categoriaId)).slice(0, 2);
  const svcOpps = ordens.map((s) => {
    const modelo = modelosCatalogo.find((m) => norm(m) === norm(s.modelo)) || null;
    const sugg = modelo ? ativos.filter((p) => ['capinhas', 'peliculas'].includes(p.categoriaId) && compativel(p, modelo)).slice(0, 2) : genericos;
    return {
      service: { id: `OS-${s.numero}`, num: s.numero, brand: s.marca, model: s.modelo, status: s.status },
      customer: { id: s.cliente.id, name: s.cliente.nome },
      model: modelo,
      sugg: sugg.map((p) => p.id),
    };
  });

  // 3) Comprados juntos.
  const pares: Record<string, number> = {};
  for (const o of pedidos) {
    const ids = [...new Set(o.itens.map((l) => l.produtoId))].sort();
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pares[`${ids[i]}+${ids[j]}`] = (pares[`${ids[i]}+${ids[j]}`] || 0) + 1;
  }
  const pairs = Object.entries(pares)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([k, n]) => ({ a: k.split('+')[0], b: k.split('+')[1], n }));

  // 4) Categorias em movimento e 5) reposicao sugerida (ultimos 30 dias).
  const de = Date.now() - 30 * DIA_MS;
  const cats: Record<string, number> = {};
  const vendidos: Record<string, number> = {};
  for (const o of pedidos.filter((o) => o.criadoEm.getTime() >= de))
    for (const l of o.itens) {
      const p = P.get(l.produtoId);
      if (p) cats[p.categoriaId] = (cats[p.categoriaId] || 0) + l.quantidade;
      vendidos[l.produtoId] = (vendidos[l.produtoId] || 0) + l.quantidade;
    }
  const catList = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const { linhas } = await saldosAtivos();
  const lows = linhas
    .filter((l) => l.q <= limite && vendidos[l.produtoId])
    .map((l) => ({ pid: l.produtoId, vkey: l.chave, unitId: l.unidadeId, q: l.q, sold: vendidos[l.produtoId] }))
    .sort((a, b) => b.sold - a.sold || a.q - b.q)
    .slice(0, 6);

  return { phoneBuys, svcOpps, pairs, catList, lows, lowLimit: limite };
}
