import { PageHeader } from '@/components/ui';

export default function NuevoProductoPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo producto"
        backHref="/productos"
      />

      <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">
          Formulario de nuevo producto (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
