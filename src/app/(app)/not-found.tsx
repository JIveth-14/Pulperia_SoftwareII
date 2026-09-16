import Link from 'next/link';
import { buttonClass } from '@/components/ui';

export default function NoEncontrado() {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-surface px-6 py-10 text-center">
      <p className="text-sm font-medium text-text-secondary">404</p>
      <h1 className="mt-1 text-lg font-semibold text-text">No encontramos lo que buscas</h1>
      <p className="mt-2 text-sm text-text-secondary">El registro no existe o fue eliminado.</p>
      <div className="mt-6">
        <Link href="/dashboard" className={buttonClass('primary')}>
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
