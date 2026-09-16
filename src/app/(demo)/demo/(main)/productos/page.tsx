export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { ProductosView } from '@/components/vistas';

/** Inventario en modo demo (solo lectura). */
export default async function DemoProductosPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, repos] = await Promise.all([searchParams, getRepositories('demo')]);
  return <ProductosView productos={await repos.productos.getAll()} modo="demo" busqueda={q} />;
}
