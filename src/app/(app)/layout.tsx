export const dynamic = 'force-dynamic';

import { getUser } from '@/lib/supabase/server-utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { AvisoExito } from '@/components/formularios';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between px-4 sm:h-14 sm:flex-nowrap sm:px-6">
          <Link href="/dashboard" className="flex h-12 items-center whitespace-nowrap text-sm font-semibold tracking-tight text-text sm:h-auto">
            Pulpería
          </Link>
          {/* En móvil los enlaces bajan a una segunda fila desplazable. */}
          <div className="order-last -mx-4 flex w-[calc(100%+2rem)] items-center gap-1 overflow-x-auto px-3 pb-2 sm:order-none sm:mx-0 sm:ml-8 sm:mr-auto sm:w-auto sm:overflow-visible sm:p-0">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/clientes" label="Clientes" />
            <NavLink href="/productos" label="Productos" />
            <NavLink href="/ventas" label="Ventas" />
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-text-secondary md:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* Toast de éxito tras las Server Actions (?exito=...). */}
      <Suspense>
        <AvisoExito />
      </Suspense>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-muted hover:text-text"
    >
      {label}
    </Link>
  );
}

function SignOutButton() {
  return (
    <form
      action={async () => {
        'use server';
        const { signOut } = await import('@/lib/supabase/server-utils');
        await signOut();
        const { redirect } = await import('next/navigation');
        redirect('/login');
      }}
    >
      <button
        type="submit"
        className="text-sm text-text-secondary transition-colors hover:text-text"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
