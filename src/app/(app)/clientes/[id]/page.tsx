export const dynamic = 'force-dynamic';

import { getRepositories } from '@/repositories/container';
import { ClienteDetalleView } from '@/components/vistas';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clienteId = parseIdOrNotFound(id);
  const repos = await getRepositories();
  const [cliente, fiados, pagos] = await Promise.all([
    oNotFound(repos.clientes.getById(clienteId)),
    repos.fiados.getByCliente(clienteId),
    repos.pagos.getByCliente(clienteId),
  ]);

  return <ClienteDetalleView cliente={cliente} fiados={fiados} pagos={pagos} />;
}
