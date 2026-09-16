import { Alert, buttonClass } from '@/components/ui';

/**
 * Pequeños componentes compartidos por las páginas demo:
 * refuerzan que la demo es de SOLO LECTURA (equivalente a bloquear
 * DELETE/PUT/PATCH de la spec original, pero a nivel de UI).
 */

/** Aviso de solo lectura mostrado sobre cada listado. */
export function ReadOnlyNotice() {
  return (
    <Alert>
      Solo lectura: en la demo las acciones de crear, editar y eliminar están deshabilitadas.
    </Alert>
  );
}

/** Botón visualmente presente pero deshabilitado (no permite mutaciones). */
export function DisabledButton({ label, size = 'md' }: { label: string; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      disabled
      title="Deshabilitado en modo demo"
      className={buttonClass('secondary', size)}
    >
      {label}
    </button>
  );
}
