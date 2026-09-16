import { getRepositories } from '@/repositories/container';
import { DashboardView, cargarDashboard } from '@/components/vistas';

export default async function DashboardPage() {
  const repos = await getRepositories();
  return <DashboardView datos={await cargarDashboard(repos)} />;
}
