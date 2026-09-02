export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Card, EmptyState } from '@/components/ui';

export default async function VentasPage() {
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);

  try {
    const ventas = await repos.ventas.getAll();

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
            <p className="mt-2 text-gray-600">
              Registro de todas tus ventas
            </p>
          </div>
          <Link
            href="/ventas/nueva"
            className="rounded-md bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light transition-colors"
          >
            + Nueva venta
          </Link>
        </div>

        {ventas.length === 0 ? (
          <EmptyState
            icon="🛒"
            title="Sin ventas"
            message="Comienza registrando tu primera venta"
          />
        ) : (
          <div className="grid gap-4">
            {ventas.map((venta) => (
              <Link
                key={venta.id}
                href={`/ventas/${venta.id}`}
                className="block"
              >
                <Card>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-text">
                        Venta #{venta.id}
                      </h3>
                      <div className="mt-2 flex gap-4 text-sm text-text-secondary">
                        <span>📅 {new Date(venta.fecha).toLocaleDateString()}</span>
                        <span>💳 {venta.tipo_pago === 'contado' ? 'Contado' : 'Fiado'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-text">
                        ${Number(venta.total).toFixed(2)}
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
          Error al cargar las ventas. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }
}
