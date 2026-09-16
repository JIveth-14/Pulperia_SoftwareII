import Link from 'next/link';
import { buttonClass } from '@/components/ui';

const FEATURES = [
  {
    title: 'Clientes y fiados',
    description: 'Registra clientes, controla sus deudas y el historial de pagos.',
  },
  {
    title: 'Inventario',
    description: 'Controla tu stock y recibe alertas de productos por agotarse.',
  },
  {
    title: 'Ventas',
    description: 'Registra ventas de contado o al crédito y revisa el día de un vistazo.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="text-sm font-semibold tracking-tight text-text">Pulpería</span>
        <div className="flex items-center gap-2">
          <Link href="/demo/login" className={buttonClass('secondary')}>
            Ver demo
          </Link>
          <Link href="/login" className={buttonClass('primary')}>
            Iniciar sesión
          </Link>
        </div>
      </nav>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            Gestiona tu pulpería con facilidad
          </h1>
          <p className="mt-4 text-lg text-text-secondary">
            Clientes, inventario, fiados y ventas en un solo lugar.
          </p>
          <div className="mt-8">
            <Link href="/login" className={buttonClass('primary', 'lg')}>
              Comenzar ahora
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="bg-surface p-6">
              <h3 className="text-sm font-medium text-text">{feature.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-text-secondary">
        © {new Date().getFullYear()} Pulpería
      </footer>
    </main>
  );
}
