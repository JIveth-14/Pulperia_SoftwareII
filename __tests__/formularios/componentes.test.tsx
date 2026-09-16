import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ClienteForm, EliminarRegistro, NuevaVentaForm, PagoForm } from '@/components/formularios'
import type { EstadoFormulario } from '@/lib/formulario'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...p }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...p}>
      {children}
    </a>
  ),
}))

const plain = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ')

describe('formularios', () => {
  it('ClienteForm muestra errores por campo y conserva lo escrito', async () => {
    const accion = jest.fn(
      async (_: EstadoFormulario, f: FormData): Promise<EstadoFormulario> => ({
        error: 'Revisa los datos del formulario',
        campos: { telefono: 'Teléfono debe tener entre 6 y 15 dígitos' },
        valores: { nombre: String(f.get('nombre')), telefono: String(f.get('telefono')), direccion: '' },
      })
    )
    render(<ClienteForm accion={accion} cancelarHref="/clientes" />)

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Ana' } })
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '12' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar cliente' }))
    })

    await waitFor(() => expect(screen.getByText('Teléfono debe tener entre 6 y 15 dígitos')).toBeInTheDocument())
    expect(screen.getByLabelText('Teléfono')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Revisa los campos marcados')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')
    expect(accion).toHaveBeenCalledTimes(1)
  })

  it('PagoForm permite saldar la deuda seleccionada', () => {
    render(
      <PagoForm
        accion={jest.fn()}
        cancelarHref="/clientes/1"
        fiados={[
          { id: 1, saldo_pendiente: 100, monto_total: 250, fecha: null, estado: 'parcial' },
          { id: 2, saldo_pendiente: '80.00' as unknown as number, monto_total: 80, fecha: null, estado: 'pendiente' },
        ]}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: /Deuda #2/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Saldar' }))

    expect(screen.getByLabelText('Monto del pago (L)')).toHaveValue(80)
    expect(screen.getByLabelText('Monto del pago (L)')).toHaveAttribute('max', '80')
  })

  it('NuevaVentaForm arma el carrito, calcula el total y exige cliente al crédito', () => {
    const { container } = render(
      <NuevaVentaForm
        accion={jest.fn()}
        productos={[
          { id: 1, nombre: 'Coca-Cola 600ml', precio: 18, stock: 3 },
          { id: 2, nombre: 'Café 250g', precio: 42.5, stock: 0 },
        ]}
        clientes={[{ id: 7, nombre: 'María' }]}
      />
    )
    const lineas = () => JSON.parse((container.querySelector('input[name="lineas"]') as HTMLInputElement).value)
    const registrar = () => screen.getByRole('button', { name: 'Registrar venta' })

    expect(registrar()).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Agregar Café 250g' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Agregar Coca-Cola 600ml' }))
    fireEvent.click(screen.getByRole('button', { name: 'Agregar uno de Coca-Cola 600ml' }))
    expect(lineas()).toEqual([{ producto_id: 1, cantidad: 2 }])
    expect(plain(screen.getByText(/^L 36\.00$/, { selector: '.text-2xl' }).textContent)).toBe('L 36.00')
    expect(registrar()).toBeEnabled()

    fireEvent.click(screen.getByRole('radio', { name: 'Al crédito' }))
    expect(registrar()).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '7' } })
    expect(registrar()).toBeEnabled()

    fireEvent.change(screen.getByPlaceholderText('Buscar producto…'), { target: { value: 'cafe' } })
    expect(screen.queryByRole('button', { name: 'Agregar Coca-Cola 600ml' })).not.toBeInTheDocument()
  })

  it('NuevaVentaForm conserva carrito, forma de pago y cliente tras un error', async () => {
    const accion = jest.fn(async (): Promise<EstadoFormulario> => ({ error: 'Stock insuficiente para "Coca-Cola 600ml"' }))
    const { container } = render(
      <NuevaVentaForm
        accion={accion}
        productos={[{ id: 1, nombre: 'Coca-Cola 600ml', precio: 18, stock: 3 }]}
        clientes={[{ id: 7, nombre: 'María' }]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Agregar Coca-Cola 600ml' }))
    fireEvent.click(screen.getByRole('radio', { name: 'Al crédito' }))
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '7' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar venta' }))
    })

    await waitFor(() => expect(screen.getByText('Stock insuficiente para "Coca-Cola 600ml"')).toBeInTheDocument())
    const enviado = accion.mock.calls[0][1] as FormData
    expect(enviado.get('clienteId')).toBe('7')
    expect(enviado.get('tipoPago')).toBe('fiado')
    expect(screen.getByLabelText('Cliente')).toHaveValue('7')
    expect(screen.getByRole('radio', { name: 'Al crédito' })).toBeChecked()
    expect((container.querySelector('input[name="lineas"]') as HTMLInputElement).value).toBe('[{"producto_id":1,"cantidad":1}]')
  })

  it('EliminarRegistro pide confirmación antes de enviar', async () => {
    const accion = jest.fn(async (): Promise<EstadoFormulario> => ({ error: 'No se puede eliminar: tiene deuda' }))
    render(<EliminarRegistro accion={accion} entidad="cliente" advertencia="Se borra todo" />)

    expect(screen.queryByRole('button', { name: 'Sí, eliminar' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar cliente' }))
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }))
    })

    await waitFor(() => expect(screen.getByText('No se puede eliminar: tiene deuda')).toBeInTheDocument())
    expect(accion).toHaveBeenCalledTimes(1)
  })
})
