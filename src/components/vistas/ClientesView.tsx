import type { ClienteConSaldo } from '@/types';
import { Card, EmptyState, PageHeader } from '@/components/ui';
import { formatMoney } from '@/lib/format';
import { Accion, AvisoSoloLectura, EnlaceTarjeta } from './Acciones';
import { coincide } from '@/lib/texto';
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona el registro de clientes y sus deudas"
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
        <div className="grid gap-3">
          {filtrados.map((cliente) => (
            <EnlaceTarjeta key={cliente.id} href={soloLectura ? undefined : `/clientes/${cliente.id}`}>
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-text">{cliente.nombre}</h3>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {cliente.telefono}
                      {cliente.direccion && ` · ${cliente.direccion}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Saldo pendiente</p>
                    <p
                      className={`text-lg font-semibold tabular-nums ${
                        cliente.saldo > 0 ? 'text-danger' : 'text-text'
                      }`}
                    >
                      {formatMoney(cliente.saldo)}
                    </p>
                  </div>
                </div>
              </Card>
            </EnlaceTarjeta>
          ))}
        </div>
      )}
    </div>
  );
}
