import { PageHeader } from '@/components/ui';

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo cliente"
        backHref="/clientes"
      />

      <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          Formulario de nuevo cliente (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
