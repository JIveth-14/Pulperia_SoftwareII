import Link from 'next/link';
import type { Producto } from '@/types';

type ProductoStock = Pick<Producto, 'id' | 'nombre' | 'stock' | 'stock_minimo'>;

interface StockBajoProps {
  productos: ProductoStock[];
  /** Máximo de productos a mostrar (el resto se resume en el enlace). */
  limite?: number;
  /** Enlace "Ver inventario" en el encabezado. */
  href?: string;
}

/** Nivel de stock relativo al mínimo: 0 = agotado, 1 = en el mínimo. */
export function nivelStock({ stock, stock_minimo }: ProductoStock): number {
  if (stock_minimo <= 0) return 1;
  return Math.min(Math.max(stock / stock_minimo, 0), 1);
}

/** Crítico si queda la mitad o menos del mínimo. */
export function esCritico(producto: ProductoStock): boolean {
  return nivelStock(producto) <= 0.5;
}

/**
 * Productos por debajo del stock mínimo, cada uno en una tarjeta con barra de
 * nivel. Los críticos van primero y en rojo; el resto en ámbar.
 */
export function StockBajo({ productos, limite, href }: StockBajoProps) {
  if (productos.length === 0) return null;

  const ordenados = [...productos].sort((a, b) => nivelStock(a) - nivelStock(b));
  const visibles = limite ? ordenados.slice(0, limite) : ordenados;
  const ocultos = ordenados.length - visibles.length;

  return (
    <section
      aria-labelledby="stock-bajo-titulo"
      className="rounded-lg border border-border bg-surface"
    >
      <header className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-warning" />
          <h2 id="stock-bajo-titulo" className="text-sm font-medium text-text">
            Stock bajo
          </h2>
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium tabular-nums text-warning">
            {productos.length}
          </span>
        </div>
        {href && (
          <Link href={href} className="text-sm text-text-secondary hover:text-text">
            {ocultos > 0 ? `Ver ${ocultos} más` : 'Ver inventario'} →
          </Link>
        )}
      </header>

      <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((producto) => {
          const critico = esCritico(producto);
          const faltan = producto.stock_minimo - producto.stock;
          const porcentaje = Math.round(nivelStock(producto) * 100);

          return (
            <li key={producto.id} className="rounded-md border border-border px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-medium text-text" title={producto.nombre}>
                  {producto.nombre}
                </p>
                <p className="shrink-0 text-sm tabular-nums text-text">
                  <span className={critico ? 'font-semibold text-danger' : 'font-semibold text-warning'}>
                    {producto.stock}
                  </span>
                  <span className="text-text-secondary"> / {producto.stock_minimo}</span>
                </p>
              </div>

              <div
                role="progressbar"
                aria-label={`Stock de ${producto.nombre}`}
                aria-valuemin={0}
                aria-valuemax={producto.stock_minimo}
                aria-valuenow={producto.stock}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className={`h-full rounded-full ${critico ? 'bg-danger' : 'bg-warning'}`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>

              <p className="mt-1.5 text-xs text-text-secondary">
                {producto.stock === 0
                  ? 'Agotado'
                  : `Faltan ${faltan} para el mínimo`}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
