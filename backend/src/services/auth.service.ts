import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signEquipe } from '../lib/jwt';
import { HttpError, conflito, invalido, naoEncontrado } from '../lib/http';

const PERFIS = ['ADMIN', 'GERENTE', 'OPERADOR'] as const;

const usuarioFront = (u: { id: string; nome: string; email: string; perfil: string; ativo: boolean; criadoEm: Date }) => ({
  id: u.id,
  nome: u.nome,
  email: u.email,
  perfil: u.perfil,
  ativo: u.ativo,
  criadoEm: u.criadoEm.getTime(),
});

export async function login(body: unknown) {
  const d = z.object({ email: z.string().trim().toLowerCase().email('e-mail inválido'), senha: z.string().min(1, 'informe a senha') }).parse(body);
  const u = await prisma.usuario.findUnique({ where: { email: d.email } });
  if (!u || !(await bcrypt.compare(d.senha, u.senha))) throw new HttpError(401, 'E-mail ou senha incorretos.');
  if (!u.ativo) throw new HttpError(403, 'Usuário inativo. Fale com um administrador.');
  const token = signEquipe({ id: u.id, email: u.email, perfil: u.perfil, nome: u.nome });
  return { token, user: usuarioFront(u) };
}

export async function me(id: string) {
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u || !u.ativo) throw new HttpError(401, 'Sessão inválida. Entre de novo.');
  return usuarioFront(u);
}

export async function trocarSenha(id: string, body: unknown) {
  const d = z.object({ senhaAtual: z.string().min(1), novaSenha: z.string().min(6, 'a nova senha precisa de ao menos 6 caracteres').max(72) }).parse(body);
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u || !(await bcrypt.compare(d.senhaAtual, u.senha))) throw new HttpError(401, 'Senha atual incorreta.');
  await prisma.usuario.update({ where: { id }, data: { senha: await bcrypt.hash(d.novaSenha, 10) } });
  return { ok: true };
}

/* ---------- equipe (somente ADMIN) ---------- */

export async function listarUsuarios() {
  const us = await prisma.usuario.findMany({ orderBy: { nome: 'asc' } });
  return us.map(usuarioFront);
}

export async function criarUsuario(body: unknown) {
  const d = z
    .object({
      nome: z.string().trim().min(2).max(80),
      email: z.string().trim().toLowerCase().email(),
      senha: z.string().min(6, 'a senha precisa de ao menos 6 caracteres').max(72),
      perfil: z.enum(PERFIS),
    })
    .parse(body);
  if (await prisma.usuario.findUnique({ where: { email: d.email } })) throw conflito('Já existe um usuário com esse e-mail.');
  const u = await prisma.usuario.create({ data: { ...d, senha: await bcrypt.hash(d.senha, 10) } });
  return usuarioFront(u);
}

export async function atualizarUsuario(id: string, body: unknown, quemPediu: string) {
  const d = z
    .object({
      nome: z.string().trim().min(2).max(80).optional(),
      perfil: z.enum(PERFIS).optional(),
      ativo: z.boolean().optional(),
      senha: z.string().min(6).max(72).optional(),
    })
    .parse(body);
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) throw naoEncontrado('Usuário não encontrado.');
  // Nao deixa a loja sem nenhum administrador ativo.
  const deixaDeSerAdmin = u.perfil === 'ADMIN' && u.ativo && (d.ativo === false || (d.perfil && d.perfil !== 'ADMIN'));
  if (deixaDeSerAdmin && (await prisma.usuario.count({ where: { perfil: 'ADMIN', ativo: true } })) <= 1) {
    throw invalido('É preciso manter ao menos um administrador ativo.');
  }
  if (id === quemPediu && d.ativo === false) throw invalido('Você não pode desativar o próprio usuário.');
  const r = await prisma.usuario.update({
    where: { id },
    data: { nome: d.nome, perfil: d.perfil, ativo: d.ativo, senha: d.senha ? await bcrypt.hash(d.senha, 10) : undefined },
  });
  return usuarioFront(r);
}
