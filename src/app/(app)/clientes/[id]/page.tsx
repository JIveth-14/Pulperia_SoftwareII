import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Card, EmptyState } from '@/components/ui';

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);
  const clienteId = parseInt(id);

  try {
    const [cliente, fiados, pagos] = await Promise.all([
      repos.clientes.getById(clienteId),
      repos.fiados.getByCliente(clienteId),
      repos.pagos.getByCliente(clienteId),
    ]);

    const saldoTotal = fiados.reduce((sum, f) => sum + Number(f.saldo_pendiente), 0);
    const fiadosPendientes = fiados.filter((f) => f.estado !== 'pagado');

    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/clientes"
            className="text-sm text-primary hover:text-primary-light"
          >
            ← Volver
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {cliente.nombre}
          </h1>
          <p className="mt-2 text-gray-600">
            {cliente.telefono} {cliente.direccion && `• ${cliente.direccion}`}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Información */}
          <Card title="Información">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-text-secondary">Teléfono</p>
                <p className="font-semibold text-text">{cliente.telefono}</p>
              </div>
              {cliente.direccion && (
                <div>
                  <p className="text-text-secondary">Dirección</p>
                  <p className="font-semibold text-text">{cliente.direccion}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Saldo */}
          <Card title="Saldo">
            <div className="text-center">
              <p className="text-text-secondary">Saldo pendiente</p>
              <p className={`mt-2 text-4xl font-bold ${
                saldoTotal > 0 ? 'text-danger' : 'text-secondary'
              }`}>
                ${saldoTotal.toFixed(2)}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/clientes/${id}/fiados/nuevo`}
                  className="rounded-md bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light text-center"
                >
                  Registrar fiado
                </Link>
                {saldoTotal > 0 && (
                  <Link
                    href={`/clientes/${id}/pagos/nuevo`}
                    className="rounded-md bg-secondary text-white px-4 py-2 text-sm font-medium hover:bg-green-600 text-center"
                  >
                    Registrar pago
                  </Link>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Fiados pendientes */}
        {fiadosPendientes.length > 0 && (
          <Card title={`Deudas pendientes (${fiadosPendientes.length})`}>
            <div className="space-y-2">
              {fiadosPendientes.map((fiado) => (
                <div key={fiado.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-text">
                      Deuda #{fiado.id}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(fiado.fecha).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text">
                      ${Number(fiado.saldo_pendiente).toFixed(2)}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {fiado.estado === 'parcial' ? 'Pago parcial' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Historial de pagos */}
        {pagos.length > 0 && (
          <Card title={`Historial de pagos (${pagos.length})`}>
            <div className="space-y-2">
              {pagos.slice(0, 10).map((pago) => (
                <div key={pago.id} className="flex items-center justify-between border-b border-gray-100 pb-2 last:border-0">
                  <p className="text-sm text-text-secondary">
                    {new Date(pago.fecha_pago).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-semibold text-secondary">
                    +${Number(pago.monto_pagado).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            {pagos.length > 10 && (
              <Link
                href={`/clientes/${id}/pagos`}
                className="mt-4 block text-center text-sm text-primary hover:text-primary-light font-medium"
              >
                Ver todos los pagos
              </Link>
            )}
          </Card>
        )}

        {/* Acciones */}
        <div className="flex gap-2">
          <Link
            href={`/clientes/${id}/editar`}
            className="flex-1 rounded-md bg-gray-200 text-text px-4 py-2 text-sm font-medium hover:bg-gray-300 text-center"
          >
            Editar cliente
          </Link>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">
          Error al cargar el cliente. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }
}
