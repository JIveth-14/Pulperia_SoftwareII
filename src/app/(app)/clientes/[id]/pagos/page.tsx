import Link from 'next/link';
import { EmptyState, PageHeader, Table, TBody, Td, Th, THead, Tr, buttonClass } from '@/components/ui';
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
        <Table>
          <THead>
            <Th>Fecha</Th>
            <Th>Deuda</Th>
            <Th align="right">Monto</Th>
          </THead>
          <TBody>
            {pagos.map((pago) => (
              <Tr key={pago.id}>
                <Td className="whitespace-nowrap text-text">{formatDateTime(pago.fecha_pago)}</Td>
                <Td className="text-text-secondary">#{pago.fiado_id}</Td>
                <Td align="right" className="font-medium tabular-nums text-success">
                  {formatMoney(pago.monto_pagado)}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
