#!/usr/bin/env node
/*
 * Gera dist/Doutor-do-Celular-Prototipo-SMG.html: um único arquivo, sem dependências externas,
 * com CSS, JavaScript, imagens e fontes embutidos. Funciona aberto direto do computador (file://).
 *
 * Uso:  node build.mjs            (ou: npm run build)
 * Requer apenas Node.js 18+. Nenhum pacote npm é necessário.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(ROOT, 'dist');
const OUT_FILE = join(OUT_DIR, 'Doutor-do-Celular-Prototipo-SMG.html');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const read = p => readFileSync(join(ROOT, p), 'utf8');
function dataUri(absPath) {
  if (!existsSync(absPath)) throw new Error(`Arquivo não encontrado: ${absPath}`);
  const mime = MIME[extname(absPath).toLowerCase()];
  if (!mime) throw new Error(`Tipo de arquivo não suportado: ${absPath}`);
  return `data:${mime};base64,${readFileSync(absPath).toString('base64')}`;
}

/* Troca url('...') de um CSS pelos arquivos embutidos (caminhos relativos ao próprio CSS). */
function inlineCssUrls(css, cssPath) {
  const base = dirname(join(ROOT, cssPath));
  return css.replace(/url\((['"]?)(?!data:|https?:|#)([^'")]+)\1\)/g, (_, q, rel) => `url(${dataUri(resolve(base, rel))})`);
}
/* Troca os caminhos de assets/img/... dentro de assets.js pelas imagens embutidas. */
function inlineAssetPaths(js) {
  return js.replace(/(['"])(assets\/img\/[^'"]+)\1/g, (_, q, rel) => `${q}${dataUri(join(ROOT, rel))}${q}`);
}

let html = read('index.html');

/* <link rel="stylesheet" href="..."> → <style>...</style> */
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => `<style>\n${inlineCssUrls(read(href), href)}\n</style>`);

/* <script src="..."></script> → um único <script> com todos os arquivos, na mesma ordem */
const scripts = [];
html = html.replace(/<script src="([^"]+)"><\/script>\n?/g, (_, src) => {
  let js = read(src);
  if (src.endsWith('assets.js')) js = inlineAssetPaths(js);
  if (/<\/script/i.test(js)) throw new Error(`${src} contém "</script", o que quebraria o HTML embutido.`);
  scripts.push(`/* ===== ${src} ===== */\n${js}`);
  return scripts.length === 1 ? '%%SCRIPTS%%\n' : '';
});
html = html.replace('%%SCRIPTS%%', () => `<script>\n${scripts.join('\n')}\n</script>`);

/* Ícones da aba e do iPhone */
html = html.replace(/(<link rel="(?:icon|apple-touch-icon)"[^>]*href=")([^"]+)(")/g, (_, a, href, b) => `${a}${dataUri(join(ROOT, href))}${b}`);

/* Remove comentários HTML de desenvolvimento */
html = html.replace(/<!--[\s\S]*?-->\n?/g, '');

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html);
console.log(`✔ ${OUT_FILE.replace(ROOT + '/', '')} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`);
