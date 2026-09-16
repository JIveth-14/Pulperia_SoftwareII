import type { Producto } from '@/types';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { StockBajo } from '@/components/productos/StockBajo';
import { formatMoney } from '@/lib/format';
import { Accion, AvisoSoloLectura } from './Acciones';
import { coincide } from '@/lib/texto';
import { Buscador } from './Buscador';
import { esDemo, rutaBase, type ModoDatos } from './modo';

interface ProductosViewProps {
  productos: Producto[];
  modo?: ModoDatos;
  busqueda?: string;
}

export function ProductosView({ productos, modo = 'real', busqueda = '' }: ProductosViewProps) {
  const soloLectura = esDemo(modo);
  const filtrados = busqueda ? productos.filter((p) => coincide(p.nombre, busqueda)) : productos;
  const conStockBajo = productos.filter((p) => p.stock < p.stock_minimo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description="Gestiona tu inventario y stock"
        actions={
          <Accion href="/productos/nuevo" soloLectura={soloLectura}>
            Nuevo producto
          </Accion>
        }
      />

      {soloLectura && <AvisoSoloLectura />}

      {!busqueda && <StockBajo productos={conStockBajo} />}

      {productos.length > 0 && (
        <Buscador
          accion={`${rutaBase(modo)}/productos`}
          valor={busqueda}
          placeholder="Buscar producto…"
          resultados={filtrados.length}
        />
      )}

      {productos.length === 0 ? (
        <EmptyState
          title="Sin productos"
          message="Comienza registrando tu primer producto"
          action={soloLectura ? undefined : { label: 'Crear producto', href: '/productos/nuevo' }}
        />
      ) : filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">Ningún producto coincide con “{busqueda}”</p>
      ) : (
        <div className="grid gap-3">
          {filtrados.map((producto) => (
            <Card key={producto.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-text">{producto.nombre}</h3>
                  <div className="mt-0.5 flex gap-4 text-sm text-text-secondary">
                    <span className="tabular-nums">{formatMoney(producto.precio)}</span>
                    <span
                      className={`tabular-nums ${producto.stock < producto.stock_minimo ? 'text-danger' : ''}`}
                    >
                      Stock {producto.stock} / {producto.stock_minimo}
                    </span>
                  </div>
                </div>
                <Accion
                  href={`/productos/${producto.id}/editar`}
                  variant="secondary"
                  size="sm"
                  soloLectura={soloLectura}
                >
                  Editar
                </Accion>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
