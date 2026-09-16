'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, buttonClass } from '@/components/ui';

/** Error inesperado al cargar una página de la app (reemplaza los try/catch por página). */
export default function ErrorApp({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[App] Error al cargar la página:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-surface px-6 py-10 text-center">
      <h1 className="text-lg font-semibold text-text">No se pudo cargar esta página</h1>
      <p className="mt-2 text-sm text-text-secondary">
        Revisa tu conexión e intenta de nuevo. Si el problema sigue, vuelve más tarde.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/dashboard" className={buttonClass('secondary')}>
          Ir al dashboard
        </Link>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
