import { ZONA_HORARIA } from './dates';

/**
 * Formato de valores para la interfaz: Lempira hondureño y fechas en la zona
 * horaria del negocio. Ninguna página debe usar `toFixed` ni
 * `toLocaleDateString()` directamente.
 */

export const LOCALE = 'es-HN';
export const MONEDA = 'HNL';

const moneda = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: MONEDA,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fechaCorta = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeZone: ZONA_HORARIA,
});

const fechaHora = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: ZONA_HORARIA,
});

const hora = new Intl.DateTimeFormat(LOCALE, {
  timeStyle: 'short',
  timeZone: ZONA_HORARIA,
});

/** Convierte a número lo que devuelve Supabase (numeric puede llegar como string). */
function aNumero(valor: number | string | null | undefined): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** `1234.5` → `L 1,234.50` */
export function formatMoney(valor: number | string | null | undefined): string {
  return moneda.format(aNumero(valor));
}

/** Monto con signo explícito para abonos: `+L 150.00` */
export function formatMoneySigned(valor: number | string | null | undefined): string {
  const n = aNumero(valor);
  return n > 0 ? `+${moneda.format(n)}` : moneda.format(n);
}

/** `2026-09-16T18:00:00Z` → `16 sept 2026` (hora de Honduras). */
export function formatDate(valor: string | Date | null | undefined, vacio = 'Sin fecha'): string {
  if (!valor) return vacio;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? vacio : fechaCorta.format(fecha);
}

/** Fecha con hora: `16 sept 2026, 12:00 p. m.` (hora de Honduras). */
export function formatDateTime(valor: string | Date | null | undefined, vacio = 'Sin fecha'): string {
  if (!valor) return vacio;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? vacio : fechaHora.format(fecha);
}

/** Solo la hora: `12:30 p. m.` (hora de Honduras). */
export function formatTime(valor: string | Date | null | undefined, vacio = '—'): string {
  if (!valor) return vacio;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? vacio : hora.format(fecha);
}
