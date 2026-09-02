export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Card, EmptyState } from '@/components/ui';

export default async function ClientesPage() {
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);

  try {
    const clientes = await repos.clientes.getConSaldo();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
            <p className="mt-2 text-gray-600">
              Gestiona el registro de clientes y sus deudas
            </p>
          </div>
          <Link
            href="/clientes/nuevo"
            className="rounded-md bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light transition-colors"
          >
            + Nuevo cliente
          </Link>
        </div>

        {clientes.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Sin clientes"
            message="Comienza registrando tu primer cliente"
            action={{
              label: 'Crear cliente',
              onClick: () => {},
            }}
          />
        ) : (
          <div className="grid gap-4">
            {clientes.map((cliente) => (
              <Link
                key={cliente.id}
                href={`/clientes/${cliente.id}`}
                className="block"
              >
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text">
                        {cliente.nombre}
                      </h3>
                      <div className="mt-2 space-y-1 text-sm text-text-secondary">
                        <p>📱 {cliente.telefono}</p>
                        {cliente.direccion && (
                          <p>📍 {cliente.direccion}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">Saldo pendiente</p>
                      <p className={`text-2xl font-bold ${
                        cliente.saldo > 0 ? 'text-danger' : 'text-secondary'
                      }`}>
                        ${cliente.saldo.toFixed(2)}
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
  } catch (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">
          Error al cargar los clientes. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }
}
