import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { conflito, invalido, naoEncontrado } from '../lib/http';

type Tx = Prisma.TransactionClient;

// Saldo atual travando a linha ate o fim da transacao (evita duas baixas simultaneas lerem o mesmo saldo).
async function saldoComTrava(tx: Tx, variacaoId: string, unidadeId: string): Promise<number> {
  await tx.estoque.upsert({
    where: { variacaoId_unidadeId: { variacaoId, unidadeId } },
    create: { variacaoId, unidadeId, quantidade: 0 },
    update: {},
  });
  const linhas = await tx.$queryRaw<{ quantidade: number }[]>`
    SELECT "quantidade" FROM "estoques" WHERE "variacaoId" = ${variacaoId} AND "unidadeId" = ${unidadeId} FOR UPDATE`;
  return Number(linhas[0]?.quantidade ?? 0);
}

/* ---------- ajuste manual pelo painel ---------- */

const ajusteSchema = z
  .object({
    produtoId: z.string().min(1),
    chave: z.string().min(1),
    unidadeId: z.string().min(1),
    // Informe delta (+/-) ou a quantidade final contada.
    delta: z.coerce.number().int().min(-9999).max(9999).optional(),
    quantidade: z.coerce.number().int().min(0, 'o estoque não pode ficar negativo').max(99999).optional(),
    motivo: z.string().trim().max(200).optional(),
  })
  .refine((d) => d.delta !== undefined || d.quantidade !== undefined, 'Informe "delta" ou "quantidade".');

export async function ajustar(body: unknown, usuarioId: string) {
  const d = ajusteSchema.parse(body);
  return prisma.$transaction(async (tx) => {
    const variacao = await tx.produtoVariacao.findUnique({ where: { produtoId_chave: { produtoId: d.produtoId, chave: d.chave } }, include: { produto: true } });
    if (!variacao) throw naoEncontrado('Variação não encontrada.');
    const unidade = await tx.unidade.findUnique({ where: { id: d.unidadeId } });
    if (!unidade) throw naoEncontrado('Unidade não encontrada.');

    const atual = await saldoComTrava(tx, variacao.id, unidade.id);
    const novo = d.quantidade !== undefined ? d.quantidade : atual + (d.delta || 0);
    if (novo < 0) throw conflito(`Estoque não pode ficar negativo. Saldo atual de ${variacao.produto.nome} em ${unidade.nome}: ${atual}.`);
    const delta = novo - atual;
    if (delta !== 0) {
      await tx.estoque.update({ where: { variacaoId_unidadeId: { variacaoId: variacao.id, unidadeId: unidade.id } }, data: { quantidade: novo } });
      await tx.movimentacaoEstoque.create({
        data: { variacaoId: variacao.id, unidadeId: unidade.id, tipo: 'AJUSTE', quantidade: delta, saldoApos: novo, motivo: d.motivo || 'Ajuste manual', usuarioId },
      });
    }
    return { key: `${d.produtoId}|${d.chave}|${d.unidadeId}`, quantity: novo, delta };
  });
}

/* ---------- baixa e devolucao por pedido (sempre dentro da transacao do pedido) ---------- */

type ItemEstoque = { variacaoId: string; nome: string; variacaoNome: string; quantidade: number };

function agrupar(itens: ItemEstoque[]) {
  const m = new Map<string, ItemEstoque>();
  for (const i of itens) {
    const ex = m.get(i.variacaoId);
    if (ex) ex.quantidade += i.quantidade;
    else m.set(i.variacaoId, { ...i });
  }
  return [...m.values()];
}

// Baixa os itens do pedido. Se faltar qualquer item, lanca 409 e a transacao inteira e desfeita.
export async function baixarPedido(tx: Tx, pedido: { id: string; numero: number; unidadeId: string }, itens: ItemEstoque[], usuarioId: string | null) {
  for (const i of agrupar(itens)) {
    const saldo = await saldoComTrava(tx, i.variacaoId, pedido.unidadeId);
    if (saldo < i.quantidade) {
      const unidade = await tx.unidade.findUnique({ where: { id: pedido.unidadeId } });
      throw conflito(
        `Estoque insuficiente em ${unidade?.nome || pedido.unidadeId} para ${i.nome}${i.variacaoNome ? ` (${i.variacaoNome})` : ''}: pedido precisa de ${i.quantidade}, há ${saldo}. Ajuste o estoque antes de confirmar.`,
        { variacaoId: i.variacaoId, disponivel: saldo, necessario: i.quantidade },
      );
    }
    const novo = saldo - i.quantidade;
    await tx.estoque.update({ where: { variacaoId_unidadeId: { variacaoId: i.variacaoId, unidadeId: pedido.unidadeId } }, data: { quantidade: novo } });
    await tx.movimentacaoEstoque.create({
      data: { variacaoId: i.variacaoId, unidadeId: pedido.unidadeId, tipo: 'VENDA', quantidade: -i.quantidade, saldoApos: novo, motivo: `Baixa do pedido PED-${pedido.numero}`, pedidoId: pedido.id, usuarioId },
    });
  }
}

export async function devolverPedido(tx: Tx, pedido: { id: string; numero: number; unidadeId: string }, itens: ItemEstoque[], usuarioId: string | null, motivo: string) {
  for (const i of agrupar(itens)) {
    const saldo = await saldoComTrava(tx, i.variacaoId, pedido.unidadeId);
    const novo = saldo + i.quantidade;
    await tx.estoque.update({ where: { variacaoId_unidadeId: { variacaoId: i.variacaoId, unidadeId: pedido.unidadeId } }, data: { quantidade: novo } });
    await tx.movimentacaoEstoque.create({
      data: { variacaoId: i.variacaoId, unidadeId: pedido.unidadeId, tipo: 'DEVOLUCAO', quantidade: i.quantidade, saldoApos: novo, motivo: `${motivo} (PED-${pedido.numero})`, pedidoId: pedido.id, usuarioId },
    });
  }
}

/* ---------- consulta ---------- */

export async function listarMovimentacoes(q: { produtoId?: string; unidadeId?: string; pedido?: string; limite?: string }) {
  const limite = Math.min(500, Math.max(1, Number(q.limite) || 100));
  const pedidoNum = q.pedido ? Number(String(q.pedido).replace(/\D/g, '')) : NaN;
  if (q.pedido && !Number.isFinite(pedidoNum)) throw invalido('Número de pedido inválido.');
  const movs = await prisma.movimentacaoEstoque.findMany({
    where: {
      unidadeId: q.unidadeId || undefined,
      variacao: q.produtoId ? { produtoId: q.produtoId } : undefined,
      pedido: q.pedido ? { numero: pedidoNum } : undefined,
    },
    include: { variacao: { include: { produto: { select: { id: true, nome: true } } } }, usuario: { select: { nome: true } }, pedido: { select: { numero: true } } },
    orderBy: { criadoEm: 'desc' },
    take: limite,
  });
  return movs.map((m) => ({
    id: m.id,
    at: m.criadoEm.getTime(),
    type: m.tipo,
    qty: m.quantidade,
    balance: m.saldoApos,
    reason: m.motivo || '',
    unitId: m.unidadeId,
    pid: m.variacao.produto.id,
    product: m.variacao.produto.nome,
    vkey: m.variacao.chave,
    sku: m.variacao.sku,
    order: m.pedido ? `PED-${m.pedido.numero}` : null,
    user: m.usuario?.nome || null,
  }));
}
