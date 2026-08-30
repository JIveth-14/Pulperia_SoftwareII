import Link from 'next/link';

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/clientes"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Volver
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Cliente #{id}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Información</h2>
          <p className="mt-4 text-gray-600">
            Detalles del cliente (se implementará en próximas fases)
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Acciones</h2>
          <div className="mt-4 space-y-2">
            <Link
              href={`/clientes/${id}/editar`}
              className="block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 text-center"
            >
              Editar
            </Link>
            <Link
              href={`/clientes/${id}/fiados/nuevo`}
              className="block rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 text-center"
            >
              Registrar fiado
            </Link>
            <Link
              href={`/clientes/${id}/pagos`}
              className="block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 text-center"
            >
              Historial de pagos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
