import { ValidacionError } from '@/domain/errors';
import { validarCampos } from '@/lib/security/validators';

/**
 * Ejecuta las reglas de `validarCampos` y lanza un `ValidacionError` con
 * todos los errores por campo si alguno falló.
 */
export function validarOLanzar<T extends Record<string, () => unknown>>(
  reglas: T,
  mensaje = 'Revisa los datos del formulario'
): { [K in keyof T]: ReturnType<T[K]> } {
  const { valores, errores } = validarCampos(reglas);
  if (Object.keys(errores).length > 0) {
    throw new ValidacionError(mensaje, errores as Record<string, string>);
  }
  return valores;
}

export function idValido(valor: unknown): number | null {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
