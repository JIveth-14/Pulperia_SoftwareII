/** Normaliza para comparar: sin acentos, minúsculas y sin espacios extremos. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

/** Búsqueda tolerante ("maria" encuentra "María González"). */
export function coincide(texto: string, busqueda: string): boolean {
  return normalizar(texto).includes(normalizar(busqueda));
}
