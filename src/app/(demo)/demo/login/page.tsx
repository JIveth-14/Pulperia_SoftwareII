import { DEMO_CREDENTIALS, DEMO_SESSION_MINUTES } from '@/lib/demo/demo-config';

/**
 * Login del MODO DEMO.
 *
 * Credenciales estáticas precargadas (demo@app.com / Demo2026!). El formulario
 * hace POST a /demo/entrar, que valida contra las constantes y crea la sesión.
 * No usa Supabase ni JavaScript: es un form HTML nativo.
 */
export default async function DemoLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Pulpería <span className="text-amber-500">· Demo</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Acceso de demostración (solo lectura, {DEMO_SESSION_MINUTES} min)
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            Credenciales demo incorrectas. Usa las que aparecen abajo.
          </div>
        )}

        <form action="/demo/entrar" method="POST" className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="demo@app.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-amber-500 py-2 px-4 font-medium text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Entrar a la demo
          </button>
        </form>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-center text-xs text-amber-800">
          🔴 Datos ficticios · credenciales de demostración
          <div className="mt-1 font-mono">
            {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
          </div>
        </div>

        <div className="text-center">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Volver al inicio
          </a>
        </div>
      </div>
    </main>
  );
}
