import Link from 'next/link';
import { DEMO_SESSION_MINUTES } from '@/lib/demo/demo-config';
import { buttonClass } from '@/components/ui';

/**
 * Pantalla mostrada cuando la sesión demo (30 min) expira.
 * Vive fuera del layout protegido para evitar bucles de redirección.
 */
export default function DemoExpiradoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-text">La demo expiró</h1>
        <p className="text-sm text-text-secondary">
          Tu sesión de demostración duró {DEMO_SESSION_MINUTES} minutos y ha finalizado.
          Puedes reiniciarla cuando quieras.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <Link href="/demo" className={buttonClass('primary')}>
            Reiniciar demo
          </Link>
          <Link href="/" className="text-sm text-text-secondary hover:text-text">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
