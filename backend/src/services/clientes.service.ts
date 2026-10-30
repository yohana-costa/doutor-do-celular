import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, conflito, invalido, naoEncontrado } from '../lib/http';
import { normalizarTelefone, telefoneValido } from '../lib/telefone';
import { signCliente } from '../lib/jwt';
import { clienteFront, incluirOs, incluirPedido, num, osFront, pedidoFront } from '../lib/serializar';

type Tx = Prisma.TransactionClient;

// Cliente e identificado pelo telefone. Pedidos e assistencias com o mesmo telefone caem no mesmo cadastro.
// Nome e e-mail so sao atualizados quando o cliente ainda nao tem conta (quem tem conta edita pelo login).
export async function upsertPorTelefone(tx: Tx, dados: { nome: string; telefone: string; email?: string | null }) {
  const telefone = normalizarTelefone(dados.telefone);
  if (!telefoneValido(telefone)) throw invalido('Informe um telefone com DDD, como (11) 90000-0000.');
  const existente = await tx.cliente.findUnique({ where: { telefone } });
  if (existente) {
    if (existente.senha) return existente;
    return tx.cliente.update({ where: { id: existente.id }, data: { nome: dados.nome || existente.nome, email: dados.email || existente.email } });
  }
  return tx.cliente.create({ data: { nome: dados.nome, telefone, email: dados.email || null, origem: 'site' } });
}

/* ---------- Minha conta ---------- */

const senhaSchema = z.string().min(6, 'a senha precisa de ao menos 6 caracteres').max(72);
const cadastroSchema = z.object({
  nome: z.string().trim().min(3, 'informe o nome').max(80),
  telefone: z.string().min(10),
  email: z.string().trim().email('e-mail inválido').max(120).optional().or(z.literal('')),
  senha: senhaSchema,
  // Codigo de um pedido ou OS do cliente: prova de posse para vincular um telefone que ja tem historico.
  codigo: z.string().trim().max(20).optional(),
});

function sessao(c: { id: string; nome: string }) {
  return signCliente({ id: c.id, nome: c.nome });
}

export async function cadastrar(body: unknown) {
  const d = cadastroSchema.parse(body);
  const telefone = normalizarTelefone(d.telefone);
  if (!telefoneValido(telefone)) throw invalido('Informe um telefone com DDD, como (11) 90000-0000.');
  const senha = await bcrypt.hash(d.senha, 10);
  const existente = await prisma.cliente.findUnique({
    where: { telefone },
    include: { pedidos: { select: { numero: true } }, ordensServico: { select: { numero: true } } },
  });

  if (existente?.senha) throw conflito('Este telefone já tem conta. Entre com a sua senha.');

  if (existente) {
    // Telefone ja tem pedidos/OS: so vincula com o codigo de um deles, para ninguem
    // criar conta com o telefone de outra pessoa e ver o historico dela.
    const temHistorico = existente.pedidos.length + existente.ordensServico.length > 0;
    if (temHistorico) {
      const m = String(d.codigo || '').toUpperCase().replace(/\s/g, '').match(/^(PED|OS)-?(\d+)$/);
      const n = m ? Number(m[2]) : NaN;
      const ok = m && (m[1] === 'PED' ? existente.pedidos.some((p) => p.numero === n) : existente.ordensServico.some((s) => s.numero === n));
      if (!ok) {
        throw new HttpError(
          409,
          'Este telefone já tem pedidos ou assistências na loja. Para vincular, informe o código de um deles (ex.: PED-1001 ou OS-2001).',
          { precisaCodigo: true },
        );
      }
    }
    const c = await prisma.cliente.update({ where: { id: existente.id }, data: { nome: d.nome, email: d.email || existente.email, senha } });
    return { token: sessao(c), customer: clienteFront(c) };
  }

  const c = await prisma.cliente.create({ data: { nome: d.nome, telefone, email: d.email || null, senha, origem: 'site' } });
  return { token: sessao(c), customer: clienteFront(c) };
}

