import { Prisma } from '@prisma/client';
import { formatarTelefone } from './telefone';
import { Opcao, Selecao } from './variacoes';

// Converte os registros do banco para o formato que o front ja usava no prototipo
// (chaves em ingles curtas: id, num, items, history...). Assim as telas mudam pouco.

export const num = (d: Prisma.Decimal | number | null | undefined) => (d == null ? 0 : Number(d));
const ms = (d: Date | null | undefined) => (d ? d.getTime() : null);

export const incluirProduto = {
  categoria: true,
  opcoes: { orderBy: { ordem: 'asc' as const }, include: { valores: { orderBy: { ordem: 'asc' as const } } } },
  exclusoes: true,
  variacoes: { orderBy: { criadoEm: 'asc' as const } },
} satisfies Prisma.ProdutoInclude;

export type ProdutoCompleto = Prisma.ProdutoGetPayload<{ include: typeof incluirProduto }>;

export function opcoesDe(p: Pick<ProdutoCompleto, 'opcoes'>): Opcao[] {
  return p.opcoes.map((o) => ({
    name: o.nome,
    type: o.tipo === 'color' ? 'color' : 'pill',
    values: o.valores.map((v) => {
      const val: { v: string; d?: number; hex?: string } = { v: v.valor };
      if (num(v.acrescimo)) val.d = num(v.acrescimo);
      if (v.hex) val.hex = v.hex;
      return val;
    }),
  }));
}

export function exclusoesDe(p: Pick<ProdutoCompleto, 'exclusoes'>): Selecao[] {
  return p.exclusoes.map((e) => (e.combinacao || {}) as Selecao);
}

export function produtoFront(p: ProdutoCompleto) {
  return {
    id: p.id,
    code: p.codigo,
    name: p.nome,
    brand: p.marca,
    model: p.modelo,
    group: p.categoria.grupo,
    sub: p.categoriaId,
    price: num(p.precoBase),
    rank: p.ordem,
    isNew: p.novidade,
    active: p.ativo,
    options: opcoesDe(p),
    exclude: exclusoesDe(p),
    art: p.arte || {},
    image: p.imagemUrl || null,
    tags: p.tags,
    desc: p.descricao,
    specs: (p.especificacoes as unknown as [string, string][]) || [],
    compat: (p.compatibilidade as unknown as string[] | null) || null,
    createdAt: ms(p.criadoEm),
    variations: p.variacoes.map((v) => ({ id: v.id, key: v.chave, sku: v.sku, price: num(v.preco), active: v.ativo })),
  };
}

export function clienteFront(c: { id: string; nome: string; telefone: string; email: string | null; origem: string; criadoEm: Date; senha?: string | null }) {
  return {
    id: c.id,
    name: c.nome,
    phone: formatarTelefone(c.telefone),
    email: c.email || '',
    source: c.origem,
    createdAt: ms(c.criadoEm),
    hasAccount: !!c.senha,
  };
}

export const incluirPedido = {
  itens: true,
  historico: { orderBy: { criadoEm: 'asc' as const } },
  cliente: true,
} satisfies Prisma.PedidoInclude;
export type PedidoCompleto = Prisma.PedidoGetPayload<{ include: typeof incluirPedido }>;

export function pedidoFront(o: PedidoCompleto) {
  return {
    id: `PED-${o.numero}`,
    num: o.numero,
    customerId: o.clienteId,
    customer: { name: o.cliente.nome, phone: formatarTelefone(o.cliente.telefone), email: o.cliente.email || '' },
    createdAt: ms(o.criadoEm),
    unitId: o.unidadeId,
    mode: o.modalidade,
    address: o.endereco || '',
    pay: o.pagamento,
    note: o.observacao || '',
    items: o.itens.map((l) => ({
      pid: l.produtoId,
      vkey: l.chave,
      name: l.nome,
      variant: l.variacaoNome,
      price: num(l.preco),
      qty: l.quantidade,
      sku: l.sku,
    })),
    total: num(o.total),
    status: o.status,
    history: o.historico.map((h) => ({ s: h.status, at: ms(h.criadoEm), note: h.observacao || '' })),
    stockApplied: o.estoqueAplicado,
    completedAt: ms(o.concluidoEm),
    source: o.origem,
  };
}

export const incluirOs = {
  historico: { orderBy: { criadoEm: 'asc' as const } },
  cliente: true,
} satisfies Prisma.OrdemServicoInclude;
export type OsCompleta = Prisma.OrdemServicoGetPayload<{ include: typeof incluirOs }>;

export function osFront(s: OsCompleta) {
  return {
    id: `OS-${s.numero}`,
    num: s.numero,
    customerId: s.clienteId,
    customer: { name: s.cliente.nome, phone: formatarTelefone(s.cliente.telefone) },
    brand: s.marca,
    model: s.modelo,
    service: s.servico,
    unitId: s.unidadeId,
    status: s.status,
    createdAt: ms(s.criadoEm),
    desc: s.descricao,
    quote:
      s.orcamentoValor != null
        ? { value: num(s.orcamentoValor), note: s.orcamentoObs || '', at: ms(s.orcamentoEm), decision: s.orcamentoDecisao, decidedAt: ms(s.orcamentoDecididoEm) }
        : null,
    history: s.historico.map((h) => ({ s: h.status, at: ms(h.criadoEm), by: h.autor, note: h.observacao || '' })),
    source: s.origem,
  };
}
