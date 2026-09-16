import type { Result } from './result';

/**
 * Estado que las Server Actions devuelven a `useActionState`.
 * Solo se usa cuando algo falla: en éxito la acción redirige.
 */
export interface EstadoFormulario {
  /** Mensaje general (arriba del formulario). */
  error?: string;
  /** Mensajes por campo. */
  campos?: Record<string, string>;
  /** Lo que el usuario escribió, para no perderlo al mostrar el error. */
  valores?: Record<string, string>;
}

export const ESTADO_INICIAL: EstadoFormulario = {};

/** Lee campos de texto de un FormData (ignora archivos). */
export function leerCampos<K extends string>(form: FormData, nombres: readonly K[]): Record<K, string> {
  const valores = {} as Record<K, string>;
  for (const nombre of nombres) {
    const valor = form.get(nombre);
    valores[nombre] = typeof valor === 'string' ? valor : '';
  }
  return valores;
}

/** Convierte un Result fallido en estado de formulario. */
export function estadoDeFallo(
  resultado: Extract<Result<unknown>, { ok: false }>,
  valores?: Record<string, string>
): EstadoFormulario {
  return { error: resultado.error.mensaje, campos: resultado.campos, valores };
}

/** Mensajes de éxito que se muestran tras redirigir (`?exito=<clave>`). */
export const MENSAJES_EXITO = {
  'cliente-creado': 'Cliente registrado',
  'cliente-actualizado': 'Cliente actualizado',
  'cliente-eliminado': 'Cliente eliminado',
  'producto-creado': 'Producto registrado',
  'producto-actualizado': 'Producto actualizado',
  'producto-eliminado': 'Producto eliminado',
  'fiado-registrado': 'Fiado registrado',
  'pago-registrado': 'Pago registrado',
  'venta-registrada': 'Venta registrada',
} as const;

export type ClaveExito = keyof typeof MENSAJES_EXITO;

export function conExito(ruta: string, clave: ClaveExito): string {
  return `${ruta}${ruta.includes('?') ? '&' : '?'}exito=${clave}`;
}
