/**
 * Utilidades de fecha con la zona horaria del negocio.
 *
 * El servidor (Vercel) corre en UTC; si se usa `new Date()` con los métodos
 * locales, "hoy" empieza a las 6 p. m. hora de Honduras. Toda lógica de
 * calendario debe pasar por aquí.
 */

export const ZONA_HORARIA = 'America/Tegucigalpa';

interface PartesFecha {
  year: number;
  month: number;
  day: number;
}

function partesEnZona(fecha: Date, zona: string): PartesFecha & { hour: number; minute: number; second: number } {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(fecha);

  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    Number(partes.find((p) => p.type === tipo)?.value);

  return {
    year: valor('year'),
    month: valor('month'),
    day: valor('day'),
    hour: valor('hour'),
    minute: valor('minute'),
    second: valor('second'),
  };
}

/** Diferencia (ms) entre la hora local de `zona` y UTC en el instante dado. */
function desfaseMs(instante: Date, zona: string): number {
  const p = partesEnZona(instante, zona);
  const comoUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return comoUtc - Math.floor(instante.getTime() / 1000) * 1000;
}

/** Instante UTC que corresponde a la medianoche de la fecha dada en `zona`. */
function medianocheEnZona({ year, month, day }: PartesFecha, zona: string): Date {
  const utc = Date.UTC(year, month - 1, day);
  return new Date(utc - desfaseMs(new Date(utc), zona));
}

/**
 * Rango [inicio, fin) del día calendario de `ahora` en la zona del negocio,
 * como strings ISO listos para filtrar columnas timestamptz.
 */
export function rangoDelDia(ahora: Date = new Date(), zona: string = ZONA_HORARIA) {
  const hoy = partesEnZona(ahora, zona);
  const inicio = medianocheEnZona(hoy, zona);
  const fin = medianocheEnZona({ ...hoy, day: hoy.day + 1 }, zona);
  return { inicio: inicio.toISOString(), fin: fin.toISOString() };
}

/** true si `fecha` cae dentro del día calendario de `ahora` en la zona del negocio. */
export function esDelDia(fecha: string | Date, ahora: Date = new Date(), zona: string = ZONA_HORARIA): boolean {
  const { inicio, fin } = rangoDelDia(ahora, zona);
  const t = new Date(fecha).getTime();
  return t >= Date.parse(inicio) && t < Date.parse(fin);
}
