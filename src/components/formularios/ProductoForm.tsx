'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { Producto } from '@/types';
import { Input, buttonClass } from '@/components/ui';
import { ESTADO_INICIAL } from '@/lib/formulario';
import { BotonEnviar } from './BotonEnviar';
import { useEnvioSinReinicio } from './useEnvioSinReinicio';
import { ErrorFormulario } from './ErrorFormulario';
import type { AccionFormulario } from './tipos';

type Campo = 'nombre' | 'precio' | 'stock' | 'stock_minimo';

interface ProductoFormProps {
  accion: AccionFormulario;
  producto?: Pick<Producto, Campo>;
  cancelarHref: string;
}

export function ProductoForm({ accion, producto, cancelarHref }: ProductoFormProps) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const alEnviar = useEnvioSinReinicio(enviar);
  const valor = (campo: Campo, porDefecto = '') =>
    estado.valores?.[campo] ?? (producto ? String(producto[campo]) : porDefecto);

  return (
    <form onSubmit={alEnviar} className="space-y-4" noValidate>
      <ErrorFormulario estado={estado} />

      <Input
        id="nombre"
        name="nombre"
        label="Nombre"
        placeholder="Arroz 1 lb"
        defaultValue={valor('nombre')}
        error={estado.campos?.nombre}
        required
        maxLength={150}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          id="precio"
          name="precio"
          label="Precio (L)"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          defaultValue={valor('precio')}
          error={estado.campos?.precio}
          required
        />
        <Input
          id="stock"
          name="stock"
          label="Stock"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={valor('stock', '0')}
          error={estado.campos?.stock}
          required
        />
        <Input
          id="stock_minimo"
          name="stock_minimo"
          label="Stock mínimo"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={valor('stock_minimo', '5')}
          error={estado.campos?.stock_minimo}
        />
      </div>
      <p className="text-xs text-text-secondary">
        Cuando el stock baje del mínimo, el producto aparecerá en las alertas de stock bajo.
      </p>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Link href={cancelarHref} className={buttonClass('secondary')}>
          Cancelar
        </Link>
        <BotonEnviar pendiente={enviando}>{producto ? 'Guardar cambios' : 'Registrar producto'}</BotonEnviar>
      </div>
    </form>
  );
}
