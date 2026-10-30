import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { HttpError, invalido, naoEncontrado } from '../lib/http';
import { incluirProduto, produtoFront, opcoesDe, exclusoesDe } from '../lib/serializar';
import { combinacoes, chaveDe, precoDe, skuDe, Opcao, Selecao } from '../lib/variacoes';
import { lerConfig } from './config.service';
import { removerFotoProduto, salvarFotoProduto } from '../lib/storage';

type Tx = Prisma.TransactionClient;

/* ================= leitura ================= */

export function unidadeFront(u: { id: string; nome: string; nomeCurto: string; endereco: string | null; horario: string | null; whatsapp: string | null; telefone: string | null; ativo: boolean; ordem: number }) {
  return { id: u.id, name: u.nome, short: u.nomeCurto, address: u.endereco || '', hours: u.horario || '', whatsapp: u.whatsapp || '', phone: u.telefone || '', active: u.ativo, order: u.ordem };
}
export function categoriaFront(c: { id: string; nome: string; grupo: string; ordem: number; ativo: boolean }) {
  return { id: c.id, label: c.nome, group: c.grupo, order: c.ordem, active: c.ativo };
}
export function servicoFront(s: { id: string; nome: string; icone: string; descricao: string; ativo: boolean; ordem: number }) {
  return { id: s.id, name: s.nome, icon: s.icone, desc: s.descricao, active: s.ativo, order: s.ordem };
}

// Mapa de estoque no formato do front: { "produtoId|chave|unidade": quantidade }.
export async function mapaEstoque(produtoIds?: string[]) {
  const linhas = await prisma.estoque.findMany({
    where: produtoIds ? { variacao: { produtoId: { in: produtoIds } } } : undefined,
    select: { quantidade: true, unidadeId: true, variacao: { select: { produtoId: true, chave: true, ativo: true } } },
  });
  const mapa: Record<string, number> = {};
  for (const l of linhas) {
    if (!l.variacao.ativo) continue;
    mapa[`${l.variacao.produtoId}|${l.variacao.chave}|${l.unidadeId}`] = l.quantidade;
  }
  return mapa;
}

// Catalogo da loja (publico) ou do painel (inclui inativos).
export async function carregarCatalogo(opts: { gestao?: boolean } = {}) {
  const ativo = opts.gestao ? undefined : true;
  const [unidades, categorias, servicos, produtos, config] = await Promise.all([
    prisma.unidade.findMany({ where: { ativo }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] }),
    prisma.categoria.findMany({ where: { ativo }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] }),
    prisma.servico.findMany({ where: { ativo }, orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] }),
    prisma.produto.findMany({
      where: opts.gestao ? undefined : { ativo: true, categoria: { ativo: true } },
      include: incluirProduto,
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    }),
    lerConfig(),
  ]);
  const estoque = await mapaEstoque(opts.gestao ? undefined : produtos.map((p) => p.id));
  return {
    units: unidades.map(unidadeFront),
    subs: categorias.map(categoriaFront),
    services: servicos.map(servicoFront),
    products: produtos.map((p) => {
      const f = produtoFront(p);
      // Na loja so vao as variacoes ativas.
      if (!opts.gestao) f.variations = f.variations.filter((v) => v.active);
      return f;
    }),
    stock: estoque,
    config: {
      lowStock: config.estoque_baixo_limite,
      whatsapp: config.whatsapp_geral,
      deliveryText: config.texto_entrega,
      paymentText: config.texto_pagamento,
    },
  };
}

export async function buscarProduto(id: string) {
  const p = await prisma.produto.findUnique({ where: { id }, include: incluirProduto });
  if (!p) throw naoEncontrado('Produto não encontrado.');
  return { product: produtoFront(p), stock: await mapaEstoque([p.id]) };
}

/* ================= escrita: produtos ================= */

