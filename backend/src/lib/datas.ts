import { config } from '../config/env';

// Datas de calendario no fuso da loja (America/Sao_Paulo, UTC-3 fixo).
const OFFSET_MS = config.fusoHorasUtc * 3600e3;
export const DIA_MS = 864e5;

// Inicio do dia (00:00 no fuso da loja) do instante informado, como Date em UTC.
export function inicioDoDia(t: number | Date): Date {
  const ms = typeof t === 'number' ? t : t.getTime();
  const local = ms + OFFSET_MS;
  const inicioLocal = Math.floor(local / DIA_MS) * DIA_MS;
  return new Date(inicioLocal - OFFSET_MS);
}

// "dd/mm" no fuso da loja.
export function rotuloDia(d: Date): string {
  const local = new Date(d.getTime() + OFFSET_MS);
  const dd = String(local.getUTCDate()).padStart(2, '0');
  const mm = String(local.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}
