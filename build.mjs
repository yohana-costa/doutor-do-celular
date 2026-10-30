#!/usr/bin/env node
/*
 * Gera o front estático em dist/ (o que a Vercel publica):
 *   dist/index.html, dist/src/** (CSS e JS) e dist/assets/** (imagens e fontes).
 * Cada CSS/JS recebe ?v=<hash do conteúdo> no index.html, para o navegador
 * buscar a versão nova a cada deploy sem precisar de recarregamento forçado.
 *
 * Uso:  node build.mjs   (ou: npm run build). Requer apenas Node.js 18+.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = join(ROOT, 'dist');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'src'), join(OUT, 'src'), { recursive: true });
cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });

const hash = p => createHash('sha1').update(readFileSync(join(ROOT, p))).digest('hex').slice(0, 10);
let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
html = html.replace(/(href|src)="(src\/[^"?]+\.(?:css|js))"/g, (_, attr, p) => {
  if (!existsSync(join(ROOT, p))) throw new Error(`Arquivo não encontrado: ${p}`);
  return `${attr}="${p}?v=${hash(p)}"`;
});
html = html.replace(/<!--[\s\S]*?-->\n?/g, '');
writeFileSync(join(OUT, 'index.html'), html);
console.log(`ok: dist/ gerado (${html.length} bytes no index.html)`);
