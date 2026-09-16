import { Card, PageHeader } from '@/components/ui';
import { FiadoForm } from '@/components/formularios';
import { registrarFiado } from '@/actions/clientes';
import { getRepositories } from '@/repositories/container';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';

export default async function NuevoFiadoPage({
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
      <PageHeader title="Registrar fiado" description={cliente.nombre} backHref={`/clientes/${id}`} />
      <Card>
        <FiadoForm accion={registrarFiado.bind(null, id)} cancelarHref={`/clientes/${id}`} />
      </Card>
    </div>
  );
}
