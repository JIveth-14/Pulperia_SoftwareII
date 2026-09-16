import { Card, EmptyState, PageHeader } from '@/components/ui';
import { PagoForm } from '@/components/formularios';
import { registrarPago } from '@/actions/clientes';
import { getRepositories } from '@/repositories/container';
import { oNotFound, parseIdOrNotFound } from '@/lib/params';
import { formatMoney } from '@/lib/format';

export default async function NuevoPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  const repos = await getRepositories();
  const [cliente, fiados] = await Promise.all([
    oNotFound(repos.clientes.getById(id)),
    repos.fiados.getByCliente(id),
  ]);

  // Primero las deudas más antiguas.
  const pendientes = fiados
    .filter((f) => f.estado !== 'pagado' && Number(f.saldo_pendiente) > 0)
    .sort((a, b) => a.id - b.id);
  const saldo = pendientes.reduce((sum, f) => sum + Number(f.saldo_pendiente), 0);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Registrar pago"
        description={`${cliente.nombre} · debe ${formatMoney(saldo)}`}
        backHref={`/clientes/${id}`}
      />
      {pendientes.length === 0 ? (
        <EmptyState
          title="Sin deudas pendientes"
          message={`${cliente.nombre} no tiene saldo por pagar.`}
          action={{ label: 'Volver al cliente', href: `/clientes/${id}` }}
        />
      ) : (
        <Card>
          <PagoForm accion={registrarPago.bind(null, id)} fiados={pendientes} cancelarHref={`/clientes/${id}`} />
        </Card>
      )}
    </div>
  );
}
