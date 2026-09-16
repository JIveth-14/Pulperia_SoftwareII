import type { Producto } from '@/types';
import { Badge, EmptyState, PageHeader, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { StockBajo } from '@/components/productos/StockBajo';
import { formatMoney } from '@/lib/format';
import { coincide } from '@/lib/texto';
import { Accion, AvisoSoloLectura } from './Acciones';
import { Buscador } from './Buscador';
import { esDemo, rutaBase, type ModoDatos } from './modo';

interface ProductosViewProps {
  productos: Producto[];
  modo?: ModoDatos;
  busqueda?: string;
}

export function ProductosView({ productos, modo = 'real', busqueda = '' }: ProductosViewProps) {
  const soloLectura = esDemo(modo);
  const conStockBajo = productos.filter((p) => p.stock < p.stock_minimo);
  const filtrados = busqueda ? productos.filter((p) => coincide(p.nombre, busqueda)) : productos;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos"
        description={
          productos.length > 0
            ? `${productos.length} productos · ${conStockBajo.length} con stock bajo`
            : 'Gestiona tu inventario y stock'
        }
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
        <Table>
          <THead>
            <Th>Producto</Th>
            <Th align="right">Precio</Th>
            <Th align="right">Stock</Th>
            <Th align="right" ocultarEnMovil>
              Mínimo
            </Th>
            <Th align="right">
              <span className="sr-only">Acciones</span>
            </Th>
          </THead>
          <TBody>
            {filtrados.map((producto) => {
              const agotado = producto.stock === 0;
              const bajo = producto.stock < producto.stock_minimo;
              return (
                <Tr key={producto.id}>
                  <Td>
                    <span className="font-medium text-text">{producto.nombre}</span>
                  </Td>
                  <Td align="right" className="tabular-nums text-text">
                    {formatMoney(producto.precio)}
                  </Td>
                  <Td align="right">
                    <span className="inline-flex items-center justify-end gap-2">
                      {agotado ? (
                        <Badge tone="danger">Agotado</Badge>
                      ) : (
                        bajo && (
                          <span className="hidden sm:inline-flex">
                            <Badge tone="warning">Bajo</Badge>
                          </span>
                        )
                      )}
                      <span className={`tabular-nums ${bajo ? 'font-medium text-danger' : 'text-text'}`}>
                        {producto.stock}
                      </span>
                    </span>
                  </Td>
                  <Td align="right" ocultarEnMovil className="tabular-nums text-text-secondary">
                    {producto.stock_minimo}
                  </Td>
                  <Td align="right">
                    <Accion
                      href={`/productos/${producto.id}/editar`}
                      variant="secondary"
                      size="sm"
                      soloLectura={soloLectura}
                    >
                      Editar
                    </Accion>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
