export const dynamic = 'force-dynamic';

import { Card, EmptyState, PageHeader } from '@/components/ui';
import { createDemoRepositories } from '@/repositories/container';
import { formatDate, formatMoney } from '@/lib/format';
import { ReadOnlyNotice, DisabledButton } from '../ui';

/** Registro de ventas en modo demo (solo lectura). */
export default async function DemoVentasPage() {
  const ventas = await createDemoRepositories().ventas.getAll();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Registro de todas tus ventas"
        actions={<DisabledButton label="Nueva venta" />}
      />

      <ReadOnlyNotice />

      {ventas.length === 0 ? (
        <EmptyState title="Sin ventas" message="Comienza registrando tu primera venta" />
      ) : (
        <div className="grid gap-3">
          {ventas.map((venta) => (
            <Card key={venta.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-text">Venta #{venta.id}</h3>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {formatDate(venta.fecha)} · {venta.tipo_pago === 'contado' ? 'Contado' : 'Fiado'}
                  </p>
                </div>
                <p className="text-lg font-semibold tabular-nums text-text">{formatMoney(venta.total)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
