export const dynamic = 'force-dynamic';

import { EmptyState, PageHeader } from '@/components/ui';
import { NuevaVentaForm } from '@/components/formularios';
import { registrarVenta } from '@/actions/ventas';
import { getRepositories } from '@/repositories/container';

export default async function NuevaVentaPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const [{ cliente }, repos] = await Promise.all([searchParams, getRepositories()]);
  const [productos, clientes] = await Promise.all([repos.productos.getAll(), repos.clientes.getAll()]);
  const clienteInicial = clientes.find((c) => c.id === Number(cliente))?.id;

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva venta" backHref="/ventas" />
      {productos.length === 0 ? (
        <EmptyState
          title="Sin productos"
          message="Registra productos en el inventario antes de vender."
          action={{ label: 'Crear producto', href: '/productos/nuevo' }}
        />
      ) : (
        <NuevaVentaForm
          accion={registrarVenta}
          productos={productos.map(({ id, nombre, precio, stock }) => ({ id, nombre, precio, stock }))}
          clientes={clientes.map(({ id, nombre }) => ({ id, nombre }))}
          clienteInicial={clienteInicial}
        />
      )}
    </div>
  );
}
