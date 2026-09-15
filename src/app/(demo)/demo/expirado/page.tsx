import Link from 'next/link';
import { DEMO_SESSION_MINUTES } from '@/lib/demo/demo-config';

/**
 * Pantalla mostrada cuando la sesión demo (30 min) expira.
 * Vive fuera del layout protegido para evitar bucles de redirección.
 */
export default function DemoExpiradoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-lg">
        <div className="text-5xl">⏱</div>
        <h1 className="text-2xl font-bold text-gray-900">La demo expiró</h1>
        <p className="text-gray-600">
          Tu sesión de demostración duró {DEMO_SESSION_MINUTES} minutos y ha finalizado.
          Puedes reiniciarla cuando quieras.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/demo"
            className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
          >
            Reiniciar demo
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
