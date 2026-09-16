import type { EstadoFormulario } from '@/lib/formulario';

/** Firma de una Server Action usable con `useActionState`. */
export type AccionFormulario = (estado: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
