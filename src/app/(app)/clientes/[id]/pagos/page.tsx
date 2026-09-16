import Link from 'next/link';
import { EmptyState, PageHeader, buttonClass } from '@/components/ui';
import { getRepositories } from '@/repositories/container';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';
import { formatDateTime, formatMoney } from '@/lib/format';

export default async function HistorialPagosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  const repos = await getRepositories();
  const [cliente, pagos] = await Promise.all([
    oNotFound(repos.clientes.getById(id)),
    repos.pagos.getByCliente(id),
  ]);
  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto_pagado), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de pagos"
        description={`${cliente.nombre} · ${pagos.length} pago${pagos.length === 1 ? '' : 's'} · ${formatMoney(totalPagado)} abonados`}
        backHref={`/clientes/${id}`}
        actions={
          <Link href={`/clientes/${id}/pagos/nuevo`} className={buttonClass('primary')}>
            Registrar pago
          </Link>
        }
      />

      {pagos.length === 0 ? (
        <EmptyState title="Sin pagos" message="Este cliente todavía no ha hecho abonos." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-text-secondary">
                <th scope="col" className="px-5 py-2.5 font-medium">Fecha</th>
                <th scope="col" className="px-5 py-2.5 font-medium">Deuda</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pagos.map((pago) => (
                <tr key={pago.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-text">{formatDateTime(pago.fecha_pago)}</td>
                  <td className="px-5 py-3 text-text-secondary">#{pago.fiado_id}</td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums text-success">
                    {formatMoney(pago.monto_pagado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
