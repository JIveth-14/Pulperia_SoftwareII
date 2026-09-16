'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Banner visual fijo del modo demo con cuenta regresiva de la sesión.
 * Cuando el tiempo llega a 0 redirige a /demo/expirado.
 */
export function DemoBanner({ expiresAt }: { expiresAt: number }) {
  const router = useRouter();
  // Se inicia en null para que el HTML del servidor y la primera hidratación
  // coincidan (mostrando '--:--'); el tiempo real se calcula ya en el cliente.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, expiresAt - Date.now());
      setRemaining(ms);
      if (ms <= 0) {
        router.replace('/demo/expirado');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, router]);

  let label = '--:--';
  if (remaining !== null) {
    const totalSec = Math.floor(remaining / 1000);
    const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
    const sec = String(totalSec % 60).padStart(2, '0');
    label = `${min}:${sec}`;
  }

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-warning/25 bg-warning-soft px-4 py-1.5 text-center text-xs text-warning">
      <span>Modo demo · datos ficticios de solo lectura</span>
      <span className="font-mono tabular-nums" aria-label="Tiempo restante de la sesión demo">
        {label}
      </span>
      <a href="/demo/salir" className="font-medium underline underline-offset-2 hover:no-underline">
        Salir
      </a>
    </div>
  );
}
