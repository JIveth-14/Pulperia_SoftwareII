export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { getDemoSession } from '@/lib/demo/session';
import { DEMO_CREDENTIALS, DEMO_NAV } from '@/lib/demo/demo-config';
import { BarraNavegacion } from '@/components/layout/BarraNavegacion';
import { DemoBanner } from './DemoBanner';

/**
 * Layout del MODO DEMO.
 *
 * - Muestra el banner con la cuenta regresiva de la sesión (30 min).
 * - Si la sesión expiró o no existe, redirige a /demo/expirado.
 * - Reproduce la navegación de la app real, pero apuntando a /demo/*.
 */
export default async function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDemoSession();

  // Defensa en profundidad: el middleware ya exige sesión válida antes de
  // llegar aquí. Si falta, mandamos al login demo.
  if (!session || session.expired) {
    redirect('/demo/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner expiresAt={session.expiresAt} />

      <BarraNavegacion
        marca={
          <>
            Pulpería <span className="font-normal text-text-secondary">· Demo</span>
          </>
        }
        inicioHref="/demo"
        items={DEMO_NAV}
        usuario={DEMO_CREDENTIALS.email}
        salir={
          // <a> y no <Link>: Next prefetchea los <Link> en producción y ese GET
          // ejecutaría /demo/salir, borrando la cookie de sesión demo.
          <a href="/demo/salir" className="text-sm text-text-secondary transition-colors hover:text-text">
            Salir
          </a>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
