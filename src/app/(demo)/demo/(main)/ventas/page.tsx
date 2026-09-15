export const dynamic = 'force-dynamic';

import { Card, EmptyState } from '@/components/ui';
import { getVentas } from '@/lib/demo/demo-data';
import { ReadOnlyNotice, DisabledButton } from '../ui';

/** Registro de ventas en modo demo (solo lectura). */
export default function DemoVentasPage() {
  const ventas = getVentas();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="mt-2 text-gray-600">Registro de todas tus ventas</p>
        </div>
        <DisabledButton label="+ Nueva venta" />
      </div>

      <ReadOnlyNotice />

      {ventas.length === 0 ? (
        <EmptyState icon="🛒" title="Sin ventas" message="Comienza registrando tu primera venta" />
      ) : (
        <div className="grid gap-4">
          {ventas.map((venta) => (
            <Card key={venta.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Venta #{venta.id}</h3>
                  <div className="mt-2 flex gap-4 text-sm text-gray-600">
                    <span>📅 {venta.fecha ? new Date(venta.fecha).toLocaleDateString() : 'Sin fecha'}</span>
                    <span>💳 {venta.tipo_pago === 'contado' ? 'Contado' : 'Fiado'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">${Number(venta.total).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