export async function entrar(body: unknown) {
  const d = z.object({ telefone: z.string().min(10), senha: z.string().min(1) }).parse(body);
  const c = await prisma.cliente.findUnique({ where: { telefone: normalizarTelefone(d.telefone) } });
  if (!c || !c.senha || !(await bcrypt.compare(d.senha, c.senha))) throw new HttpError(401, 'Telefone ou senha incorretos.');
  return { token: sessao(c), customer: clienteFront(c) };
}

export async function minhaConta(clienteId: string) {
  const c = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      pedidos: { include: incluirPedido, orderBy: { criadoEm: 'desc' } },
      ordensServico: { include: incluirOs, orderBy: { criadoEm: 'desc' } },
    },
  });
  if (!c) throw naoEncontrado('Conta não encontrada.');
  return { customer: clienteFront(c), orders: c.pedidos.map(pedidoFront), services: c.ordensServico.map(osFront) };
}

export async function atualizarMinhaConta(clienteId: string, body: unknown) {
  const d = z
    .object({ nome: z.string().trim().min(3).max(80).optional(), email: z.string().trim().email().max(120).optional().or(z.literal('')), senhaAtual: z.string().optional(), novaSenha: senhaSchema.optional() })
    .parse(body);
  const c = await prisma.cliente.findUnique({ where: { id: clienteId } });
  if (!c) throw naoEncontrado('Conta não encontrada.');
  let senha: string | undefined;
  if (d.novaSenha) {
    if (!c.senha || !d.senhaAtual || !(await bcrypt.compare(d.senhaAtual, c.senha))) throw new HttpError(401, 'Senha atual incorreta.');
    senha = await bcrypt.hash(d.novaSenha, 10);
  }
  const u = await prisma.cliente.update({ where: { id: clienteId }, data: { nome: d.nome, email: d.email === '' ? null : d.email, senha } });
  return { customer: clienteFront(u) };
}

/* ---------- gestao ---------- */

export async function listar(q: { busca?: string }) {
  const busca = String(q.busca || '').trim();
  const digitos = busca.replace(/\D/g, '');
  const clientes = await prisma.cliente.findMany({
    where: busca
      ? { OR: [{ nome: { contains: busca, mode: 'insensitive' } }, ...(digitos ? [{ telefone: { contains: digitos } }] : [])] }
      : undefined,
    include: {
      pedidos: { select: { status: true, total: true, unidadeId: true, criadoEm: true } },
      ordensServico: { select: { unidadeId: true, criadoEm: true } },
    },
    orderBy: { atualizadoEm: 'desc' },
    take: 500,
  });
  return clientes
    .map((c) => {
      const uc: Record<string, number> = {};
      [...c.pedidos, ...c.ordensServico].forEach((x) => (uc[x.unidadeId] = (uc[x.unidadeId] || 0) + 1));
      const fav = Object.entries(uc).sort((a, b) => b[1] - a[1])[0];
      const datas = [...c.pedidos, ...c.ordensServico].map((x) => x.criadoEm.getTime());
      return {
        ...clienteFront(c),
        stats: {
          orders: c.pedidos.length,
          spent: Math.round(c.pedidos.filter((o) => o.status === 'concluido').reduce((s, o) => s + num(o.total), 0) * 100) / 100,
          services: c.ordensServico.length,
          fav: fav ? fav[0] : null,
          last: datas.length ? Math.max(...datas) : null,
        },
      };
    })
    .sort((a, b) => (b.stats.last || 0) - (a.stats.last || 0));
}

export async function detalhe(id: string) {
  const r = await minhaConta(id).catch(() => null);
  if (!r) throw naoEncontrado('Cliente não encontrado.');
  return r;
}

export async function atualizarPelaEquipe(id: string, body: unknown) {
  const d = z.object({ nome: z.string().trim().min(2).max(80).optional(), email: z.string().trim().email().max(120).optional().or(z.literal('')) }).parse(body);
  const c = await prisma.cliente.update({ where: { id }, data: { nome: d.nome, email: d.email === '' ? null : d.email } });
  return clienteFront(c);
}
