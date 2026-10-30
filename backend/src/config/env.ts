import dotenv from 'dotenv';
dotenv.config();

const port = Number(process.env.PORT) || 3342;
const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = process.env.JWT_SECRET || '';
// Na Vercel, VERCEL=1. La o segredo do JWT e obrigatorio: sem ele qualquer um poderia forjar tokens.
const emProducao = nodeEnv === 'production' || process.env.VERCEL === '1';

if (emProducao && jwtSecret.length < 16) {
  throw new Error('JWT_SECRET ausente ou curto demais (mínimo 16 caracteres) em produção.');
}

export const config = {
  port,
  nodeEnv,
  emProducao,
  jwtSecret: jwtSecret || 'doutor-do-celular-dev-secret',
  // Sessao da equipe (gestao).
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Sessao do cliente (Minha conta).
  clienteJwtExpiresIn: process.env.CLIENTE_JWT_EXPIRES_IN || '30d',
  // Acesso a um pedido/OS especifico, entregue depois do checkout ou da consulta por codigo + telefone.
  acessoJwtExpiresIn: process.env.ACESSO_JWT_EXPIRES_IN || '60d',
  // Fotos de produto: com token, vao para o Vercel Blob; sem token (dev local), para a pasta uploads/.
  blobToken: process.env.BLOB_READ_WRITE_TOKEN || '',
  // Na VPS (Docker) as fotos ficam em disco, num volume montado em uploads/.
  uploadsLocal: process.env.UPLOADS_LOCAL === '1',
  // Fuso usado para "hoje" e para as series diarias do dashboard. Brasil sem horario de verao desde 2019.
  fusoHorasUtc: Number(process.env.FUSO_HORAS_UTC ?? -3),
};
