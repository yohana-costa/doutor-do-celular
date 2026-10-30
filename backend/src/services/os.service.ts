import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, conflito, invalido, naoEncontrado } from '../lib/http';
import { signAcesso, AcessoPayload, ClientePayload } from '../lib/jwt';
import { incluirOs, osFront } from '../lib/serializar';
import { upsertPorTelefone } from './clientes.service';

export const SVC_STATUS = ['recebida', 'avaliacao', 'diagnostico', 'orcamento', 'reparo', 'retirada', 'concluido', 'cancelado'] as const;
export const SVC_OPEN = new Set(['recebida', 'avaliacao', 'diagnostico', 'orcamento', 'reparo', 'retirada']);
// Registrar orcamento numa etapa anterior move a OS para "Aguardando aprovacao do orcamento".
const ANTES_DO_ORCAMENTO = new Set(['recebida', 'avaliacao', 'diagnostico']);

const acessoOs = (s: { id: string; numero: number }) => signAcesso({ recurso: 'os', id: s.id, numero: s.numero });

/* ---------- cliente ---------- */

const solicitarSchema = z.object({
  nome: z.string().trim().min(3, 'informe seu nome').max(80),
  telefone: z.string().trim().min(10).max(20),
  marca: z.string().trim().min(2, 'escolha a marca').max(40),
  modelo: z.string().trim().min(2, 'informe o modelo').max(80),
  servico: z.string().trim().min(2, 'escolha o tipo de problema').max(60),
  descricao: z.string().trim().min(8, 'descreva o defeito').max(2000),
  unidadeId: z.string().min(1),
});

export async function solicitar(body: unknown, cliente?: ClientePayload) {
  const d = solicitarSchema.parse(body);
  const unidade = await prisma.unidade.findFirst({ where: { id: d.unidadeId, ativo: true } });
  if (!unidade) throw invalido('Unidade indisponível.');
  const servico = await prisma.servico.findFirst({ where: { nome: d.servico, ativo: true } });
  if (!servico) throw invalido('Tipo de serviço inválido.');
  const os = await prisma.$transaction(async (tx) => {
    const c = cliente ? await tx.cliente.findUniqueOrThrow({ where: { id: cliente.id } }) : await upsertPorTelefone(tx, { nome: d.nome, telefone: d.telefone });
    return tx.ordemServico.create({
      data: {
        clienteId: c.id,
        unidadeId: unidade.id,
        marca: d.marca,
        modelo: d.modelo,
        servico: servico.nome,
        descricao: d.descricao,
        status: 'recebida',
        origem: 'site',
        historico: { create: { status: 'recebida', autor: 'cliente', observacao: 'Solicitação enviada pelo site' } },
      },
      include: incluirOs,
    });
  });
  return { service: osFront(os), access: acessoOs(os) };
}

async function osLiberada(numero: number, ident: { acesso?: AcessoPayload; cliente?: ClientePayload }) {
  const s = await prisma.ordemServico.findUnique({ where: { numero }, include: incluirOs });
  const ok = s && ((ident.acesso?.recurso === 'os' && ident.acesso.id === s.id) || (ident.cliente && ident.cliente.id === s.clienteId));
  if (!s || !ok) throw new HttpError(401, 'Informe o telefone usado na solicitação para ver os detalhes.', { precisaTelefone: true });
  return s;
}

export async function verOsCliente(numero: number, ident: { acesso?: AcessoPayload; cliente?: ClientePayload }) {
  return { service: osFront(await osLiberada(numero, ident)) };
}

