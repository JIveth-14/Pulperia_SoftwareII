export function requerido(valor: string): string | null {
  return valor.trim().length === 0 ? 'Este campo es obligatorio' : null;
}

export function esNumeroPositivo(valor: string): string | null {
  const n = parseFloat(valor);
  if (isNaN(n) || n < 0) return 'Debe ser un número mayor o igual a 0';
  return null;
}

export function esEnteroPositivo(valor: string): string | null {
  const n = parseInt(valor, 10);
  if (isNaN(n) || n < 0 || String(n) !== valor.trim())
    return 'Debe ser un número entero mayor o igual a 0';
  return null;
}

export function esMontoValido(valor: string): string | null {
  const n = parseFloat(valor);
  if (isNaN(n) || n <= 0) return 'El monto debe ser mayor a 0';
  return null;
}
