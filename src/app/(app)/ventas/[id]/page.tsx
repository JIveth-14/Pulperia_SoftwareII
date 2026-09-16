import Link from 'next/link';
import { Card, PageHeader } from '@/components/ui';
import { getRepositories } from '@/repositories/container';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';
import { formatDateTime, formatMoney } from '@/lib/format';
import { BadgeTipoPago } from '@/components/vistas';

export default async function VentaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  const repos = await getRepositories();
  const venta = await oNotFound(repos.ventas.getConDetalle(id));
  const unidades = venta.detalles.reduce((sum, d) => sum + d.cantidad, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={`Venta #${venta.id}`} description={formatDateTime(venta.fecha)} backHref="/ventas" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-text-secondary">Total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-text">{formatMoney(venta.total)}</p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Forma de pago</p>
          <p className="mt-2">
            <BadgeTipoPago tipo={venta.tipo_pago} />
          </p>
        </Card>
        <Card>
          <p className="text-sm text-text-secondary">Cliente</p>
          {venta.cliente ? (
            <Link
              href={`/clientes/${venta.cliente.id}`}
              className="mt-1 block truncate text-lg font-medium text-text underline-offset-4 hover:underline"
            >
              {venta.cliente.nombre}
            </Link>
          ) : (
            <p className="mt-1 text-lg text-text-secondary">Sin cliente</p>
          )}
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <caption className="border-b border-border px-5 py-3 text-left text-sm font-medium text-text">
            {venta.detalles.length} producto{venta.detalles.length === 1 ? '' : 's'} · {unidades} unidad{unidades === 1 ? '' : 'es'}
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-secondary">
              <th scope="col" className="px-5 py-2.5 font-medium">Producto</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Cantidad</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Precio</th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {venta.detalles.map((d) => (
              <tr key={d.id}>
                <td className="px-5 py-3 text-text">{d.producto?.nombre ?? `Producto #${d.producto_id}`}</td>
                <td className="px-5 py-3 text-right tabular-nums text-text">{d.cantidad}</td>
                <td className="px-5 py-3 text-right tabular-nums text-text-secondary">{formatMoney(d.precio_unitario)}</td>
                <td className="px-5 py-3 text-right font-medium tabular-nums text-text">{formatMoney(d.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <th scope="row" colSpan={3} className="px-5 py-3 text-right text-sm font-medium text-text-secondary">
                Total
              </th>
              <td className="px-5 py-3 text-right text-base font-semibold tabular-nums text-text">{formatMoney(venta.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
