import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, conflito, invalido, naoEncontrado } from '../lib/http';
import { signAcesso, AcessoPayload, ClientePayload } from '../lib/jwt';
import { incluirPedido, pedidoFront, opcoesDe, num } from '../lib/serializar';
import { rotuloDe, selecaoDaChave } from '../lib/variacoes';
import { normalizarTelefone } from '../lib/telefone';
import { upsertPorTelefone } from './clientes.service';
import { baixarPedido, devolverPedido } from './estoque.service';

export const ORDER_STATUS = ['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto', 'concluido', 'cancelado'] as const;
// Status em que os itens estao fora do estoque. A baixa acontece uma unica vez ao entrar
// neste grupo e e devolvida ao sair dele (cancelamento ou volta para antes de Confirmado).
export const STOCK_APPLIED = new Set(['confirmado', 'separacao', 'pronto', 'concluido']);
export const ORDER_OPEN = new Set(['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto']);

/* ---------- checkout ---------- */

const checkoutSchema = z.object({
  nome: z.string().trim().min(3, 'informe o nome completo').max(80),
  telefone: z.string().trim().min(10, 'informe o telefone com DDD').max(20),
  email: z.string().trim().email('e-mail inválido').max(120).optional().or(z.literal('')),
  unidadeId: z.string().min(1),
  modalidade: z.enum(['retirada', 'entrega']),
  endereco: z.string().trim().max(300).optional(),
  pagamento: z.enum(['pix', 'cartao', 'retirada']),
  observacao: z.string().trim().max(500).optional(),
  itens: z
    .array(z.object({ produtoId: z.string().min(1), chave: z.string().min(1), quantidade: z.coerce.number().int().min(1).max(99) }))
    .min(1, 'a sacola está vazia')
    .max(50),
});

const acessoPedido = (p: { id: string; numero: number }) => signAcesso({ recurso: 'pedido', id: p.id, numero: p.numero });

export async function criarPedido(body: unknown, cliente?: ClientePayload) {
  const d = checkoutSchema.parse(body);
  if (d.modalidade === 'entrega' && (d.endereco || '').length < 6) throw invalido('Informe o endereço de entrega.');

  const unidade = await prisma.unidade.findFirst({ where: { id: d.unidadeId, ativo: true } });
  if (!unidade) throw invalido('Unidade indisponível.');

  // Junta linhas repetidas da mesma variacao.
  const porChave = new Map<string, { produtoId: string; chave: string; quantidade: number }>();
  for (const i of d.itens) {
    const k = `${i.produtoId}|${i.chave}`;
    const ex = porChave.get(k);
    if (ex) ex.quantidade += i.quantidade;
    else porChave.set(k, { ...i });
  }

  const linhas: { produtoId: string; variacaoId: string; nome: string; variacaoNome: string; chave: string; sku: string; preco: number; quantidade: number }[] = [];
  for (const i of porChave.values()) {
    const variacao = await prisma.produtoVariacao.findUnique({
      where: { produtoId_chave: { produtoId: i.produtoId, chave: i.chave } },
      include: { produto: { include: { opcoes: { orderBy: { ordem: 'asc' }, include: { valores: { orderBy: { ordem: 'asc' } } } }, categoria: true } }, estoques: { where: { unidadeId: unidade.id } } },
    });
    if (!variacao || !variacao.ativo || !variacao.produto.ativo || !variacao.produto.categoria.ativo) {
      throw conflito('Um dos itens da sacola não está mais disponível na loja. Remova-o e tente de novo.', { produtoId: i.produtoId, chave: i.chave });
    }
    const disponivel = variacao.estoques[0]?.quantidade ?? 0;
    const opcoes = opcoesDe(variacao.produto);
    const rotulo = rotuloDe(opcoes, selecaoDaChave(opcoes, i.chave));
    if (disponivel < i.quantidade) {
      throw conflito(`Sem estoque suficiente em ${unidade.nome} para ${variacao.produto.nome}${rotulo ? ` (${rotulo})` : ''}: há ${disponivel}. Escolha outra unidade ou ajuste a sacola.`, {
        produtoId: i.produtoId,
        chave: i.chave,
        disponivel,
      });
    }
    linhas.push({ produtoId: i.produtoId, variacaoId: variacao.id, nome: variacao.produto.nome, variacaoNome: rotulo, chave: i.chave, sku: variacao.sku, preco: num(variacao.preco), quantidade: i.quantidade });
  }
  const total = Math.round(linhas.reduce((s, l) => s + l.preco * l.quantidade, 0) * 100) / 100;

  const pedido = await prisma.$transaction(async (tx) => {
    const c = cliente
      ? await tx.cliente.findUniqueOrThrow({ where: { id: cliente.id } })
      : await upsertPorTelefone(tx, { nome: d.nome, telefone: d.telefone, email: d.email || null });
    return tx.pedido.create({
      data: {
        clienteId: c.id,
        unidadeId: unidade.id,
        modalidade: d.modalidade,
        endereco: d.modalidade === 'entrega' ? d.endereco : null,
        pagamento: d.pagamento,
        observacao: d.observacao || null,
        status: 'recebido',
        total,
        origem: 'site',
        itens: { create: linhas },
        historico: { create: { status: 'recebido', observacao: 'Pedido feito pelo site' } },
      },
      include: incluirPedido,
    });
  });
  return { order: pedidoFront(pedido), access: acessoPedido(pedido) };
}

