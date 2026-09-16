'use client';

import { startTransition, type FormEvent } from 'react';

/**
 * Con `<form action={...}>`, React 19 reinicia el formulario al terminar la
 * acción: los inputs controlados (carrito, cliente, monto) quedan vacíos en
 * pantalla aunque su estado siga intacto. Para esos formularios se envía la
 * acción manualmente desde `onSubmit`, sin reinicio.
 */
export function useEnvioSinReinicio(enviar: (datos: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  };
}
