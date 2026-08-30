import Link from 'next/link';
import { createClientServer } from '@/lib/supabase';
import { createRepositories } from '@/repositories/container';
import { Card, EmptyState } from '@/components/ui';

export default async function ProductosPage() {
  const supabase = await createClientServer();
  const repos = createRepositories(supabase);

  try {
    const productos = await repos.productos.getAll();
    const conStockBajo = productos.filter((p) => p.stock < p.stock_minimo);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
            <p className="mt-2 text-gray-600">
              Gestiona tu inventario y stock
            </p>
          </div>
          <Link
            href="/productos/nuevo"
            className="rounded-md bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-light transition-colors"
          >
            + Nuevo producto
          </Link>
        </div>

        {conStockBajo.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="font-semibold text-yellow-900">
              ⚠️ Productos con stock bajo
            </h3>
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
          <EmptyState
            icon="📦"
            title="Sin productos"
            message="Comienza registrando tu primer producto"
          />
        ) : (
          <div className="grid gap-4">
            {productos.map((producto) => (
              <Card key={producto.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text">
                      {producto.nombre}
                    </h3>
                    <div className="mt-2 flex gap-4 text-sm text-text-secondary">
                      <span>💵 ${Number(producto.precio).toFixed(2)}</span>
                      <span className={`${
                        producto.stock < producto.stock_minimo
                          ? 'text-danger'
                          : 'text-secondary'
                      }`}>
                        📦 {producto.stock} / {producto.stock_minimo}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/productos/${producto.id}/editar`}
                    className="rounded-md bg-gray-200 text-text px-3 py-2 text-sm font-medium hover:bg-gray-300"
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
  } catch (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-700">
          Error al cargar los productos. Por favor, intenta de nuevo más tarde.
        </p>
      </div>
    );
  }
}
