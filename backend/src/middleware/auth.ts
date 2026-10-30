import { Request, Response, NextFunction } from 'express';
import { verifyEquipe, verifyCliente, verifyAcesso, EquipePayload, ClientePayload, AcessoPayload } from '../lib/jwt';

export interface AuthRequest extends Request {
  user?: EquipePayload;
  cliente?: ClientePayload;
  acesso?: AcessoPayload;
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Equipe da loja (gestao).
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Faça login para continuar.' });
  try {
    req.user = verifyEquipe(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Entre de novo.' });
  }
}

const exigirPerfil = (perfis: string[], msg: string) => (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!perfis.includes(req.user?.perfil || '')) return res.status(403).json({ error: msg });
  next();
};
export const requireAdmin = exigirPerfil(['ADMIN'], 'Acesso restrito a administradores.');
export const requireGerente = exigirPerfil(['ADMIN', 'GERENTE'], 'Acesso restrito a gerentes e administradores.');

// Cliente logado em "Minha conta" (obrigatorio).
export function clienteAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'Entre na sua conta para continuar.' });
  try {
    req.cliente = verifyCliente(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Sessão expirada. Entre de novo.' });
  }
}

// Rotas publicas da loja: aceita (sem exigir) o token do cliente e o token de acesso
// a um pedido/OS (header X-Acesso). Quem decide se basta e o service.
export function identificacaoOpcional(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = bearer(req);
  if (token) {
    try {
      req.cliente = verifyCliente(token);
    } catch {
      /* token de cliente invalido: segue como visitante */
    }
  }
  const acesso = req.headers['x-acesso'];
  if (typeof acesso === 'string' && acesso) {
    try {
      req.acesso = verifyAcesso(acesso);
    } catch {
      /* ignorado */
    }
  }
  next();
}
