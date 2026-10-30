import fs from 'fs';
import path from 'path';
import { put, del } from '@vercel/blob';
import { config } from '../config/env';

// Pasta usada so no desenvolvimento local (sem BLOB_READ_WRITE_TOKEN). Em producao
// a funcao serverless nao tem disco persistente: as fotos vao para o Vercel Blob.
export const uploadsDir = path.resolve(process.cwd(), 'uploads');

const EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// Grava a foto e devolve a URL que fica no banco (URL completa do Blob, ou /uploads/... no dev).
export async function salvarFotoProduto(buffer: Buffer, mimetype: string, produtoId: string): Promise<string> {
  const ext = EXT[mimetype] || '.jpg';
  const nome = `produtos/${produtoId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  if (config.blobToken) {
    const blob = await put(nome, buffer, { access: 'public', contentType: mimetype, token: config.blobToken });
    return blob.url;
  }
  if (config.emProducao) throw Object.assign(new Error('Armazenamento de fotos não configurado (BLOB_READ_WRITE_TOKEN).'), { status: 503 });
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const arquivo = path.basename(nome);
  await fs.promises.writeFile(path.join(uploadsDir, arquivo), buffer);
  return `/uploads/${arquivo}`;
}

// Remove uma foto enviada pelo painel. Fotos iniciais do catalogo (assets/...) nunca sao apagadas.
export async function removerFotoProduto(url?: string | null) {
  if (!url) return;
  try {
    if (/^https:\/\/.+\.blob\.vercel-storage\.com\//.test(url) && config.blobToken) {
      await del(url, { token: config.blobToken });
    } else if (url.startsWith('/uploads/')) {
      await fs.promises.unlink(path.join(uploadsDir, path.basename(url)));
    }
  } catch (e) {
    console.warn('[fotos] não foi possível remover', url, (e as Error).message);
  }
}
