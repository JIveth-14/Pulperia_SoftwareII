/**
 * Pequeños componentes compartidos por las páginas demo:
 * refuerzan que la demo es de SOLO LECTURA (equivalente a bloquear
 * DELETE/PUT/PATCH de la spec original, pero a nivel de UI).
 */

/** Aviso de solo lectura mostrado sobre cada listado. */
export function ReadOnlyNotice() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
      🔒 Solo lectura: en la demo las acciones de crear, editar y eliminar están deshabilitadas.
    </div>
  );
}

/** Botón visualmente presente pero deshabilitado (no permite mutaciones). */
export function DisabledButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Deshabilitado en modo demo"
      className="cursor-not-allowed rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-400"
    >
      {label}
    </button>
  );
}
