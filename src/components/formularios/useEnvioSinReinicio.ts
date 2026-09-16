'use client';

import { startTransition, type FormEvent } from 'react';

/**
 * Con `<form action={...}>`, React 19 reinicia el formulario al terminar la
 * acción, también cuando devuelve errores. Eso borra lo escrito: los inputs
 * controlados (carrito, cliente) quedan vacíos en pantalla, y los numéricos
 * con foco (enviar con Enter) no recuperan su valor. Todos los formularios
 * envían la acción desde `onSubmit`, sin reinicio.
 */
export function useEnvioSinReinicio(enviar: (datos: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  };
}
