import type { Cliente, Venta } from '@/types';
import { EmptyState, EnlaceFila, PageHeader, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Accion, AvisoSoloLectura } from './Acciones';
import { BadgeTipoPago } from './etiquetas';
import { esDemo, type ModoDatos } from './modo';

interface VentasViewProps {
  ventas: Venta[];
  /** Para mostrar el nombre del cliente de cada venta. */
  clientes?: Pick<Cliente, 'id' | 'nombre'>[];
  modo?: ModoDatos;
}

export function VentasView({ ventas, clientes = [], modo = 'real' }: VentasViewProps) {
  const soloLectura = esDemo(modo);
  const nombres = new Map(clientes.map((c) => [c.id, c.nombre]));
  const total = ventas.reduce((sum, v) => sum + Number(v.total), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas"
        description={
          ventas.length > 0
            ? `${ventas.length} ventas · ${formatMoney(total)} en total`
            : 'Registro de todas tus ventas'
        }
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
        <Table>
          <THead>
            <Th>Venta</Th>
            <Th ocultarEnMovil>Cliente</Th>
            <Th>Pago</Th>
            <Th align="right">Total</Th>
          </THead>
          <TBody>
            {ventas.map((venta) => (
              <Tr key={venta.id}>
                <Td>
                  {soloLectura ? (
                    <span className="font-medium text-text">Venta #{venta.id}</span>
                  ) : (
                    <EnlaceFila href={`/ventas/${venta.id}`}>Venta #{venta.id}</EnlaceFila>
                  )}
                  <span className="block text-xs text-text-secondary">{formatDateTime(venta.fecha)}</span>
                </Td>
                <Td ocultarEnMovil className="text-text-secondary">
                  {venta.cliente_id ? (nombres.get(venta.cliente_id) ?? `Cliente #${venta.cliente_id}`) : '—'}
                </Td>
                <Td>
                  <BadgeTipoPago tipo={venta.tipo_pago} />
                </Td>
                <Td align="right" className="font-medium tabular-nums text-text">
                  {formatMoney(venta.total)}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
