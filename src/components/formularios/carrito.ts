import type { LineaVentaInput, Producto } from '@/types';

export type ProductoVenta = Pick<Producto, 'id' | 'nombre' | 'precio' | 'stock'>;

/** Cantidades por id de producto. Inmutable: cada operación devuelve uno nuevo. */
export type Carrito = Readonly<Record<number, number>>;

export const CARRITO_VACIO: Carrito = {};

/** Fija la cantidad de un producto entre 0 y su stock; 0 lo quita. */
export function fijarCantidad(carrito: Carrito, producto: ProductoVenta, cantidad: number): Carrito {
  const limpia = Number.isFinite(cantidad) ? Math.trunc(cantidad) : 0;
  const acotada = Math.max(0, Math.min(limpia, producto.stock));
  const { [producto.id]: _anterior, ...resto } = carrito;
  return acotada === 0 ? resto : { ...resto, [producto.id]: acotada };
}

export function agregar(carrito: Carrito, producto: ProductoVenta): Carrito {
  return fijarCantidad(carrito, producto, (carrito[producto.id] ?? 0) + 1);
}

export function quitar(carrito: Carrito, producto: ProductoVenta): Carrito {
  return fijarCantidad(carrito, producto, 0);
}

export function lineasDelCarrito(carrito: Carrito): LineaVentaInput[] {
  return Object.entries(carrito).map(([id, cantidad]) => ({ producto_id: Number(id), cantidad }));
}

export function totalDelCarrito(carrito: Carrito, productos: ProductoVenta[]): number {
  const porId = new Map(productos.map((p) => [p.id, p]));
  const total = Object.entries(carrito).reduce(
    (suma, [id, cantidad]) => suma + Number(porId.get(Number(id))?.precio ?? 0) * cantidad,
    0
  );
  return Math.round(total * 100) / 100;
}

export { coincide } from '@/lib/texto';
