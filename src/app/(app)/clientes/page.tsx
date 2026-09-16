export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Alert, Card, EmptyState, PageHeader, buttonClass } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export default async function ClientesPage() {
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);

  try {
    const clientes = await repos.clientes.getConSaldo();

    return (
      <div className="space-y-6">
        <PageHeader
          title="Clientes"
          description="Gestiona el registro de clientes y sus deudas"
          actions={
            <Link href="/clientes/nuevo" className={buttonClass('primary')}>
              Nuevo cliente
            </Link>
          }
        />

        {clientes.length === 0 ? (
          <EmptyState
            title="Sin clientes"
            message="Comienza registrando tu primer cliente"
            action={{
              label: 'Crear cliente',
              href: '/clientes/nuevo',
            }}
          />
        ) : (
          <div className="grid gap-3">
            {clientes.map((cliente) => (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="block rounded-lg transition-colors hover:[&>div]:border-border-strong"
              >
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-text">
                        {cliente.nombre}
                      </h3>
                      <p className="mt-0.5 text-sm text-text-secondary">
                        {cliente.telefono}
                        {cliente.direccion && ` · ${cliente.direccion}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Saldo pendiente</p>
                      <p className={`text-lg font-semibold tabular-nums ${
                        cliente.saldo > 0 ? 'text-danger' : 'text-text'
                      }`}>
                        {formatMoney(cliente.saldo)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return <Alert tone="danger">Error al cargar los clientes. Por favor, intenta de nuevo más tarde.</Alert>;
  }
}
