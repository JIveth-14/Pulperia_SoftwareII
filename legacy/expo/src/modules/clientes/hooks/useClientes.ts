import { useCallback, useEffect, useState } from 'react';
import type { ClienteConSaldo } from '../../../types';
import { getClientesConSaldo } from '../services/clientesService';

export function useClientes() {
  const [clientes, setClientes] = useState<ClienteConSaldo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientesConSaldo();
      setClientes(data);
    } catch (e: any) {
      setError(e.message ?? 'Error de conexión');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { clientes, loading, error, refetch: fetch };
}