const valorSchema = z.object({
  v: z.string().trim().min(1, 'valor vazio').max(60),
  d: z.coerce.number().min(-100000).max(100000).optional(),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'cor inválida (use #RRGGBB)')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
const opcaoSchema = z.object({
  name: z.string().trim().min(1, 'nome da opção vazio').max(40),
  type: z.enum(['color', 'pill']).default('pill'),
  values: z.array(valorSchema).min(1, 'cada opção precisa de ao menos um valor').max(40),
});

const produtoSchema = z.object({
  code: z.string().trim().max(30).optional(),
  name: z.string().trim().min(2, 'informe o nome').max(120),
  brand: z.string().trim().max(60).default('Diversas'),
  model: z.string().trim().max(80).default(''),
  sub: z.string().trim().min(1, 'escolha a categoria'),
  price: z.coerce.number().positive('o preço precisa ser maior que zero').max(1000000),
  rank: z.coerce.number().int().min(0).max(9999).optional(),
  isNew: z.boolean().optional(),
  active: z.boolean().optional(),
  desc: z.string().trim().max(4000).default(''),
  tags: z.string().trim().max(500).default(''),
  specs: z.array(z.tuple([z.string().trim().min(1).max(60), z.string().trim().max(200)])).max(30).default([]),
  art: z.record(z.string(), z.string()).optional(),
  compat: z.array(z.string().trim().min(1).max(40)).max(20).nullable().optional(),
  options: z.array(opcaoSchema).max(5).default([]),
  exclude: z.array(z.record(z.string(), z.string())).max(100).default([]),
  // So na criacao: quantidade inicial de cada variacao em cada unidade ativa.
  initialStock: z.coerce.number().int().min(0).max(9999).optional(),
});
const produtoUpdateSchema = produtoSchema.partial().omit({ initialStock: true });

function validarOpcoes(opcoes: Opcao[], exclusoes: Selecao[]) {
  const nomes = new Set<string>();
  for (const o of opcoes) {
    const n = o.name.toLowerCase();
    if (nomes.has(n)) throw invalido(`A opção "${o.name}" aparece duas vezes.`);
    nomes.add(n);
    const vals = new Set<string>();
    for (const v of o.values) {
      if (vals.has(v.v.toLowerCase())) throw invalido(`O valor "${v.v}" aparece duas vezes em "${o.name}".`);
      vals.add(v.v.toLowerCase());
    }
  }
  for (const ex of exclusoes) {
    const ks = Object.keys(ex);
    if (!ks.length) throw invalido('Combinação bloqueada vazia.');
    for (const k of ks) {
      const o = opcoes.find((x) => x.name === k);
      if (!o) throw invalido(`Combinação bloqueada usa a opção "${k}", que não existe.`);
      if (!o.values.some((v) => v.v === ex[k])) throw invalido(`Combinação bloqueada usa "${ex[k]}", que não existe em "${k}".`);
    }
  }
  if (!combinacoes(opcoes, exclusoes).length) throw invalido('As combinações bloqueadas eliminam todas as variações do produto.');
}

// Grava opcoes/valores/exclusoes do zero (sao descritivos) e recalcula as variacoes.
async function gravarOpcoes(tx: Tx, produtoId: string, opcoes: Opcao[], exclusoes: Selecao[]) {
  await tx.produtoOpcao.deleteMany({ where: { produtoId } });
  await tx.produtoExclusao.deleteMany({ where: { produtoId } });
  for (const [i, o] of opcoes.entries()) {
    await tx.produtoOpcao.create({
      data: {
        produtoId,
        nome: o.name,
        tipo: o.type,
        ordem: i,
        valores: { create: o.values.map((v, j) => ({ valor: v.v, acrescimo: v.d || 0, hex: v.hex || null, ordem: j })) },
      },
    });
  }
  if (exclusoes.length) await tx.produtoExclusao.createMany({ data: exclusoes.map((c) => ({ produtoId, combinacao: c })) });
}

// Variacoes = combinacoes validas. Novas sao criadas, as que sumiram ficam inativas
// (o estoque e as movimentacoes continuam apontando para elas), precos e SKUs sao recalculados.
export async function sincronizarVariacoes(tx: Tx, produtoId: string) {
  const p = await tx.produto.findUniqueOrThrow({ where: { id: produtoId }, include: incluirProduto });
  const opcoes = opcoesDe(p);
  const combos = combinacoes(opcoes, exclusoesDe(p));
  const base = Number(p.precoBase);
  const chaves = new Set<string>();
  for (const sel of combos) {
    const chave = chaveDe(opcoes, sel);
    chaves.add(chave);
    const dados = { sku: skuDe(p.codigo, opcoes, sel), preco: precoDe(base, opcoes, sel), ativo: true };
    await tx.produtoVariacao.upsert({ where: { produtoId_chave: { produtoId, chave } }, create: { produtoId, chave, ...dados }, update: dados });
  }
  await tx.produtoVariacao.updateMany({ where: { produtoId, chave: { notIn: [...chaves] } }, data: { ativo: false } });
}

async function gerarCodigo(tx: Tx, categoriaId: string) {
  const prefixo = categoriaId.normalize('NFD').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'PRD';
  for (let n = (await tx.produto.count({ where: { categoriaId } })) + 1; ; n++) {
    const codigo = `${prefixo}-${String(n).padStart(3, '0')}`;
    if (!(await tx.produto.findUnique({ where: { codigo } }))) return codigo;
  }
}

export async function criarProduto(body: unknown, usuarioId: string) {
  const d = produtoSchema.parse(body);
  const opcoes = d.options as Opcao[];
  const exclusoes = d.exclude as Selecao[];
  validarOpcoes(opcoes, exclusoes);
  const cat = await prisma.categoria.findUnique({ where: { id: d.sub } });
  if (!cat) throw invalido('Categoria inexistente.');

  const id = await prisma.$transaction(async (tx) => {
    const codigo = d.code ? d.code.toUpperCase() : await gerarCodigo(tx, d.sub);
    const p = await tx.produto.create({
      data: {
        codigo,
        nome: d.name,
        marca: d.brand || 'Diversas',
        modelo: d.model || d.name,
        categoriaId: d.sub,
        precoBase: d.price,
        ordem: d.rank ?? 100,
        novidade: d.isNew ?? true,
        ativo: d.active ?? true,
        descricao: d.desc,
        tags: d.tags,
        especificacoes: d.specs,
        arte: d.art || {},
        compatibilidade: d.compat === null || d.compat === undefined ? Prisma.DbNull : d.compat,
      },
    });
    await gravarOpcoes(tx, p.id, opcoes, exclusoes);
    await sincronizarVariacoes(tx, p.id);
    // Estoque inicial (opcional): uma movimentacao de ajuste por variacao e unidade.
    if (d.initialStock && d.initialStock > 0) {
      const [variacoes, unidades] = await Promise.all([
        tx.produtoVariacao.findMany({ where: { produtoId: p.id, ativo: true } }),
        tx.unidade.findMany({ where: { ativo: true } }),
      ]);
      for (const v of variacoes)
        for (const u of unidades) {
          await tx.estoque.create({ data: { variacaoId: v.id, unidadeId: u.id, quantidade: d.initialStock } });
          await tx.movimentacaoEstoque.create({
            data: { variacaoId: v.id, unidadeId: u.id, tipo: 'AJUSTE', quantidade: d.initialStock, saldoApos: d.initialStock, motivo: 'Estoque inicial do cadastro', usuarioId },
          });
        }
    }
    return p.id;
  });
  return buscarProduto(id);
}

export async function atualizarProduto(id: string, body: unknown) {
  const d = produtoUpdateSchema.parse(body);
  const atual = await prisma.produto.findUnique({ where: { id }, include: incluirProduto });
  if (!atual) throw naoEncontrado('Produto não encontrado.');
  if (d.sub && !(await prisma.categoria.findUnique({ where: { id: d.sub } }))) throw invalido('Categoria inexistente.');
  const mexeOpcoes = d.options !== undefined || d.exclude !== undefined;
  const opcoes = (d.options as Opcao[] | undefined) ?? opcoesDe(atual);
  const exclusoes = (d.exclude as Selecao[] | undefined) ?? exclusoesDe(atual);
  if (mexeOpcoes) validarOpcoes(opcoes, exclusoes);

  await prisma.$transaction(async (tx) => {
    await tx.produto.update({
      where: { id },
      data: {
        codigo: d.code ? d.code.toUpperCase() : undefined,
        nome: d.name,
        marca: d.brand,
        modelo: d.model,
        categoriaId: d.sub,
        precoBase: d.price,
        ordem: d.rank,
        novidade: d.isNew,
        ativo: d.active,
        descricao: d.desc,
        tags: d.tags,
        especificacoes: d.specs,
        arte: d.art,
        compatibilidade: d.compat === undefined ? undefined : d.compat === null ? Prisma.DbNull : d.compat,
      },
    });
    if (mexeOpcoes) await gravarOpcoes(tx, id, opcoes, exclusoes);
    // Preco base, codigo ou opcoes mudam preco/SKU das variacoes.
    await sincronizarVariacoes(tx, id);
  });
  return buscarProduto(id);
}

export async function definirAtivo(id: string, ativo: boolean) {
  await prisma.produto.update({ where: { id }, data: { ativo } });
  return buscarProduto(id);
}

export async function enviarFoto(id: string, arquivo?: Express.Multer.File) {
  if (!arquivo) throw invalido('Nenhuma imagem enviada (campo "imagem").');
  const p = await prisma.produto.findUnique({ where: { id } });
  if (!p) throw naoEncontrado('Produto não encontrado.');
  const url = await salvarFotoProduto(arquivo.buffer, arquivo.mimetype, id);
  await prisma.produto.update({ where: { id }, data: { imagemUrl: url } });
  await removerFotoProduto(p.imagemUrl);
  return buscarProduto(id);
}

export async function removerFoto(id: string) {
  const p = await prisma.produto.findUnique({ where: { id } });
  if (!p) throw naoEncontrado('Produto não encontrado.');
  await prisma.produto.update({ where: { id }, data: { imagemUrl: null } });
  await removerFotoProduto(p.imagemUrl);
  return buscarProduto(id);
}

/* ================= categorias, unidades e servicos ================= */

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);

