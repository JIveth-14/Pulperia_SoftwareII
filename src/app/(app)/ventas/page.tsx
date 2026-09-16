export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { VentasView } from '@/components/vistas';

export default async function VentasPage() {
  const repos = await getRepositories();
  const [ventas, clientes] = await Promise.all([repos.ventas.getAll(), repos.clientes.getAll()]);
  return <VentasView ventas={ventas} clientes={clientes} />;
}
