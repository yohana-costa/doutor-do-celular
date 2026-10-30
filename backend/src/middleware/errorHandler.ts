import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { config } from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  const status = Number(err?.status || err?.statusCode || 500);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'A imagem passa do limite de 4 MB.' });
    return res.status(400).json({ error: 'Erro no envio do arquivo.', details: { code: err.code } });
  }

  if (err instanceof ZodError || err?.name === 'ZodError') {
    const primeiro = err.errors?.[0];
    const campo = primeiro?.path?.join('.');
    return res.status(400).json({
      error: primeiro ? `Dados inválidos${campo ? ` em "${campo}"` : ''}: ${primeiro.message}` : 'Dados inválidos.',
      details: err.errors,
    });
  }

  if (err?.code === 'P2002') return res.status(409).json({ error: 'Já existe um registro com esses dados.' });
  if (err?.code === 'P2025') return res.status(404).json({ error: 'Registro não encontrado.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });

  if (status >= 500) {
    console.error('[ERROR]', { method: req.method, path: req.originalUrl, name: err?.name, code: err?.code, message: err?.message, stack: err?.stack });
  }
  const message = status >= 500 && config.emProducao ? 'Erro interno do servidor.' : err?.message || 'Erro interno do servidor.';
  return res.status(status).json({ error: message, ...(err?.details && status < 500 ? { details: err.details } : {}) });
}
