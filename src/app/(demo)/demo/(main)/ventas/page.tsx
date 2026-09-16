export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { VentasView } from '@/components/vistas';

/** Registro de ventas en modo demo (solo lectura). */
export default async function DemoVentasPage() {
  const repos = await getRepositories('demo');
  return <VentasView ventas={await repos.ventas.getAll()} modo="demo" />;
}
