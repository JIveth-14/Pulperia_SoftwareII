import Link from 'next/link';

export default async function HistorialPagosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/clientes/${id}`}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            ← Volver
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Historial de pagos - Cliente #{id}
          </h1>
        </div>
        <Link
          href={`/clientes/${id}/pagos/nuevo`}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo pago
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">
          Lista de pagos (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
