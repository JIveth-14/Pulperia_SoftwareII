export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { VentasView } from '@/components/vistas';

export default async function VentasPage() {
  const repos = await getRepositories();
  return <VentasView ventas={await repos.ventas.getAll()} />;
}
