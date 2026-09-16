import type { ClienteConSaldo, Producto, Venta } from '@/types';
import type { Repositories } from '@/repositories/container';
import Link from 'next/link';
import { EnlaceFila, MetricCard, PageHeader, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { StockBajo } from '@/components/productos/StockBajo';
import { formatMoney, formatTime } from '@/lib/format';
import { BadgeTipoPago } from './etiquetas';
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
  // Las más recientes primero.
  const ultimas = [...ventasDelDia]
    .sort((a, b) => Date.parse(b.fecha ?? '') - Date.parse(a.fecha ?? '') || b.id - a.id)
    .slice(0, 8);
  const conDeuda = clientesConSaldo.filter((c) => c.saldo > 0).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={esDemo(modo) ? 'Resumen de tu negocio (datos de demostración)' : 'Resumen de tu negocio'}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Clientes" value={clientesConSaldo.length.toString()} detalle={`${conDeuda} con deuda`} />
        <MetricCard
          title="Ventas del día"
          value={formatMoney(ventasTotalDelDia)}
          detalle={`${ventasDelDia.length} venta${ventasDelDia.length === 1 ? '' : 's'}`}
        />
        <MetricCard
          title="Saldo pendiente"
          value={formatMoney(saldoPendiente)}
          detalle="por cobrar"
          tone={saldoPendiente > 0 ? 'danger' : 'default'}
        />
        <MetricCard
          title="Productos"
          value={productos.length.toString()}
          detalle={`${productosStockBajo.length} con stock bajo`}
        />
      </div>

      <StockBajo productos={productosStockBajo} limite={6} href={`${rutaBase(modo)}/productos`} />

      {ventasDelDia.length === 0 ? (
        <section className="rounded-lg border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-3 text-sm font-medium text-text">Ventas de hoy</h2>
          <p className="px-5 py-4 text-sm text-text-secondary">Sin ventas el día de hoy</p>
        </section>
      ) : (
        <Table
          titulo={
            <div className="flex items-center justify-between gap-4">
              <h2>Ventas de hoy</h2>
              <Link href={`${rutaBase(modo)}/ventas`} className="font-normal text-text-secondary hover:text-text">
                Ver todas →
              </Link>
            </div>
          }
        >
          <THead>
            <Th>Hora</Th>
            <Th>Venta</Th>
            <Th>Pago</Th>
            <Th align="right">Total</Th>
          </THead>
          <TBody>
            {ultimas.map((v) => (
              <Tr key={v.id}>
                <Td className="whitespace-nowrap tabular-nums text-text-secondary">{formatTime(v.fecha)}</Td>
                <Td>
                  {esDemo(modo) ? (
                    <span className="text-text">Venta #{v.id}</span>
                  ) : (
                    <EnlaceFila href={`/ventas/${v.id}`}>Venta #{v.id}</EnlaceFila>
                  )}
                </Td>
                <Td>
                  <BadgeTipoPago tipo={v.tipo_pago} />
                </Td>
                <Td align="right" className="font-medium tabular-nums text-text">
                  {formatMoney(v.total)}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
