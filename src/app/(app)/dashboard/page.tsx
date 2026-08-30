import { getUser } from '@/lib/supabase/server-utils';

export default async function DashboardPage() {
  const user = await getUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Bienvenido a tu pulpería, {user?.email}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card title="Clientes" value="0" color="blue" />
        <Card title="Productos" value="0" color="green" />
        <Card title="Ventas del día" value="$0.00" color="indigo" />
        <Card title="Saldo pendiente" value="$0.00" color="red" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Próximos pasos
        </h2>
        <ul className="mt-4 space-y-2 text-sm text-gray-600">
          <li>✓ Registrar tu primer cliente</li>
          <li>✓ Agregar productos al inventario</li>
          <li>✓ Registrar una venta</li>
        </ul>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: 'blue' | 'green' | 'indigo' | 'red';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-900',
    green: 'bg-green-50 text-green-900',
    indigo: 'bg-indigo-50 text-indigo-900',
    red: 'bg-red-50 text-red-900',
  };

  return (
    <div className={`rounded-lg p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
