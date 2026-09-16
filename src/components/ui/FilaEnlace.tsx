'use client';

import { useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';

/** Elementos que manejan su propio clic dentro de la fila. */
const INTERACTIVOS = 'a, button, input, select, textarea, label, summary';

/**
 * Fila de tabla clicable.
 *
 * Antes se usaba un enlace "estirado" (`::after` absoluto sobre `<tr relative>`),
 * pero varios navegadores ignoran `position: relative` en filas de tabla: el
 * `::after` de la última fila terminaba cubriendo TODA la página y cualquier
 * clic (menú, "Nuevo cliente"…) abría ese registro. Aquí el clic se maneja en
 * la propia fila, sin superposiciones. El enlace real de la primera celda se
 * mantiene para teclado y lectores de pantalla.
 */
export function FilaEnlace({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const router = useRouter();

  const alHacerClic = (evento: MouseEvent<HTMLTableRowElement>) => {
    if (evento.defaultPrevented || evento.button !== 0) return;
    if ((evento.target as HTMLElement).closest(INTERACTIVOS)) return;
    // No navegar si el usuario está seleccionando texto (p. ej. copiar un teléfono).
    if (window.getSelection()?.toString()) return;

    if (evento.metaKey || evento.ctrlKey) {
      window.open(href, '_blank', 'noopener');
      return;
    }
    router.push(href);
  };

  return (
    <tr onClick={alHacerClic} className={`cursor-pointer ${className}`}>
      {children}
    </tr>
  );
}
