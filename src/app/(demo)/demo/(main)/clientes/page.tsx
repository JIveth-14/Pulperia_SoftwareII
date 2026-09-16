export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { ClientesView } from '@/components/vistas';

/** Lista de clientes en modo demo (solo lectura). */
export default async function DemoClientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, repos] = await Promise.all([searchParams, getRepositories('demo')]);
  return <ClientesView clientes={await repos.clientes.getConSaldo()} modo="demo" busqueda={q} />;
}
