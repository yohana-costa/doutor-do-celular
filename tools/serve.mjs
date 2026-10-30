#!/usr/bin/env node
/*
 * Servidor local do front, sem dependências. Serve os arquivos estáticos e repassa
 * /api e /uploads para o backend (npm run dev:api), imitando o mesmo domínio da Vercel.
 *
 * Uso:  node tools/serve.mjs   (ou: npm run dev)  ->  http://localhost:8093
 * Variáveis: PORT (padrão 8093), BACKEND_URL (padrão http://localhost:3342), DIR (pasta servida; padrão raiz do projeto, use DIR=dist para testar o build).
 */
import { createServer, request } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, normalize, extname, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'), process.env.DIR || '.');
const PORT = Number(process.env.PORT) || 8093;
const BACKEND = new URL(process.env.BACKEND_URL || 'http://localhost:3342');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

function proxy(req, res) {
  const up = request({ hostname: BACKEND.hostname, port: BACKEND.port, path: req.url, method: req.method, headers: { ...req.headers, host: BACKEND.host } }, r => {
    res.writeHead(r.statusCode || 502, r.headers);
    r.pipe(res);
  });
  up.on('error', () => { if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: 'Backend fora do ar. Rode npm run dev:api.' })); });
  req.pipe(up);
}

createServer(async (req, res) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/uploads/')) return proxy(req, res);
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT + sep) && file !== ROOT) { res.writeHead(403).end('Proibido'); return; }
    if (!(await stat(file)).isFile()) throw new Error('não é arquivo');
    res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
  }
}).listen(PORT, () => console.log(`Front em http://localhost:${PORT} (API em ${BACKEND.origin})`));
