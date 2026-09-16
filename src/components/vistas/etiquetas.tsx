import type { EstadoFiado, TipoPago } from '@/types';
import { Badge } from '@/components/ui';

export function BadgeTipoPago({ tipo }: { tipo: TipoPago }) {
  return tipo === 'fiado' ? <Badge tone="warning">Crédito</Badge> : <Badge>Contado</Badge>;
}

export function BadgeEstadoFiado({ estado }: { estado: EstadoFiado | null }) {
  if (estado === 'pagado') return <Badge tone="success">Pagado</Badge>;
  if (estado === 'parcial') return <Badge tone="warning">Pago parcial</Badge>;
  return <Badge tone="danger">Pendiente</Badge>;
}
