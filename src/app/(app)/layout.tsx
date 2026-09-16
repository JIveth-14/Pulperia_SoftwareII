export const dynamic = 'force-dynamic';

import { getUser } from '@/lib/supabase/server-utils';
import { redirect } from 'next/navigation';
import { BarraNavegacion } from '@/components/layout/BarraNavegacion';
import { Suspense } from 'react';
import { AvisoExito } from '@/components/formularios';

const NAVEGACION = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/productos', label: 'Productos' },
  { href: '/ventas', label: 'Ventas' },
];

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
      <BarraNavegacion
        marca="Pulpería"
        inicioHref="/dashboard"
        items={NAVEGACION}
        usuario={user.email ?? ''}
        salir={<SignOutButton />}
      />

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