const categoriaSchema = z.object({
  label: z.string().trim().min(2).max(40),
  group: z.enum(['celulares', 'acessorios']),
  order: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

export async function criarCategoria(body: unknown) {
  const d = categoriaSchema.parse(body);
  const id = slug(d.label);
  if (!id) throw invalido('Nome de categoria inválido.');
  if (await prisma.categoria.findUnique({ where: { id } })) throw new HttpError(409, 'Já existe uma categoria com esse nome.');
  const c = await prisma.categoria.create({ data: { id, nome: d.label, grupo: d.group, ordem: d.order ?? 50, ativo: d.active ?? true } });
  return categoriaFront(c);
}

export async function atualizarCategoria(id: string, body: unknown) {
  const d = categoriaSchema.partial().parse(body);
  const c = await prisma.categoria.update({ where: { id }, data: { nome: d.label, grupo: d.group, ordem: d.order, ativo: d.active } });
  return categoriaFront(c);
}

const unidadeSchema = z.object({
  name: z.string().trim().min(2).max(60),
  short: z.string().trim().min(2).max(20),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(200),
  whatsapp: z.string().trim().max(20).transform((s) => s.replace(/\D/g, '')),
  phone: z.string().trim().max(20),
  active: z.boolean(),
  order: z.coerce.number().int().min(0).max(99),
});

export async function atualizarUnidade(id: string, body: unknown) {
  const d = unidadeSchema.partial().parse(body);
  if (d.whatsapp && !/^\d{10,13}$/.test(d.whatsapp)) throw invalido('WhatsApp inválido. Use DDD e número.');
  if (d.active === false) {
    const outras = await prisma.unidade.count({ where: { ativo: true, id: { not: id } } });
    if (!outras) throw invalido('A loja precisa de ao menos uma unidade ativa.');
  }
  const u = await prisma.unidade.update({
    where: { id },
    data: { nome: d.name, nomeCurto: d.short, endereco: d.address, horario: d.hours, whatsapp: d.whatsapp, telefone: d.phone, ativo: d.active, ordem: d.order },
  });
  return unidadeFront(u);
}

export async function criarUnidade(body: unknown) {
  const d = unidadeSchema.partial({ address: true, hours: true, whatsapp: true, phone: true, active: true, order: true }).parse(body);
  const id = slug(d.name);
  if (await prisma.unidade.findUnique({ where: { id } })) throw new HttpError(409, 'Já existe uma unidade com esse nome.');
  const u = await prisma.unidade.create({
    data: { id, nome: d.name, nomeCurto: d.short, endereco: d.address, horario: d.hours, whatsapp: d.whatsapp, telefone: d.phone, ativo: d.active ?? true, ordem: d.order ?? 10 },
  });
  return unidadeFront(u);
}

const servicoSchema = z.object({
  name: z.string().trim().min(2).max(60),
  icon: z.string().trim().max(20).optional(),
  desc: z.string().trim().max(400).optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
});

export async function criarServico(body: unknown) {
  const d = servicoSchema.parse(body);
  const s = await prisma.servico.create({ data: { id: slug(d.name), nome: d.name, icone: d.icon || 'tool', descricao: d.desc || '', ativo: d.active ?? true, ordem: d.order ?? 50 } });
  return servicoFront(s);
}

export async function atualizarServico(id: string, body: unknown) {
  const d = servicoSchema.partial().parse(body);
  const s = await prisma.servico.update({ where: { id }, data: { nome: d.name, icone: d.icon, descricao: d.desc, ativo: d.active, ordem: d.order } });
  return servicoFront(s);
}
