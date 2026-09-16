import { PageHeader } from '@/components/ui';
import { parseIdOrNotFound } from '@/lib/params';

export default async function NuevoPagoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Registrar pago - Cliente #${id}`}
        backHref={`/clientes/${id}/pagos`}
      />

      <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          Formulario de nuevo pago (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
