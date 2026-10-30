// Telefone e a identidade do cliente: guardamos apenas digitos, com DDD (10 ou 11).
export function soDigitos(v: unknown): string {
  return String(v ?? '').replace(/\D/g, '');
}

export function normalizarTelefone(v: unknown): string {
  let d = soDigitos(v);
  // Aceita +55 na frente.
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
  return d;
}

export function telefoneValido(d: string): boolean {
  return d.length === 10 || d.length === 11;
}

export function formatarTelefone(d: string): string {
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return d;
}
