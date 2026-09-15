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
    <div className="min-h-screen bg-gray-50">
      <DemoBanner expiresAt={session.expiresAt} />

      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/demo" className="text-xl font-bold text-indigo-600">
                Pulpería <span className="text-amber-500">· Demo</span>
              </Link>
              <div className="ml-10 flex space-x-4">
                {DEMO_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">demo@app.com</span>
              <Link
                href="/demo/salir"
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Salir
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
