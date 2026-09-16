export const dynamic = 'force-dynamic';

import { Card, EmptyState } from '@/components/ui';
import { createDemoRepositories } from '@/repositories/container';
import { ReadOnlyNotice, DisabledButton } from '../ui';

/** Inventario en modo demo (solo lectura). */
export default async function DemoProductosPage() {
  const productos = await createDemoRepositories().productos.getAll();
  const conStockBajo = productos.filter((p) => p.stock < p.stock_minimo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="mt-2 text-gray-600">Gestiona tu inventario y stock</p>
        </div>
        <DisabledButton label="+ Nuevo producto" />
      </div>

      <ReadOnlyNotice />

      {conStockBajo.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="font-semibold text-yellow-900">⚠️ Productos con stock bajo</h3>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-800">
            {conStockBajo.map((p) => (
              <li key={p.id}>
                {p.nombre}: {p.stock}/{p.stock_minimo} unidades
              </li>
            ))}
          </ul>
        </div>
      )}

      {productos.length === 0 ? (
        <EmptyState icon="📦" title="Sin productos" message="Comienza registrando tu primer producto" />
      ) : (
        <div className="grid gap-4">
          {productos.map((producto) => (
            <Card key={producto.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{producto.nombre}</h3>
                  <div className="mt-2 flex gap-4 text-sm text-gray-600">
                    <span>💵 ${Number(producto.precio).toFixed(2)}</span>
                    <span className={producto.stock < producto.stock_minimo ? 'text-red-600' : 'text-green-600'}>
                      📦 {producto.stock} / {producto.stock_minimo}
                    </span>
                  </div>
                </div>
                <DisabledButton label="Editar" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
