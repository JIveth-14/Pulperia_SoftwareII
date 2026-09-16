'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { Fiado } from '@/types';
import { Input, buttonClass } from '@/components/ui';
import { ESTADO_INICIAL } from '@/lib/formulario';
import { formatDate, formatMoney } from '@/lib/format';
import { BotonEnviar } from './BotonEnviar';
import { useEnvioSinReinicio } from './useEnvioSinReinicio';
import { ErrorFormulario } from './ErrorFormulario';
import type { AccionFormulario } from './tipos';

interface PagoFormProps {
  accion: AccionFormulario;
  /** Deudas con saldo, de la más antigua a la más reciente. */
  fiados: Pick<Fiado, 'id' | 'saldo_pendiente' | 'monto_total' | 'fecha' | 'estado'>[];
  cancelarHref: string;
}

export function PagoForm({ accion, fiados, cancelarHref }: PagoFormProps) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const alEnviar = useEnvioSinReinicio(enviar);
  const [fiadoId, setFiadoId] = useState(() => Number(estado.valores?.fiadoId) || fiados[0]?.id);
  const [monto, setMonto] = useState(estado.valores?.monto ?? '');

  const seleccionado = fiados.find((f) => f.id === fiadoId);
  const saldo = Number(seleccionado?.saldo_pendiente ?? 0);

  return (
    <form onSubmit={alEnviar} className="space-y-5" noValidate>
      <ErrorFormulario estado={estado} />

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-text">Deuda a abonar</legend>
        <div className="space-y-2">
          {fiados.map((fiado) => (
            <label
              key={fiado.id}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-3 text-sm transition-colors ${
                fiado.id === fiadoId ? 'border-primary bg-muted' : 'border-border hover:border-border-strong'
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="fiadoId"
                  value={fiado.id}
                  checked={fiado.id === fiadoId}
                  onChange={() => setFiadoId(fiado.id)}
                  className="accent-primary"
                />
                <span>
                  <span className="block text-text">Deuda #{fiado.id}</span>
                  <span className="block text-xs text-text-secondary">
                    {formatDate(fiado.fecha)} · total {formatMoney(fiado.monto_total)}
                  </span>
                </span>
              </span>
              <span className="text-right">
                <span className="block font-medium tabular-nums text-danger">{formatMoney(fiado.saldo_pendiente)}</span>
                <span className="block text-xs text-text-secondary">pendiente</span>
              </span>
            </label>
          ))}
        </div>
        {estado.campos?.fiadoId && <p className="mt-1 text-sm text-danger">{estado.campos.fiadoId}</p>}
      </fieldset>

      <div className="flex items-end gap-2">
        <Input
          id="monto"
          name="monto"
          label="Monto del pago (L)"
          type="number"
          inputMode="decimal"
          min={0.01}
          max={saldo || undefined}
          step="0.01"
          placeholder="0.00"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          error={estado.campos?.monto}
          required
        />
        <button
          type="button"
          onClick={() => setMonto(saldo.toFixed(2))}
          className={`${buttonClass('secondary')} ${estado.campos?.monto ? 'mb-6' : ''} shrink-0`}
          disabled={!seleccionado}
        >
          Saldar
        </button>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Link href={cancelarHref} className={buttonClass('secondary')}>
          Cancelar
        </Link>
        <BotonEnviar pendiente={enviando}>Registrar pago</BotonEnviar>
      </div>
    </form>
  );
}
