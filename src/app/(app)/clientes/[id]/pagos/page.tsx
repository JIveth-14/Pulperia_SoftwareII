import Link from 'next/link';
import { PageHeader, buttonClass } from '@/components/ui';
import { parseIdOrNotFound } from '@/lib/params';

export default async function HistorialPagosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Historial de pagos - Cliente #${id}`}
        backHref={`/clientes/${id}`}
        actions={
          <Link href={`/clientes/${id}/pagos/nuevo`} className={buttonClass('primary')}>
            Nuevo pago
          </Link>
        }
      />

      <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          Lista de pagos (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
