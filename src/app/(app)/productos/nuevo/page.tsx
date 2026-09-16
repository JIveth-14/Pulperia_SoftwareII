import { Card, PageHeader } from '@/components/ui';
import { ProductoForm } from '@/components/formularios';
import { crearProducto } from '@/actions/productos';

export default function NuevoProductoPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Nuevo producto" backHref="/productos" />
      <Card>
        <ProductoForm accion={crearProducto} cancelarHref="/productos" />
      </Card>
    </div>
  );
}
