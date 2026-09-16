import Link from 'next/link';
import { DEMO_CREDENTIALS, DEMO_SESSION_MINUTES } from '@/lib/demo/demo-config';
import { Button, ErrorMessage, Input } from '@/components/ui';

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
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-text">
            Pulpería <span className="font-normal text-text-secondary">· Demo</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Acceso de demostración (solo lectura, {DEMO_SESSION_MINUTES} min)
          </p>
        </div>

        <form
          action="/demo/entrar"
          method="POST"
          className="space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          {error && (
            <ErrorMessage message="Credenciales demo incorrectas. Usa las que aparecen abajo." />
          )}

          <Input
            id="email"
            name="email"
            label="Correo electrónico"
            type="email"
            required
            autoComplete="username"
            placeholder="demo@app.com"
          />

          <Input
            id="password"
            name="password"
            label="Contraseña"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <Button type="submit" fullWidth>
            Entrar a la demo
          </Button>
        </form>

        <div className="rounded-md border border-dashed border-border-strong px-4 py-3 text-center text-sm text-text-secondary">
          Datos ficticios · credenciales de demostración
          <div className="mt-1 font-mono text-text">
            {DEMO_CREDENTIALS.email} / {DEMO_CREDENTIALS.password}
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-text-secondary hover:text-text">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
