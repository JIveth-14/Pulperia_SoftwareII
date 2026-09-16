'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { Cliente } from '@/types';
import { Input, buttonClass } from '@/components/ui';
import { ESTADO_INICIAL } from '@/lib/formulario';
import { BotonEnviar } from './BotonEnviar';
import { useEnvioSinReinicio } from './useEnvioSinReinicio';
import { ErrorFormulario } from './ErrorFormulario';
import type { AccionFormulario } from './tipos';

interface ClienteFormProps {
  accion: AccionFormulario;
  cliente?: Pick<Cliente, 'nombre' | 'telefono' | 'direccion'>;
  cancelarHref: string;
}

export function ClienteForm({ accion, cliente, cancelarHref }: ClienteFormProps) {
  const [estado, enviar, enviando] = useActionState(accion, ESTADO_INICIAL);
  const alEnviar = useEnvioSinReinicio(enviar);
  const valor = (campo: 'nombre' | 'telefono' | 'direccion') =>
    estado.valores?.[campo] ?? cliente?.[campo] ?? '';

  return (
    <form onSubmit={alEnviar} className="space-y-4" noValidate>
      <ErrorFormulario estado={estado} />

      <Input
        id="nombre"
        name="nombre"
        label="Nombre"
        defaultValue={valor('nombre')}
        error={estado.campos?.nombre}
        autoComplete="name"
        required
        maxLength={150}
      />
      <Input
        id="telefono"
        name="telefono"
        label="Teléfono"
        type="tel"
        inputMode="tel"
        placeholder="9876-5432"
        defaultValue={valor('telefono')}
        error={estado.campos?.telefono}
        autoComplete="tel"
        required
      />
      <Input
        id="direccion"
        name="direccion"
        label="Dirección (opcional)"
        defaultValue={valor('direccion')}
        error={estado.campos?.direccion}
        autoComplete="street-address"
        maxLength={300}
      />

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Link href={cancelarHref} className={buttonClass('secondary')}>
          Cancelar
        </Link>
        <BotonEnviar pendiente={enviando}>{cliente ? 'Guardar cambios' : 'Registrar cliente'}</BotonEnviar>
      </div>
    </form>
  );
}
