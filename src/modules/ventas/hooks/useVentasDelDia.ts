import { useCallback, useEffect, useState } from 'react';
import type { Venta } from '../../../types';
import { getVentasDelDia } from '../services/ventasService';

export function useVentasDelDia() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVentas(await getVentasDelDia());
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { ventas, loading, error, refetch: fetch };
}
