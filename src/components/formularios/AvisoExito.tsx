'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/Toast/ToastContext';
import { MENSAJES_EXITO, type ClaveExito } from '@/lib/formulario';

/**
 * Muestra el toast de éxito que una Server Action pidió con `?exito=<clave>`
 * al redirigir, y limpia el parámetro de la URL.
 */
export function AvisoExito() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useToast();
  const clave = params.get('exito');
  // En modo estricto los efectos corren dos veces: evita el toast duplicado.
  const ultimo = useRef<string | null>(null);

  useEffect(() => {
    if (!clave || ultimo.current === clave) return;
    ultimo.current = clave;
    if (clave in MENSAJES_EXITO) {
      showToast(MENSAJES_EXITO[clave as ClaveExito], 'success');
    }
    const resto = new URLSearchParams(params.toString());
    resto.delete('exito');
    const query = resto.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [clave, params, pathname, router, showToast]);

  useEffect(() => {
    if (!clave) ultimo.current = null;
  }, [clave]);

  return null;
}
