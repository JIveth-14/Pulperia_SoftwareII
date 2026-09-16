import type { ClienteConSaldo } from '@/types';
import { Badge, EmptyState, EnlaceFila, PageHeader, Table, TBody, Td, Th, THead, Tr } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { coincide } from '@/lib/texto';
import { Accion, AvisoSoloLectura } from './Acciones';
import { Buscador } from './Buscador';
import { esDemo, rutaBase, type ModoDatos } from './modo';

interface ClientesViewProps {
  clientes: ClienteConSaldo[];
  modo?: ModoDatos;
  busqueda?: string;
}

export function ClientesView({ clientes, modo = 'real', busqueda = '' }: ClientesViewProps) {
  const soloLectura = esDemo(modo);
  const filtrados = busqueda
    ? clientes.filter((c) => coincide(c.nombre, busqueda) || c.telefono.includes(busqueda.trim()))
    : clientes;
  const porCobrar = clientes.reduce((sum, c) => sum + c.saldo, 0);
  const conDeuda = clientes.filter((c) => c.saldo > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description={
          clientes.length > 0
            ? `${clientes.length} clientes · ${conDeuda} con deuda · ${formatMoney(porCobrar)} por cobrar`
            : 'Gestiona el registro de clientes y sus deudas'
        }
        actions={
          <Accion href="/clientes/nuevo" soloLectura={soloLectura}>
            Nuevo cliente
          </Accion>
        }
      />

      {soloLectura && <AvisoSoloLectura />}

      {clientes.length > 0 && (
        <Buscador
          accion={`${rutaBase(modo)}/clientes`}
          valor={busqueda}
          placeholder="Buscar por nombre o teléfono…"
          resultados={filtrados.length}
        />
      )}

      {clientes.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          message="Comienza registrando tu primer cliente"
          action={soloLectura ? undefined : { label: 'Crear cliente', href: '/clientes/nuevo' }}
        />
      ) : filtrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-secondary">Ningún cliente coincide con “{busqueda}”</p>
      ) : (
        <Table>
          <THead>
            <Th>Cliente</Th>
            <Th ocultarEnMovil>Dirección</Th>
            <Th align="right">Saldo</Th>
          </THead>
          <TBody>
            {filtrados.map((cliente) => (
              <Tr key={cliente.id} href={soloLectura ? undefined : `/clientes/${cliente.id}`}>
                <Td>
                  {soloLectura ? (
                    <span className="font-medium text-text">{cliente.nombre}</span>
                  ) : (
                    <EnlaceFila href={`/clientes/${cliente.id}`}>{cliente.nombre}</EnlaceFila>
                  )}
                  <span className="block text-xs text-text-secondary">{cliente.telefono}</span>
                </Td>
                <Td ocultarEnMovil className="text-text-secondary">
                  {cliente.direccion ?? '—'}
                </Td>
                <Td align="right">
                  {cliente.saldo > 0 ? (
                    <span className="font-medium tabular-nums text-danger">{formatMoney(cliente.saldo)}</span>
                  ) : (
                    <Badge tone="success">Al día</Badge>
                  )}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
