import { Card, PageHeader } from '@/components/ui';
import { ClienteForm, EliminarRegistro } from '@/components/formularios';
import { actualizarCliente, eliminarCliente } from '@/actions/clientes';
import { getRepositories } from '@/repositories/container';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  const repos = await getRepositories();
  const cliente = await oNotFound(repos.clientes.getById(id));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Editar cliente" description={cliente.nombre} backHref={`/clientes/${id}`} />
      <Card>
        <ClienteForm
          accion={actualizarCliente.bind(null, id)}
          cliente={cliente}
          cancelarHref={`/clientes/${id}`}
        />
      </Card>
      <EliminarRegistro
        accion={eliminarCliente.bind(null, id)}
        entidad="cliente"
        advertencia="Se borrarán también su historial de fiados y pagos. Solo es posible si no tiene deudas pendientes."
      />
    </div>
  );
}
