import { PageHeader } from '@/components/ui';
import { parseIdOrNotFound } from '@/lib/params';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseIdOrNotFound(rawId);
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar cliente #${id}`}
        backHref={`/clientes/${id}`}
      />

      <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          Formulario de edición (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
