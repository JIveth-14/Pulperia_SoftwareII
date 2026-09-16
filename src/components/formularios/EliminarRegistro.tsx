'use client';

import { useActionState, useState } from 'react';
import { Button, ErrorMessage } from '@/components/ui';
import { ESTADO_INICIAL } from '@/lib/formulario';
import { BotonEnviar } from './BotonEnviar';
import type { AccionFormulario } from './tipos';

interface EliminarRegistroProps {
  accion: AccionFormulario;
  /** "cliente", "producto"… */
  entidad: string;
  /** Qué se pierde al eliminar. */
  advertencia: string;
}

/** Zona de eliminación con confirmación en dos pasos (sin `window.confirm`). */
export function EliminarRegistro({ accion, entidad, advertencia }: EliminarRegistroProps) {
  const [estado, enviar] = useActionState(accion, ESTADO_INICIAL);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section className="rounded-lg border border-danger/20 bg-surface px-5 py-4">
      <h2 className="text-sm font-medium text-text">Eliminar {entidad}</h2>
      <p className="mt-1 text-sm text-text-secondary">{advertencia}</p>

      {estado.error && (
        <div className="mt-3">
          <ErrorMessage message={estado.error} />
        </div>
      )}

      <div className="mt-4">
        {confirmando ? (
          <form action={enviar} className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-text">¿Seguro? Esta acción no se puede deshacer.</span>
            <Button type="button" variant="secondary" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <BotonEnviar variant="danger">Sí, eliminar</BotonEnviar>
          </form>
        ) : (
          <Button type="button" variant="dangerOutline" onClick={() => setConfirmando(true)}>
            Eliminar {entidad}
          </Button>
        )}
      </div>
    </section>
  );
}
