export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Alert, Card, EmptyState, PageHeader, buttonClass } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';

export default async function VentasPage() {
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);

  try {
    const ventas = await repos.ventas.getAll();

    return (
      <div className="space-y-6">
        <PageHeader
          title="Ventas"
          description="Registro de todas tus ventas"
          actions={
            <Link href="/ventas/nueva" className={buttonClass('primary')}>
              Nueva venta
            </Link>
          }
        />

        {ventas.length === 0 ? (
          <EmptyState
            title="Sin ventas"
            message="Comienza registrando tu primera venta"
            action={{ label: 'Registrar venta', href: '/ventas/nueva' }}
          />
        ) : (
          <div className="grid gap-3">
            {ventas.map((venta) => (
              <Link
                key={venta.id}
                href={`/ventas/${venta.id}`}
                className="block rounded-lg transition-colors hover:[&>div]:border-border-strong"
              >
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-text">
                        Venta #{venta.id}
                      </h3>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        {formatDate(venta.fecha)} · {venta.tipo_pago === 'contado' ? 'Contado' : 'Fiado'}
                      </p>
                    </div>
                    <p className="text-lg font-semibold tabular-nums text-text">
                      {formatMoney(venta.total)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return <Alert tone="danger">Error al cargar las ventas. Por favor, intenta de nuevo más tarde.</Alert>;
  }
}
