export const dynamic = 'force-dynamic';

import { Card, EmptyState, PageHeader } from '@/components/ui';
import { createDemoRepositories } from '@/repositories/container';
import { formatMoney } from '@/lib/format';
import { ReadOnlyNotice, DisabledButton } from '../ui';

/** Lista de clientes en modo demo (solo lectura). */
export default async function DemoClientesPage() {
  const clientes = await createDemoRepositories().clientes.getConSaldo();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona el registro de clientes y sus deudas"
        actions={<DisabledButton label="Nuevo cliente" />}
      />

      <ReadOnlyNotice />

      {clientes.length === 0 ? (
        <EmptyState title="Sin clientes" message="Comienza registrando tu primer cliente" />
      ) : (
        <div className="grid gap-3">
          {clientes.map((cliente) => (
            <Card key={cliente.id}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-text">{cliente.nombre}</h3>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    {cliente.telefono}
                    {cliente.direccion && ` · ${cliente.direccion}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">Saldo pendiente</p>
                  <p
                    className={`text-lg font-semibold tabular-nums ${
                      cliente.saldo > 0 ? 'text-danger' : 'text-text'
                    }`}
                  >
                    {formatMoney(cliente.saldo)}
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
