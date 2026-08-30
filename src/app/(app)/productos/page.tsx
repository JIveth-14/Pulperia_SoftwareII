import Link from 'next/link';

export default function ProductosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu inventario y stock
          </p>
        </div>
        <Link
          href="/productos/nuevo"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nuevo producto
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">
          Esta página será reemplazada por la lista de productos en la próxima fase
        </p>
      </div>
    </div>
  );
}
