export const dynamic = 'force-dynamic';

import { createDemoRepositories } from '@/repositories/container';
import { Alert, MetricCard, PageHeader } from '@/components/ui';
import { formatMoney } from '@/lib/format';

/** Dashboard del modo demo (misma vista que /dashboard, con datos ficticios). */
export default async function DemoDashboardPage() {
  const repos = createDemoRepositories();
  const [clientesConSaldo, ventasDelDia, productos] = await Promise.all([
    repos.clientes.getConSaldo(),
    repos.ventas.getDelDia(),
    repos.productos.getAll(),
  ]);

  const saldoPendiente = clientesConSaldo.reduce((sum, c) => sum + c.saldo, 0);
  const ventasTotalDelDia = ventasDelDia.reduce((sum, v) => sum + Number(v.total), 0);
  const productosBajos = productos.filter((p) => p.stock < p.stock_minimo);

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Resumen de tu negocio (datos de demostración)" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Clientes" value={clientesConSaldo.length.toString()} />
        <MetricCard title="Ventas del día" value={formatMoney(ventasTotalDelDia)} />
        <MetricCard
          title="Saldo pendiente"
          value={formatMoney(saldoPendiente)}
          tone={saldoPendiente > 0 ? 'danger' : 'default'}
        />
        <MetricCard title="Productos" value={productos.length.toString()} />
      </div>

      {productosBajos.length > 0 && (
        <Alert
          tone="warning"
          title={`${productosBajos.length} producto(s) por debajo del stock mínimo`}
        >
          <ul className="space-y-0.5">
            {productosBajos.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.nombre} <span className="tabular-nums">({p.stock}/{p.stock_minimo})</span>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <section className="rounded-lg border border-border bg-surface">
        <h2 className="border-b border-border px-5 py-3 text-sm font-medium text-text">Ventas de hoy</h2>
        {ventasDelDia.length === 0 ? (
          <p className="px-5 py-4 text-sm text-text-secondary">Sin ventas el día de hoy</p>
        ) : (
          <ul className="divide-y divide-border">
            {ventasDelDia.slice(0, 5).map((v) => (
              <li key={v.id} className="flex justify-between px-5 py-3 text-sm">
                <span className="text-text-secondary">Venta #{v.id}</span>
                <span className="font-medium tabular-nums text-text">{formatMoney(v.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
