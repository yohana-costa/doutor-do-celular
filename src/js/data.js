/* ============ Dados de referência e regras de variação ============
   Unidades, categorias, serviços e produtos vêm da API (GET /api/loja/catalogo).
   As listas abaixo começam vazias e são preenchidas no carregamento (mesma referência). */
const UNITS = [];
const unitName = id => (UNITS.find(u => u.id === id) || {}).name || 'Unidade';

const GROUPS = {
  celulares: { label: 'Celulares', title: 'Celulares para o seu', titleHl: 'próximo nível.' },
  acessorios: { label: 'Acessórios', title: 'Acessórios para o seu dia.', titleHl: '' },
  assistencia: { label: 'Assistência', title: 'Assistência para o seu aparelho.', titleHl: '' },
};
const SUBS = [];
const subLabel = id => (SUBS.find(s => s.id === id) || {}).label || id;
const PHONE_BRANDS = ['Apple', 'Samsung', 'Motorola', 'Xiaomi'];
const COMPAT_FAMS = ['iPhone', 'Samsung Galaxy', 'Motorola', 'Xiaomi', 'Universal'];
const MODEL_FAM = { 'iPhone 16': 'iPhone', 'iPhone 15': 'iPhone', 'iPhone 13': 'iPhone', 'Galaxy S24 FE': 'Samsung Galaxy', 'Galaxy A55 5G': 'Samsung Galaxy', 'Galaxy A15': 'Samsung Galaxy', 'Moto G84 5G': 'Motorola', 'Redmi Note 13': 'Xiaomi' };

const COLOR_HEX = {
  'Preto': '#26272b', 'Branco': '#ecebe7', 'Rosa': '#f0c6d0', 'Ultramarino': '#6a78d8', 'Verde-acinzentado': '#b3c2b0',
  'Azul': '#a9c6dd', 'Verde': '#c8d8c2', 'Meia-noite': '#262b33', 'Estelar': '#ebe4d8', 'Grafite': '#3b3d42', 'Menta': '#bfe2cf',
  'Azul-escuro': '#2c3a5c', 'Gelo': '#e3e9ec', 'Lilás': '#c7b6e2', 'Azul-claro': '#b8d3e6', 'Magenta': '#a3214f', 'Azul-gelo': '#c9dde8',
  'Amarelo': '#ffc800', 'Cinza': '#8e9198', 'Prata': '#c9ccd1', 'Transparente': '#e8edf2', 'Azul-marinho': '#22304d',
  'Verde-menta': '#a8dcc3', 'Areia': '#d8c6a4', 'Vermelho': '#c8332f', 'Laranja': '#f08a24',
};

const ALL_MODELS = ['iPhone 16', 'iPhone 15', 'iPhone 13', 'Galaxy S24 FE', 'Galaxy A55 5G', 'Galaxy A15', 'Moto G84 5G', 'Redmi Note 13'];
const opt = (name, values, type) => ({ name, type: type || (name === 'Cor' ? 'color' : 'pill'), values: values.map(v => typeof v === 'string' ? { v } : v) });
const COMPAT = 'Compatível com';

const SERVICES = [];
const svcByName = n => SERVICES.find(s => s.name === n);

const ORDER_STATUS = [
  { id: 'recebido', label: 'Recebido', tone: 'info' },
  { id: 'aguardando', label: 'Aguardando confirmação', tone: 'warn' },
  { id: 'confirmado', label: 'Confirmado', tone: 'info' },
  { id: 'separacao', label: 'Em separação', tone: 'info' },
  { id: 'pronto', label: 'Pronto para retirada', tone: 'go' },
  { id: 'concluido', label: 'Concluído', tone: 'ok' },
  { id: 'cancelado', label: 'Cancelado', tone: 'bad' },
];
const STOCK_APPLIED = new Set(['confirmado', 'separacao', 'pronto', 'concluido']);
const ORDER_OPEN = new Set(['recebido', 'aguardando', 'confirmado', 'separacao', 'pronto']);
const SVC_STATUS = [
  { id: 'recebida', label: 'Solicitação recebida', tone: 'info' },
  { id: 'avaliacao', label: 'Aguardando avaliação', tone: 'warn' },
  { id: 'diagnostico', label: 'Em diagnóstico', tone: 'info' },
  { id: 'orcamento', label: 'Aguardando aprovação do orçamento', tone: 'warn' },
  { id: 'reparo', label: 'Em reparo', tone: 'info' },
  { id: 'retirada', label: 'Aguardando retirada', tone: 'go' },
  { id: 'concluido', label: 'Concluído', tone: 'ok' },
  { id: 'cancelado', label: 'Cancelado', tone: 'bad' },
];
const SVC_OPEN = new Set(['recebida', 'avaliacao', 'diagnostico', 'orcamento', 'reparo', 'retirada']);

/* ---------- variantes ---------- */
function variantsOf(p) {
  let combos = [{}];
  (p.options || []).forEach(o => {
    const next = [];
    combos.forEach(c => o.values.forEach(v => next.push({ ...c, [o.name]: v.v })));
    combos = next;
  });
  return combos.filter(c => !(p.exclude || []).some(ex => Object.keys(ex).every(k => c[k] === ex[k])));
}
const vkeyOf = (p, sel) => (p.options || []).map(o => sel[o.name]).join('|') || 'unico';
function selFromKey(p, key) { const parts = key.split('|'); const s = {}; (p.options || []).forEach((o, i) => s[o.name] = parts[i]); return s; }
function variantLabel(p, sel) { return (p.options || []).filter(o => o.values.length > 1 || o.name === COMPAT || o.name === 'Cor').map(o => sel[o.name]).filter(Boolean).join(' · '); }
function variantPrice(p, sel) {
  let v = p.price;
  (p.options || []).forEach(o => { const f = o.values.find(x => x.v === sel[o.name]); if (f && f.d) v += f.d; });
  return Math.round(v * 100) / 100;
}
function colorHex(p, name) {
  const o = (p.options || []).find(o => o.name === 'Cor');
  const f = o && o.values.find(v => v.v === name);
  return (f && f.hex) || COLOR_HEX[name] || '#3b3d42';
}
function skuOf(p, sel) {
  const ab = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
  const parts = (p.options || []).filter(o => o.values.length > 1).map(o => ab(sel[o.name]));
  return [p.code, ...parts].join('-');
}
