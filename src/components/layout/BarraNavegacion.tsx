'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

export interface ItemNavegacion {
  href: string;
  label: string;
}

interface BarraNavegacionProps {
  marca: React.ReactNode;
  /** Ruta de inicio: solo se marca activa en coincidencia exacta. */
  inicioHref: string;
  items: readonly ItemNavegacion[];
  usuario: string;
  /** Botón o enlace de salida (puede ser un form con Server Action). */
  salir: React.ReactNode;
}

export function esRutaActiva(pathname: string, href: string, inicioHref: string): boolean {
  if (href === inicioHref) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra superior con página activa marcada y menú desplegable en móvil. */
export function BarraNavegacion({ marca, inicioHref, items, usuario, salir }: BarraNavegacionProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const menuId = useId();

  // Al navegar se cierra el menú móvil.
  useEffect(() => setAbierto(false), [pathname]);

  const enlaces = (movil: boolean) =>
    items.map((item) => {
      const activo = esRutaActiva(pathname, item.href, inicioHref);
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={activo ? 'page' : undefined}
          className={`rounded-md text-sm transition-colors ${movil ? 'block px-3 py-2' : 'px-3 py-1.5'} ${
            activo ? 'bg-muted font-medium text-text' : 'text-text-secondary hover:bg-muted hover:text-text'
          }`}
        >
          {item.label}
        </Link>
      );
    });

  return (
    <nav className="border-b border-border bg-surface" aria-label="Principal">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href={inicioHref} className="whitespace-nowrap text-sm font-semibold tracking-tight text-text">
            {marca}
          </Link>
          <div className="hidden items-center gap-1 sm:flex">{enlaces(false)}</div>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <span className="hidden max-w-[16rem] truncate text-sm text-text-secondary md:inline">{usuario}</span>
          {salir}
        </div>

        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          aria-expanded={abierto}
          aria-controls={menuId}
          className="-mr-2 inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary hover:bg-muted hover:text-text sm:hidden"
        >
          <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            {abierto ? <path d="M4 4l8 8M12 4l-8 8" /> : <path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11" />}
          </svg>
          {abierto ? 'Cerrar' : 'Menú'}
        </button>
      </div>

      <div id={menuId} hidden={!abierto} className="border-t border-border px-4 pb-4 pt-2 sm:hidden">
        <div className="space-y-1">{enlaces(true)}</div>
        <div className="mt-3 flex items-center justify-between gap-4 border-t border-border px-3 pt-3">
          <span className="truncate text-sm text-text-secondary">{usuario}</span>
          {salir}
        </div>
      </div>
    </nav>
  );
}
