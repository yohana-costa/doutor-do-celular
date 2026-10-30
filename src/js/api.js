/* ============ Comunicação com a API ============
   A API fica no mesmo domínio, em /api (na Vercel, função serverless; no desenvolvimento,
   tools/serve.mjs repassa /api e /uploads para o backend local).
   Para apontar para outro endereço, defina window.KC_CONFIG = { apiBase: 'https://...' } antes deste arquivo. */
const KC = Object.assign({ apiBase: '' }, window.KC_CONFIG || {});
const API_BASE = String(KC.apiBase || '').replace(/\/$/, '');

/* armazenamento local tolerante (modo privado, bloqueio de cookies etc.) */
const LS = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } },
};
const TOKENS = {
  equipe: () => LS.get('kc-equipe', null),          // { token, user }
  cliente: () => LS.get('kc-cliente', null),        // { token, customer }
  acessos: () => LS.get('kc-acessos', {}),          // { 'PED-1001': token, 'OS-2001': token }
};
function guardarAcesso(codigo, token) { const a = TOKENS.acessos(); a[codigo] = token; LS.set('kc-acessos', a); }
function esquecerAcesso(codigo) { const a = TOKENS.acessos(); delete a[codigo]; LS.set('kc-acessos', a); }

class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status = status; this.details = details || {}; }
}

/* fetch com JSON, token e mensagens de erro em português.
   auth: 'equipe' | 'cliente' | null. acesso: token de acesso a pedido/OS (header X-Acesso). */
async function api(path, { method = 'GET', body, auth = null, acesso = null, form = null } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const t = auth === 'equipe' ? TOKENS.equipe() : auth === 'cliente' ? TOKENS.cliente() : null;
  if (t && t.token) headers.Authorization = 'Bearer ' + t.token;
  if (acesso) headers['X-Acesso'] = acesso;
  let res;
  try {
    res = await fetch(API_BASE + '/api' + path, { method, headers, body: form || (body !== undefined ? JSON.stringify(body) : undefined) });
  } catch (e) {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique a internet e tente de novo.');
  }
  let data = null;
  if (res.status !== 204) { try { data = await res.json(); } catch (e) { data = null; } }
  if (!res.ok) {
    const msg = (data && data.error) || (res.status >= 500 ? 'O servidor não respondeu como esperado. Tente de novo em instantes.' : 'Não foi possível concluir a operação.');
    if (res.status === 401 && auth === 'equipe') { LS.set('kc-equipe', null); }
    if (res.status === 401 && auth === 'cliente') { LS.set('kc-cliente', null); }
    throw new ApiError(res.status, msg, data && data.details);
  }
  return data;
}

/* Foto vinda do backend: URL completa (Vercel Blob), /uploads/... (dev local) ou /assets/... (catálogo inicial). */
function mediaUrl(u) {
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith('/uploads/')) return API_BASE + u;
  return u.replace(/^\//, '');
}

/* Reduz a foto no navegador antes do envio: até 1600 px, JPEG ~0,82. Mantém o arquivo abaixo do limite da função (4 MB). */
function reduzirImagem(file, max = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { reject(new Error('Use uma imagem JPG, PNG ou WEBP.')); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(b => b ? resolve(new File([b], (file.name || 'foto').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })) : reject(new Error('Não foi possível ler a imagem.')), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível ler a imagem.')); };
    img.src = url;
  });
}
