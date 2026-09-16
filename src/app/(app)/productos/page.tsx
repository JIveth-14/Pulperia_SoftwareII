export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { ProductosView } from '@/components/vistas';

export default async function ProductosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, repos] = await Promise.all([searchParams, getRepositories()]);
  return <ProductosView productos={await repos.productos.getAll()} busqueda={q} />;
}
