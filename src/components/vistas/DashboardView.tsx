import type { ClienteConSaldo, Producto, Venta } from '@/types';
import type { Repositories } from '@/repositories/container';
import { MetricCard, PageHeader } from '@/components/ui';
import { StockBajo } from '@/components/productos/StockBajo';
import { formatMoney } from '@/lib/format';
import { esDemo, rutaBase, type ModoDatos } from './modo';

export interface DatosDashboard {
  clientesConSaldo: ClienteConSaldo[];
  ventasDelDia: Venta[];
  productos: Producto[];
}

export async function cargarDashboard(repos: Repositories): Promise<DatosDashboard> {
  const [clientesConSaldo, ventasDelDia, productos] = await Promise.all([
    repos.clientes.getConSaldo(),
    repos.ventas.getDelDia(),
    repos.productos.getAll(),
  ]);
  return { clientesConSaldo, ventasDelDia, productos };
}

export function DashboardView({ datos, modo = 'real' }: { datos: DatosDashboard; modo?: ModoDatos }) {
  const { clientesConSaldo, ventasDelDia, productos } = datos;
  const saldoPendiente = clientesConSaldo.reduce((sum, c) => sum + c.saldo, 0);
  const ventasTotalDelDia = ventasDelDia.reduce((sum, v) => sum + Number(v.total), 0);
  const productosStockBajo = productos.filter((p) => p.stock < p.stock_minimo);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={esDemo(modo) ? 'Resumen de tu negocio (datos de demostración)' : 'Resumen de tu negocio'}
      />

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

      <StockBajo productos={productosStockBajo} limite={6} href={`${rutaBase(modo)}/productos`} />

      <section className="rounded-lg border border-border bg-surface">
        <h2 className="border-b border-border px-5 py-3 text-sm font-medium text-text">
          Ventas de hoy
        </h2>
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
