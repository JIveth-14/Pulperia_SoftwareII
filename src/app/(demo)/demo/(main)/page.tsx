export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { DashboardView, cargarDashboard } from '@/components/vistas';

/** Dashboard del modo demo (misma vista que /dashboard, con datos ficticios). */
export default async function DemoDashboardPage() {
  const repos = await getRepositories('demo');
  return <DashboardView datos={await cargarDashboard(repos)} modo="demo" />;
}
