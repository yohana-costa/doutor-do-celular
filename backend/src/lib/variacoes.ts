// Regras de variacao de produto, iguais as do front (src/js/data.js):
// variacoes = produto cartesiano das opcoes, menos as combinacoes em "exclude".

export interface ValorOpcao {
  v: string;
  d?: number; // acrescimo sobre o preco base (negativo = desconto)
  hex?: string;
}
export interface Opcao {
  name: string;
  type: 'color' | 'pill';
  values: ValorOpcao[];
}
export type Selecao = Record<string, string>;

export const COMPAT = 'Compatível com';

export function combinacoes(opcoes: Opcao[], exclusoes: Selecao[]): Selecao[] {
  let combos: Selecao[] = [{}];
  for (const o of opcoes) {
    const next: Selecao[] = [];
    for (const c of combos) for (const v of o.values) next.push({ ...c, [o.name]: v.v });
    combos = next;
  }
  return combos.filter(
    (c) => !exclusoes.some((ex) => Object.keys(ex).length > 0 && Object.keys(ex).every((k) => c[k] === ex[k])),
  );
}

export function chaveDe(opcoes: Opcao[], sel: Selecao): string {
  return opcoes.map((o) => sel[o.name]).join('|') || 'unico';
}

export function selecaoDaChave(opcoes: Opcao[], chave: string): Selecao {
  const partes = chave.split('|');
  const s: Selecao = {};
  opcoes.forEach((o, i) => (s[o.name] = partes[i]));
  return s;
}

export function precoDe(base: number, opcoes: Opcao[], sel: Selecao): number {
  let v = base;
  for (const o of opcoes) {
    const f = o.values.find((x) => x.v === sel[o.name]);
    if (f && f.d) v += Number(f.d);
  }
  return Math.round(v * 100) / 100;
}

// Rotulo exibido no pedido: so as opcoes que o cliente realmente escolheu.
export function rotuloDe(opcoes: Opcao[], sel: Selecao): string {
  return opcoes
    .filter((o) => o.values.length > 1 || o.name === COMPAT || o.name === 'Cor')
    .map((o) => sel[o.name])
    .filter(Boolean)
    .join(' · ');
}

export function skuDe(codigo: string, opcoes: Opcao[], sel: Selecao): string {
  const ab = (s: string) =>
    String(s)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
  const partes = opcoes.filter((o) => o.values.length > 1).map((o) => ab(sel[o.name]));
  return [codigo, ...partes].join('-');
}
