import { Card, PageHeader } from '@/components/ui';
import { ClienteForm } from '@/components/formularios';
import { crearCliente } from '@/actions/clientes';

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Nuevo cliente" backHref="/clientes" />
      <Card>
        <ClienteForm accion={crearCliente} cancelarHref="/clientes" />
      </Card>
    </div>
  );
}