// Cliente aprova ou recusa o orcamento pelo acompanhamento.
// Aprovado: segue para "Em reparo". Recusado: a OS e cancelada e o aparelho fica para retirada.
export async function decidirOrcamento(numero: number, body: unknown, ident: { acesso?: AcessoPayload; cliente?: ClientePayload }) {
  const d = z.object({ decisao: z.enum(['aprovar', 'recusar']) }).parse(body);
  const s = await osLiberada(numero, ident);
  if (s.orcamentoValor == null) throw conflito('Esta solicitação ainda não tem orçamento.');
  if (s.status !== 'orcamento') throw conflito('O orçamento desta solicitação não está aguardando aprovação.');
  if (s.orcamentoDecisao) throw conflito('Este orçamento já foi respondido.');
  const aprovado = d.decisao === 'aprovar';
  const status = aprovado ? 'reparo' : 'cancelado';
  const atualizada = await prisma.$transaction(async (tx) => {
    // Condicional: duas respostas ao mesmo tempo nao passam as duas.
    const r = await tx.ordemServico.updateMany({
      where: { id: s.id, status: 'orcamento', orcamentoDecisao: null },
      data: { orcamentoDecisao: aprovado ? 'aprovado' : 'recusado', orcamentoDecididoEm: new Date(), status },
    });
    if (r.count !== 1) throw conflito('Este orçamento já foi respondido.');
    await tx.osHistorico.create({
      data: { osId: s.id, status, autor: 'cliente', observacao: aprovado ? 'Orçamento aprovado pelo cliente' : 'Orçamento recusado pelo cliente. Aparelho disponível para retirada.' },
    });
    return tx.ordemServico.findUniqueOrThrow({ where: { id: s.id }, include: incluirOs });
  });
  return { service: osFront(atualizada) };
}

/* ---------- gestao ---------- */

export async function listar(q: { status?: string; unidade?: string; busca?: string }) {
  const where: Prisma.OrdemServicoWhereInput = {};
  if (q.unidade && q.unidade !== 'all') where.unidadeId = q.unidade;
  if (q.status === 'open') where.status = { in: [...SVC_OPEN] };
  else if (q.status && q.status !== 'all') where.status = q.status;
  const busca = String(q.busca || '').trim();
  if (busca) {
    const n = Number(busca.replace(/\D/g, ''));
    where.OR = [
      { cliente: { nome: { contains: busca, mode: 'insensitive' } } },
      { modelo: { contains: busca, mode: 'insensitive' } },
      ...(Number.isFinite(n) && n > 0 ? [{ numero: n }] : []),
    ];
  }
  const lista = await prisma.ordemServico.findMany({ where, include: incluirOs, orderBy: { criadoEm: 'desc' }, take: 500 });
  return { services: lista.map(osFront) };
}

export async function detalhe(numero: number) {
  const s = await prisma.ordemServico.findUnique({ where: { numero }, include: incluirOs });
  if (!s) throw naoEncontrado('Solicitação não encontrada.');
  return { service: osFront(s) };
}

export async function alterarStatus(numero: number, body: unknown, usuarioId: string) {
  const d = z.object({ status: z.enum(SVC_STATUS), observacao: z.string().trim().max(300).optional() }).parse(body);
  const s = await prisma.ordemServico.findUnique({ where: { numero } });
  if (!s) throw naoEncontrado('Solicitação não encontrada.');
  if (s.status !== d.status) {
    await prisma.$transaction([
      prisma.ordemServico.update({ where: { id: s.id }, data: { status: d.status } }),
      prisma.osHistorico.create({ data: { osId: s.id, status: d.status, autor: 'equipe', usuarioId, observacao: d.observacao || null } }),
    ]);
  }
  return detalhe(numero);
}

export async function registrarOrcamento(numero: number, body: unknown, usuarioId: string) {
  const d = z.object({ valor: z.coerce.number().positive('informe um valor maior que zero').max(100000), observacao: z.string().trim().max(500).optional() }).parse(body);
  const s = await prisma.ordemServico.findUnique({ where: { numero } });
  if (!s) throw naoEncontrado('Solicitação não encontrada.');
  if (s.status === 'concluido' || s.status === 'cancelado') throw conflito('Não é possível registrar orçamento numa solicitação encerrada.');
  const mover = ANTES_DO_ORCAMENTO.has(s.status);
  await prisma.$transaction(async (tx) => {
    // Novo valor = nova resposta do cliente.
    await tx.ordemServico.update({
      where: { id: s.id },
      data: {
        orcamentoValor: Math.round(d.valor * 100) / 100,
        orcamentoObs: d.observacao || null,
        orcamentoEm: new Date(),
        orcamentoDecisao: null,
        orcamentoDecididoEm: null,
        status: mover ? 'orcamento' : undefined,
      },
    });
    if (mover) await tx.osHistorico.create({ data: { osId: s.id, status: 'orcamento', autor: 'equipe', usuarioId, observacao: 'Orçamento registrado' } });
  });
  return detalhe(numero);
}
