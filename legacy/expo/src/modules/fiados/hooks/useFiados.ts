import { useCallback, useEffect, useState } from 'react';
import type { Fiado } from '../../../types';
import { getFiadosByCliente } from '../services/fiadosService';

export function useFiados(clienteId: number) {
  const [fiados, setFiados] = useState<Fiado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiados(await getFiadosByCliente(clienteId));
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { fiados, loading, error, refetch: fetch };
}
