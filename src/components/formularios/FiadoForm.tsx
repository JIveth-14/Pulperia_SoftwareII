'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Input, buttonClass } from '@/components/ui';
import { ESTADO_INICIAL } from '@/lib/formulario';
import { BotonEnviar } from './BotonEnviar';
import { useEnvioSinReinicio } from './useEnvioSinReinicio';
import { ErrorFormulario } from './ErrorFormulario';
import type { AccionFormulario } from './tipos';

export function FiadoForm({ accion, cancelarHref }: { accion: AccionFormulario; cancelarHref: string }) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const alEnviar = useEnvioSinReinicio(enviar);

  return (
    <form onSubmit={alEnviar} className="space-y-4" noValidate>
      <ErrorFormulario estado={estado} />

      <Input
        id="monto"
        name="monto"
        label="Monto de la deuda (L)"
        type="number"
        inputMode="decimal"
        min={0.01}
        step="0.01"
        placeholder="0.00"
        defaultValue={estado.valores?.monto ?? ''}
        error={estado.campos?.monto}
        required
        autoFocus
      />
      <p className="text-xs text-text-secondary">
        Para fiar productos del inventario usa <Link href="/ventas/nueva" className="underline underline-offset-2">Nueva venta</Link> con
        pago al crédito: así también se descuenta el stock.
      </p>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Link href={cancelarHref} className={buttonClass('secondary')}>
          Cancelar
        </Link>
        <BotonEnviar pendiente={enviando}>Registrar fiado</BotonEnviar>
      </div>
    </form>
  );
}
