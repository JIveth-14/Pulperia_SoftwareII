export const dynamic = 'force-dynamic';

import { Card, EmptyState } from '@/components/ui';
import { getClientesConSaldo } from '@/lib/demo/demo-data';
import { ReadOnlyNotice, DisabledButton } from '../ui';

/** Lista de clientes en modo demo (solo lectura). */
export default function DemoClientesPage() {
  const clientes = getClientesConSaldo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-2 text-gray-600">Gestiona el registro de clientes y sus deudas</p>
        </div>
        <DisabledButton label="+ Nuevo cliente" />
      </div>

      <ReadOnlyNotice />

      {clientes.length === 0 ? (
        <EmptyState icon="👥" title="Sin clientes" message="Comienza registrando tu primer cliente" />
      ) : (
        <div className="grid gap-4">
          {clientes.map((cliente) => (
            <Card key={cliente.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cliente.nombre}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <p>📱 {cliente.telefono}</p>
                    {cliente.direccion && <p>📍 {cliente.direccion}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Saldo pendiente</p>
                  <p
                    className={`text-2xl font-bold ${
                      cliente.saldo > 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    ${cliente.saldo.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
