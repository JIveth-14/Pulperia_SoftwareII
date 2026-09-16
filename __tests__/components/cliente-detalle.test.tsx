import { render, screen, within } from '@testing-library/react'
import { ClienteDetalleView } from '@/components/vistas'
import type { Cliente, Fiado, Pago } from '@/types'

const plain = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ')

const cliente: Cliente = { id: 1, nombre: 'María González', telefono: '9876-5432', direccion: 'Barrio El Centro', created_at: null }
const fiados: Fiado[] = [
  { id: 10, cliente_id: 1, monto_total: 250, saldo_pendiente: 100, fecha: '2026-09-01T18:00:00Z', estado: 'parcial', created_at: null },
  { id: 11, cliente_id: 1, monto_total: 80, saldo_pendiente: 80, fecha: '2026-09-10T18:00:00Z', estado: 'pendiente', created_at: null },
  { id: 12, cliente_id: 1, monto_total: 50, saldo_pendiente: 0, fecha: '2026-08-01T18:00:00Z', estado: 'pagado', created_at: null },
]
const pagos: Pago[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  fiado_id: 10,
  monto_pagado: 25,
  fecha_pago: `2026-09-0${i + 1}T18:00:00Z`,
  created_at: null,
}))

describe('ClienteDetalleView', () => {
  it('resume saldo, deudas activas y abonos, con acciones del cliente', () => {
    render(<ClienteDetalleView cliente={cliente} fiados={fiados} pagos={pagos} />)

    expect(screen.getByRole('heading', { name: 'María González' })).toBeInTheDocument()
    expect(screen.getByText('9876-5432 · Barrio El Centro')).toBeInTheDocument()
    expect(plain(screen.getByText(/^L 180\.00$/).textContent)).toBe('L 180.00')
    expect(screen.getByText('3 en total')).toBeInTheDocument()
    expect(plain(screen.getByText(/^L 150\.00$/).textContent)).toBe('L 150.00')
    expect(screen.getByText('6 pagos')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute('href', '/clientes/1/editar')
    expect(screen.getByRole('link', { name: 'Venta al crédito' })).toHaveAttribute('href', '/ventas/nueva?cliente=1')
    expect(screen.getByRole('link', { name: 'Registrar pago' })).toHaveAttribute('href', '/clientes/1/pagos/nuevo')
    expect(screen.getByRole('link', { name: 'Fiado manual' })).toHaveAttribute('href', '/clientes/1/fiados/nuevo')
  })

  it('lista solo deudas con saldo y los últimos 5 pagos', () => {
    render(<ClienteDetalleView cliente={cliente} fiados={fiados} pagos={pagos} />)

    const tablas = screen.getAllByRole('table')
    const deudas = within(tablas[0]).getAllByRole('row').slice(1)
    expect(deudas).toHaveLength(2)
    expect(within(deudas[0]).getByText('Pago parcial')).toBeInTheDocument()
    expect(within(deudas[1]).getByText('Pendiente')).toBeInTheDocument()

    expect(within(tablas[1]).getAllByRole('row').slice(1)).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Ver todos (6) →' })).toHaveAttribute('href', '/clientes/1/pagos')
  })

  it('muestra estados vacíos y oculta "Registrar pago" si está al día', () => {
    render(<ClienteDetalleView cliente={{ ...cliente, direccion: null }} fiados={[fiados[2]]} pagos={[]} />)

    expect(screen.getByText('9876-5432')).toBeInTheDocument()
    expect(screen.getByText('al día')).toBeInTheDocument()
    expect(screen.getByText('Sin deudas pendientes')).toBeInTheDocument()
    expect(screen.getByText('Sin pagos')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Registrar pago' })).not.toBeInTheDocument()
    expect(screen.getByText('0 pagos')).toBeInTheDocument()
  })
})
