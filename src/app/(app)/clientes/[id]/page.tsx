export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getRepositories } from '@/repositories/container';
import { Card, PageHeader, buttonClass } from '@/components/ui';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';
import type { Cliente, Fiado, Pago } from '@/types';
import { formatDate, formatMoney, formatMoneySigned } from '@/lib/format';

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = parseIdOrNotFound(id);
  const repos = await getRepositories();
  const [cliente, fiados, pagos] = await Promise.all([
    oNotFound(repos.clientes.getById(clienteId)),
    repos.fiados.getByCliente(clienteId),
    repos.pagos.getByCliente(clienteId),
  ]);

  return <ClienteDetalle cliente={cliente} fiados={fiados} pagos={pagos} />;
}

function ClienteDetalle({ cliente, fiados, pagos }: { cliente: Cliente; fiados: Fiado[]; pagos: Pago[] }) {
  const id = cliente.id;
  const saldoTotal = fiados.reduce((sum, f) => sum + Number(f.saldo_pendiente), 0);
  const fiadosPendientes = fiados.filter((f) => f.estado !== 'pagado');

  return (
    <div className="space-y-6">
      <PageHeader
        title={cliente.nombre}
        description={[cliente.telefono, cliente.direccion].filter(Boolean).join(' · ')}
        backHref="/clientes"
        actions={
          <Link href={`/clientes/${id}/editar`} className={buttonClass('secondary')}>
            Editar
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Información">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-secondary">Teléfono</dt>
              <dd className="text-text">{cliente.telefono}</dd>
            </div>
            {cliente.direccion && (
              <div>
                <dt className="text-text-secondary">Dirección</dt>
                <dd className="text-text">{cliente.direccion}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card title="Saldo">
          <p className="text-sm text-text-secondary">Saldo pendiente</p>
          <p className={`mt-1 text-3xl font-semibold tabular-nums tracking-tight ${
            saldoTotal > 0 ? 'text-danger' : 'text-text'
          }`}>
            {formatMoney(saldoTotal)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/ventas/nueva?cliente=${id}`} className={buttonClass('primary')}>
              Venta al crédito
            </Link>
            <Link href={`/clientes/${id}/fiados/nuevo`} className={buttonClass('secondary')}>
              Fiado manual
            </Link>
            {saldoTotal > 0 && (
              <Link href={`/clientes/${id}/pagos/nuevo`} className={buttonClass('secondary')}>
                Registrar pago
              </Link>
            )}
          </div>
        </Card>
      </div>

      {fiadosPendientes.length > 0 && (
        <Card title={`Deudas pendientes (${fiadosPendientes.length})`}>
          <ul className="-my-2 divide-y divide-border">
            {fiadosPendientes.map((fiado) => (
              <li key={fiado.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-text">Deuda #{fiado.id}</p>
                  <p className="text-xs text-text-secondary">{formatDate(fiado.fecha)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular-nums text-text">
                    {formatMoney(fiado.saldo_pendiente)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {fiado.estado === 'parcial' ? 'Pago parcial' : 'Pendiente'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {pagos.length > 0 && (
        <Card title={`Historial de pagos (${pagos.length})`}>
          <ul className="-my-2 divide-y divide-border">
            {pagos.slice(0, 10).map((pago) => (
              <li key={pago.id} className="flex items-center justify-between py-2">
                <p className="text-sm text-text-secondary">{formatDate(pago.fecha_pago)}</p>
                <p className="text-sm font-medium tabular-nums text-success">
                  {formatMoneySigned(pago.monto_pagado)}
                </p>
              </li>
            ))}
          </ul>
          {pagos.length > 0 && (
            <Link
              href={`/clientes/${id}/pagos`}
              className="mt-4 block text-center text-sm text-text-secondary hover:text-text"
            >
              Ver historial completo
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}
