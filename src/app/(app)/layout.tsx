export const dynamic = 'force-dynamic';

import { getUser } from '@/lib/supabase/server-utils';
import Link from 'next/link';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    return null; // Middleware redirige a /login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
                Pulpería
              </Link>
              <div className="ml-10 flex space-x-4">
                <NavLink href="/dashboard" label="Dashboard" />
                <NavLink href="/clientes" label="Clientes" />
                <NavLink href="/productos" label="Productos" />
                <NavLink href="/ventas" label="Ventas" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
