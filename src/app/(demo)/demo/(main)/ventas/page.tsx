export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { VentasView } from '@/components/vistas';

/** Registro de ventas en modo demo (solo lectura). */
export default async function DemoVentasPage() {
  const repos = await getRepositories('demo');
  const [ventas, clientes] = await Promise.all([repos.ventas.getAll(), repos.clientes.getAll()]);
  return <VentasView ventas={ventas} clientes={clientes} modo="demo" />;
}
