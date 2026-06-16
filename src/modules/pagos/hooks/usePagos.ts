import { useCallback, useEffect, useState } from 'react';
import type { Pago } from '../../../types';
import { getPagosByFiado } from '../services/pagosService';

export function usePagos(fiadoId: number) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPagos(await getPagosByFiado(fiadoId));
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [fiadoId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { pagos, loading, error, refetch: fetch };
}
