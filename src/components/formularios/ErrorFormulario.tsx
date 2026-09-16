import { ErrorMessage } from '@/components/ui';
import type { EstadoFormulario } from '@/lib/formulario';

/** Error general del formulario (solo si no hay errores por campo que ya lo expliquen). */
export function ErrorFormulario({ estado }: { estado: EstadoFormulario }) {
  if (!estado.error) return null;
  const tieneCampos = estado.campos && Object.keys(estado.campos).length > 0;
  return <ErrorMessage message={tieneCampos ? 'Revisa los campos marcados' : estado.error} />;
}
