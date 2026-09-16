export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDemoSession } from '@/lib/demo/session';
import { DEMO_NAV } from '@/lib/demo/demo-config';
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

      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between px-4 sm:h-14 sm:flex-nowrap sm:px-6">
          <Link href="/demo" className="flex h-12 items-center whitespace-nowrap text-sm font-semibold tracking-tight text-text sm:h-auto">
            Pulpería <span className="ml-1 font-normal text-text-secondary">· Demo</span>
          </Link>
          {/* En móvil los enlaces bajan a una segunda fila desplazable. */}
          <div className="order-last -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-3 pb-2 sm:order-none sm:mx-0 sm:ml-8 sm:mr-auto sm:w-auto sm:overflow-visible sm:p-0">
            {DEMO_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-muted hover:text-text"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-text-secondary md:inline">demo@app.com</span>
            {/* <a> y no <Link>: Next prefetchea los <Link> en producción y ese GET
                ejecutaría /demo/salir, borrando la cookie de sesión demo. */}
            <a href="/demo/salir" className="text-sm text-text-secondary transition-colors hover:text-text">
              Salir
            </a>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
