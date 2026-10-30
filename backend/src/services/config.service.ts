import { z } from 'zod';
import { prisma } from '../lib/prisma';

// Configuracoes gerais da loja, guardadas na tabela configuracoes (chave -> JSON).
export const PADRAO = {
  // Variacao com 1 ate este numero de unidades conta como "estoque baixo".
  estoque_baixo_limite: 3,
  // WhatsApp geral da loja (so digitos com DDD). Cada unidade pode ter o seu.
  whatsapp_geral: '',
  // Texto exibido na opcao de entrega do checkout.
  texto_entrega: 'Área, prazo e valor da entrega são combinados com a loja na confirmação do pedido.',
  // Texto exibido na etapa de pagamento do checkout.
  texto_pagamento: 'O pagamento é combinado com a loja na confirmação do pedido. Nenhum dado de cartão é pedido no site.',
};
export type Config = typeof PADRAO;

export async function lerConfig(): Promise<Config> {
  const linhas = await prisma.configuracao.findMany();
  const c: Config = { ...PADRAO };
  for (const l of linhas) {
    if (l.chave in c) (c as Record<string, unknown>)[l.chave] = l.valor;
  }
  return c;
}

export async function limiteEstoqueBaixo(): Promise<number> {
  const l = await prisma.configuracao.findUnique({ where: { chave: 'estoque_baixo_limite' } });
  const n = Number(l?.valor);
  return Number.isFinite(n) && n >= 0 ? n : PADRAO.estoque_baixo_limite;
}

const schema = z
  .object({
    estoque_baixo_limite: z.coerce.number().int().min(0).max(1000),
    whatsapp_geral: z.string().trim().max(20).transform((s) => s.replace(/\D/g, '')),
    texto_entrega: z.string().trim().max(400),
    texto_pagamento: z.string().trim().max(400),
  })
  .partial();

export async function atualizarConfig(body: unknown): Promise<Config> {
  const dados = schema.parse(body);
  await prisma.$transaction(
    Object.entries(dados).map(([chave, valor]) =>
      prisma.configuracao.upsert({ where: { chave }, create: { chave, valor: valor as never }, update: { valor: valor as never } }),
    ),
  );
  return lerConfig();
}
