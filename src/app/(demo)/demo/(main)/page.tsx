export const dynamic = 'force-dynamic';

import { createDemoRepositories } from '@/repositories/container';
import { MetricCard } from '@/components/ui';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Resumen de tu negocio (datos de demostración)</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Clientes" value={clientesConSaldo.length.toString()} color="blue" />
        <MetricCard title="Ventas del día" value={`$${ventasTotalDelDia.toFixed(2)}`} color="green" />
        <MetricCard title="Saldo pendiente" value={`$${saldoPendiente.toFixed(2)}`} color="red" />
        <MetricCard title="Productos" value={productos.length.toString()} color="purple" />
      </div>

      {productosBajos.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h2 className="font-semibold text-yellow-900">⚠️ Productos con stock bajo</h2>
          <p className="mt-2 text-sm text-yellow-800">
            {productosBajos.length} producto(s) por debajo del stock mínimo:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-800">
            {productosBajos.slice(0, 5).map((p) => (
              <li key={p.id}>
                {p.nombre} ({p.stock}/{p.stock_minimo})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Últimas ventas</h2>
        {ventasDelDia.length === 0 ? (
          <p className="text-gray-600">Sin ventas el día de hoy</p>
        ) : (
          <div className="space-y-2">
            {ventasDelDia.slice(0, 5).map((v) => (
              <div key={v.id} className="flex justify-between text-sm">
                <span className="text-gray-600">Venta #{v.id}</span>
                <span className="font-semibold text-gray-900">${v.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
