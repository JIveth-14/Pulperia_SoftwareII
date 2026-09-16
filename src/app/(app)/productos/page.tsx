export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Alert, Card, EmptyState, PageHeader, buttonClass } from '@/components/ui';
import { formatMoney } from '@/lib/format';

export default async function ProductosPage() {
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);

  try {
    const productos = await repos.productos.getAll();
    const conStockBajo = productos.filter((p) => p.stock < p.stock_minimo);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Productos"
          description="Gestiona tu inventario y stock"
          actions={
            <Link href="/productos/nuevo" className={buttonClass('primary')}>
              Nuevo producto
            </Link>
          }
        />

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
          <EmptyState
            title="Sin productos"
            message="Comienza registrando tu primer producto"
            action={{ label: 'Crear producto', href: '/productos/nuevo' }}
          />
        ) : (
          <div className="grid gap-3">
            {productos.map((producto) => (
              <Card key={producto.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-text">
                      {producto.nombre}
                    </h3>
                    <div className="mt-0.5 flex gap-4 text-sm text-text-secondary">
                      <span className="tabular-nums">{formatMoney(producto.precio)}</span>
                      <span className={`tabular-nums ${
                        producto.stock < producto.stock_minimo ? 'text-danger' : ''
                      }`}>
                        Stock {producto.stock} / {producto.stock_minimo}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/productos/${producto.id}/editar`}
                    className={buttonClass('secondary', 'sm')}
                  >
                    Editar
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } catch {
    return <Alert tone="danger">Error al cargar los productos. Por favor, intenta de nuevo más tarde.</Alert>;
  }
}
