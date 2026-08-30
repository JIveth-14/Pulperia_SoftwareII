import Link from 'next/link';

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/clientes"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          ← Volver
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Nuevo cliente</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">
          Formulario de nuevo cliente (se implementará en próximas fases)
        </p>
      </div>
    </div>
  );
}
