import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { invalido } from '../lib/http';

// Envolve o handler async: o resultado vira JSON e qualquer erro segue para o errorHandler.
export const h =
  (fn: (req: AuthRequest, res: Response) => Promise<unknown>, status = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const r = await fn(req as AuthRequest, res);
      if (!res.headersSent) res.status(status).json(r);
    } catch (err) {
      next(err);
    }
  };

// Numero de pedido/OS na URL: aceita "1001", "PED-1001" ou "OS-2001".
export function numeroDe(v: string): number {
  const n = Number(String(v).replace(/\D/g, ''));
  if (!Number.isInteger(n) || n <= 0) throw invalido('Número inválido.');
  return n;
}