/* ---------- consulta pelo cliente ---------- */

export async function verPedidoCliente(numero: number, ident: { acesso?: AcessoPayload; cliente?: ClientePayload }) {
  const p = await prisma.pedido.findUnique({ where: { numero }, include: incluirPedido });
  const liberado = p && ((ident.acesso?.recurso === 'pedido' && ident.acesso.id === p.id) || (ident.cliente && ident.cliente.id === p.clienteId));
  if (!p || !liberado) throw new HttpError(401, 'Informe o telefone usado no pedido para ver os detalhes.', { precisaTelefone: true });
  return { order: pedidoFront(p) };
}

// Consulta por codigo + telefone (PED-1001 ou OS-2001). Telefone errado e codigo inexistente
// devolvem a mesma resposta, para nao revelar quais codigos existem.
export async function consultar(body: unknown) {
  const d = z.object({ codigo: z.string().trim().min(3).max(20), telefone: z.string().min(10).max(20) }).parse(body);
  const m = d.codigo.toUpperCase().replace(/\s/g, '').match(/^(PED|OS)?-?(\d{3,7})$/);
  const telefone = normalizarTelefone(d.telefone);
  const falha = new HttpError(404, 'Não encontramos um pedido ou solicitação com esse código e telefone.');
  if (!m) throw invalido('Use o formato PED-1001 ou OS-2001.');
  const n = Number(m[2]);
  if (m[1] !== 'OS') {
    const p = await prisma.pedido.findUnique({ where: { numero: n }, include: { cliente: true } });
    if (p && p.cliente.telefone === telefone) return { type: 'pedido', num: p.numero, access: acessoPedido(p) };
  }
  if (m[1] !== 'PED') {
    const s = await prisma.ordemServico.findUnique({ where: { numero: n }, include: { cliente: true } });
    if (s && s.cliente.telefone === telefone) return { type: 'os', num: s.numero, access: signAcesso({ recurso: 'os', id: s.id, numero: s.numero }) };
  }
  throw falha;
}

/* ---------- gestao ---------- */

