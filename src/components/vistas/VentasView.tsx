import type { Venta } from '@/types';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { formatDate, formatMoney } from '@/lib/format';
import { Accion, AvisoSoloLectura, EnlaceTarjeta } from './Acciones';
import { esDemo, type ModoDatos } from './modo';

export function VentasView({ ventas, modo = 'real' }: { ventas: Venta[]; modo?: ModoDatos }) {
  const soloLectura = esDemo(modo);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description="Registro de todas tus ventas"
        actions={
          <Accion href="/ventas/nueva" soloLectura={soloLectura}>
            Nueva venta
          </Accion>
        }
      />

      {soloLectura && <AvisoSoloLectura />}

      {ventas.length === 0 ? (
        <EmptyState
          title="Sin ventas"
          message="Comienza registrando tu primera venta"
          action={soloLectura ? undefined : { label: 'Registrar venta', href: '/ventas/nueva' }}
        />
      ) : (
        <div className="grid gap-3">
          {ventas.map((venta) => (
            <EnlaceTarjeta key={venta.id} href={soloLectura ? undefined : `/ventas/${venta.id}`}>
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-text">Venta #{venta.id}</h3>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {formatDate(venta.fecha)} · {venta.tipo_pago === 'contado' ? 'Contado' : 'Fiado'}
                    </p>
                  </div>
                  <p className="text-lg font-semibold tabular-nums text-text">{formatMoney(venta.total)}</p>
                </div>
              </Card>
            </EnlaceTarjeta>
          ))}
        </div>
      )}
    </div>
  );
}
