export const dynamic = 'force-dynamic';

import { Alert, Card, EmptyState, PageHeader } from '@/components/ui';
import { createDemoRepositories } from '@/repositories/container';
import { formatMoney } from '@/lib/format';
import { ReadOnlyNotice, DisabledButton } from '../ui';

/** Inventario en modo demo (solo lectura). */
export default async function DemoProductosPage() {
  const productos = await createDemoRepositories().productos.getAll();
  const conStockBajo = productos.filter((p) => p.stock < p.stock_minimo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona tu inventario y stock"
        actions={<DisabledButton label="Nuevo producto" />}
      />

      <ReadOnlyNotice />

      {conStockBajo.length > 0 && (
        <Alert tone="warning" title="Productos con stock bajo">
          <ul className="space-y-0.5">
            {conStockBajo.map((p) => (
              <li key={p.id}>
                {p.nombre}: <span className="tabular-nums">{p.stock}/{p.stock_minimo}</span> unidades
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {productos.length === 0 ? (
        <EmptyState title="Sin productos" message="Comienza registrando tu primer producto" />
      ) : (
        <div className="grid gap-3">
          {productos.map((producto) => (
            <Card key={producto.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-text">{producto.nombre}</h3>
                  <div className="mt-0.5 flex gap-4 text-sm text-text-secondary">
                    <span className="tabular-nums">{formatMoney(producto.precio)}</span>
                    <span className={`tabular-nums ${producto.stock < producto.stock_minimo ? 'text-danger' : ''}`}>
                      Stock {producto.stock} / {producto.stock_minimo}
                    </span>
                  </div>
                </div>
                <DisabledButton label="Editar" size="sm" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
