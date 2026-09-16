export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { ClientesView } from '@/components/vistas';

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, repos] = await Promise.all([searchParams, getRepositories()]);
  return <ClientesView clientes={await repos.clientes.getConSaldo()} busqueda={q} />;
}