export async function listar(q: { status?: string; unidade?: string; busca?: string; limite?: string }) {
  const where: Prisma.PedidoWhereInput = {};
  if (q.unidade && q.unidade !== 'all') where.unidadeId = q.unidade;
  const busca = String(q.busca || '').trim();
  if (busca) {
    const n = Number(busca.replace(/\D/g, ''));
    const dig = busca.replace(/\D/g, '');
    where.OR = [
      { cliente: { nome: { contains: busca, mode: 'insensitive' } } },
      ...(dig ? [{ cliente: { telefone: { contains: dig } } }] : []),
      ...(Number.isFinite(n) && n > 0 ? [{ numero: n }] : []),
    ];
  }
  const counts = await prisma.pedido.groupBy({ by: ['status'], where, _count: true });
  if (q.status === 'open') where.status = { in: [...ORDER_OPEN] };
  else if (q.status === 'wait') where.status = { in: ['recebido', 'aguardando'] };
  else if (q.status && q.status !== 'all') where.status = q.status;
  const [pedidos, somas] = await Promise.all([
    prisma.pedido.findMany({ where, include: incluirPedido, orderBy: { criadoEm: 'desc' }, take: Math.min(500, Number(q.limite) || 200) }),
    prisma.pedido.groupBy({ by: ['status'], where, _sum: { total: true }, _count: true }),
  ]);
  const soma = (f: (s: string) => boolean) => Math.round(somas.filter((s) => f(s.status)).reduce((a, s) => a + num(s._sum.total), 0) * 100) / 100;
  return {
    orders: pedidos.map(pedidoFront),
    total: somas.reduce((a, s) => a + s._count, 0),
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
    doneSum: soma((s) => s === 'concluido'),
    openSum: soma((s) => ORDER_OPEN.has(s)),
  };
}

export async function detalhe(numero: number) {
  const p = await prisma.pedido.findUnique({ where: { numero }, include: incluirPedido });
  if (!p) throw naoEncontrado('Pedido não encontrado.');
  return { order: pedidoFront(p) };
}

// Regra unica de estoque do pedido (dentro de uma transacao, com a linha do pedido travada):
// entrar em Confirmado ou depois baixa os itens uma vez; sair desse grupo devolve.
// Trocar o status varias vezes nao duplica movimentacoes porque estoqueAplicado guarda o estado.
export async function alterarStatus(numero: number, body: unknown, usuarioId: string) {
  const d = z.object({ status: z.enum(ORDER_STATUS), observacao: z.string().trim().max(300).optional() }).parse(body);
  const pedido = await prisma.$transaction(async (tx) => {
    const trava = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "pedidos" WHERE "numero" = ${numero} FOR UPDATE`;
    if (!trava.length) throw naoEncontrado('Pedido não encontrado.');
    const p = await tx.pedido.findUniqueOrThrow({ where: { id: trava[0].id }, include: { itens: true } });
    if (p.status === d.status) return p.id;

    const precisa = STOCK_APPLIED.has(d.status);
    const itens = p.itens.map((i) => ({ variacaoId: i.variacaoId, nome: i.nome, variacaoNome: i.variacaoNome, quantidade: i.quantidade }));
    if (precisa && !p.estoqueAplicado) {
      const marcado = await tx.pedido.updateMany({ where: { id: p.id, estoqueAplicado: false }, data: { estoqueAplicado: true } });
      if (marcado.count === 1) await baixarPedido(tx, p, itens, usuarioId);
    } else if (!precisa && p.estoqueAplicado) {
      const marcado = await tx.pedido.updateMany({ where: { id: p.id, estoqueAplicado: true }, data: { estoqueAplicado: false } });
      if (marcado.count === 1) await devolverPedido(tx, p, itens, usuarioId, d.status === 'cancelado' ? 'Pedido cancelado' : 'Pedido voltou para antes de Confirmado');
    }
    await tx.pedido.update({
      where: { id: p.id },
      data: { status: d.status, concluidoEm: d.status === 'concluido' ? new Date() : null },
    });
    await tx.pedidoHistorico.create({ data: { pedidoId: p.id, status: d.status, usuarioId, observacao: d.observacao || null } });
    return p.id;
  });
  return { order: pedidoFront(await prisma.pedido.findUniqueOrThrow({ where: { id: pedido }, include: incluirPedido })) };
}
