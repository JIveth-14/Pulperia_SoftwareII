import { Card, PageHeader } from '@/components/ui';
import { EliminarRegistro, ProductoForm } from '@/components/formularios';
import { actualizarProducto, eliminarProducto } from '@/actions/productos';
import { getRepositories } from '@/repositories/container';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  const repos = await getRepositories();
  const producto = await oNotFound(repos.productos.getById(id));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Editar producto" description={producto.nombre} backHref="/productos" />
      <Card>
        <ProductoForm
          accion={actualizarProducto.bind(null, id)}
          producto={producto}
          cancelarHref="/productos"
        />
      </Card>
      <EliminarRegistro
        accion={eliminarProducto.bind(null, id)}
        entidad="producto"
        advertencia="Solo se puede eliminar si nunca se ha vendido. Si ya tiene ventas, deja su stock en 0."
      />
    </div>
  );
}
