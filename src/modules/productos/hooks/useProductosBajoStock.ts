import { useMemo } from 'react';
import { useProductos } from './useProductos';

export function useProductosBajoStock() {
  const { productos, loading, error, refetch } = useProductos();
  const bajoStock = useMemo(
    () => productos.filter((p) => p.stock <= p.stock_minimo),
    [productos]
  );
  return { productos: bajoStock, loading, error, refetch };
}
