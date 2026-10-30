import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Tres tipos de token, todos com o campo "tipo" para que um nao sirva no lugar do outro.
export interface EquipePayload {
  tipo: 'equipe';
  id: string;
  email: string;
  perfil: string;
  nome: string;
}
export interface ClientePayload {
  tipo: 'cliente';
  id: string;
  nome: string;
}
export interface AcessoPayload {
  tipo: 'acesso';
  recurso: 'pedido' | 'os';
  id: string;
  numero: number;
}

function assinar(payload: object, expiresIn: string): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn } as jwt.SignOptions);
}

function verificar<T extends { tipo: string }>(token: string, tipo: T['tipo']): T {
  const p = jwt.verify(token, config.jwtSecret) as unknown as T;
  if (!p || p.tipo !== tipo) throw new Error('Tipo de token inválido.');
  return p;
}

export const signEquipe = (p: Omit<EquipePayload, 'tipo'>) => assinar({ ...p, tipo: 'equipe' }, config.jwtExpiresIn);
export const signCliente = (p: Omit<ClientePayload, 'tipo'>) => assinar({ ...p, tipo: 'cliente' }, config.clienteJwtExpiresIn);
export const signAcesso = (p: Omit<AcessoPayload, 'tipo'>) => assinar({ ...p, tipo: 'acesso' }, config.acessoJwtExpiresIn);

export const verifyEquipe = (t: string) => verificar<EquipePayload>(t, 'equipe');
export const verifyCliente = (t: string) => verificar<ClientePayload>(t, 'cliente');
export const verifyAcesso = (t: string) => verificar<AcessoPayload>(t, 'acesso');
