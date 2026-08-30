import Link from 'next/link';

export default function VentasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-2 text-gray-600">
            Registro de todas tus ventas
          </p>
        </div>
        <Link
          href="/ventas/nueva"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nueva venta
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">
          Esta página será reemplazada por el historial de ventas en la próxima fase
        </p>
      </div>
    </div>
  );
}
