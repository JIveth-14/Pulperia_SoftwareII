import Link from 'next/link';
import type { Cliente, Fiado, Pago } from '@/types';
import { EmptyState, MetricCard, PageHeader, Table, TBody, Td, Th, THead, Tr, buttonClass } from '@/components/ui';
import { formatDate, formatMoney, formatMoneySigned } from '@/lib/format';
import { BadgeEstadoFiado } from './etiquetas';

/** Ficha del cliente: saldo, deudas pendientes y últimos pagos. */
export function ClienteDetalleView({ cliente, fiados, pagos }: { cliente: Cliente; fiados: Fiado[]; pagos: Pago[] }) {
  const id = cliente.id;
  const saldoTotal = fiados.reduce((sum, f) => sum + Number(f.saldo_pendiente), 0);
  const fiadosPendientes = fiados.filter((f) => f.estado !== 'pagado' && Number(f.saldo_pendiente) > 0);
  const totalAbonado = pagos.reduce((sum, p) => sum + Number(p.monto_pagado), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={cliente.nombre}
        description={[cliente.telefono, cliente.direccion].filter(Boolean).join(' · ')}
        backHref="/clientes"
        actions={
          <>
            <Link href={`/clientes/${id}/editar`} className={buttonClass('secondary')}>
              Editar
            </Link>
            <Link href={`/ventas/nueva?cliente=${id}`} className={buttonClass('primary')}>
              Venta al crédito
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          title="Saldo pendiente"
          value={formatMoney(saldoTotal)}
          tone={saldoTotal > 0 ? 'danger' : 'default'}
          detalle={saldoTotal > 0 ? 'por cobrar' : 'al día'}
        />
        <MetricCard
          title="Deudas activas"
          value={fiadosPendientes.length.toString()}
          detalle={`${fiados.length} en total`}
        />
        <MetricCard
          title="Total abonado"
          value={formatMoney(totalAbonado)}
          detalle={`${pagos.length} pago${pagos.length === 1 ? '' : 's'}`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {saldoTotal > 0 && (
          <Link href={`/clientes/${id}/pagos/nuevo`} className={buttonClass('primary')}>
            Registrar pago
          </Link>
        )}
        <Link href={`/clientes/${id}/fiados/nuevo`} className={buttonClass('secondary')}>
          Fiado manual
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {fiadosPendientes.length === 0 ? (
          <EmptyState title="Sin deudas pendientes" message="Este cliente está al día." />
        ) : (
          <Table titulo={`Deudas pendientes (${fiadosPendientes.length})`}>
            <THead>
              <Th>Deuda</Th>
              <Th>Estado</Th>
              <Th align="right">Saldo</Th>
            </THead>
            <TBody>
              {fiadosPendientes.map((fiado) => (
                <Tr key={fiado.id}>
                  <Td>
                    <span className="text-text">#{fiado.id}</span>
                    <span className="block text-xs text-text-secondary">
                      {formatDate(fiado.fecha)} · de {formatMoney(fiado.monto_total)}
                    </span>
                  </Td>
                  <Td>
                    <BadgeEstadoFiado estado={fiado.estado} />
                  </Td>
                  <Td align="right" className="font-medium tabular-nums text-danger">
                    {formatMoney(fiado.saldo_pendiente)}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}

        {pagos.length === 0 ? (
          <EmptyState title="Sin pagos" message="Todavía no hay abonos registrados." />
        ) : (
          <Table
            titulo={
              <div className="flex items-center justify-between gap-4">
                <span>Últimos pagos</span>
                <Link href={`/clientes/${id}/pagos`} className="font-normal text-text-secondary hover:text-text">
                  Ver todos ({pagos.length}) →
                </Link>
              </div>
            }
          >
            <THead>
              <Th>Fecha</Th>
              <Th ocultarEnMovil>Deuda</Th>
              <Th align="right">Monto</Th>
            </THead>
            <TBody>
              {pagos.slice(0, 5).map((pago) => (
                <Tr key={pago.id}>
                  <Td className="whitespace-nowrap text-text">{formatDate(pago.fecha_pago)}</Td>
                  <Td ocultarEnMovil className="text-text-secondary">
                    #{pago.fiado_id}
                  </Td>
                  <Td align="right" className="font-medium tabular-nums text-success">
                    {formatMoneySigned(pago.monto_pagado)}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
