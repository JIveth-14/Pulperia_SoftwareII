import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FiadoForm, ProductoForm } from '@/components/formularios'
import type { EstadoFormulario } from '@/lib/formulario'

describe('ProductoForm', () => {
  it('usa valores por defecto al crear y muestra errores por campo', async () => {
    const accion = jest.fn(
      async (_: EstadoFormulario, f: FormData): Promise<EstadoFormulario> => ({
        error: 'Revisa los datos del formulario',
        campos: { precio: 'El precio no puede ser negativo' },
        valores: {
          nombre: String(f.get('nombre')),
          precio: String(f.get('precio')),
          stock: String(f.get('stock')),
          stock_minimo: String(f.get('stock_minimo')),
        },
      })
    )
    render(<ProductoForm accion={accion} cancelarHref="/productos" />)

    expect(screen.getByLabelText('Stock')).toHaveValue(0)
    expect(screen.getByLabelText('Stock mínimo')).toHaveValue(5)
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/productos')

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Arroz 1lb' } })
    fireEvent.change(screen.getByLabelText('Precio (L)'), { target: { value: '-3' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar producto' }))
    })

    await waitFor(() => expect(screen.getByText('El precio no puede ser negativo')).toBeInTheDocument())
    expect(screen.getByLabelText('Nombre')).toHaveValue('Arroz 1lb')
    expect(screen.getByLabelText('Precio (L)')).toHaveAttribute('aria-invalid', 'true')
  })

  it('precarga el producto al editar', () => {
    render(
      <ProductoForm
        accion={jest.fn()}
        cancelarHref="/productos"
        producto={{ nombre: 'Café 250g', precio: 42.5, stock: 3, stock_minimo: 4 }}
      />
    )

    expect(screen.getByLabelText('Nombre')).toHaveValue('Café 250g')
    expect(screen.getByLabelText('Precio (L)')).toHaveValue(42.5)
    expect(screen.getByLabelText('Stock')).toHaveValue(3)
    expect(screen.getByLabelText('Stock mínimo')).toHaveValue(4)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
  })
})

describe('FiadoForm', () => {
  it('envía el monto y muestra el error sin perder lo escrito', async () => {
    const accion = jest.fn(
      async (_: EstadoFormulario, f: FormData): Promise<EstadoFormulario> => ({
        error: 'Cliente #9 no existe',
        valores: { monto: String(f.get('monto')) },
      })
    )
    render(<FiadoForm accion={accion} cancelarHref="/clientes/9" />)

    expect(screen.getByRole('link', { name: 'Nueva venta' })).toHaveAttribute('href', '/ventas/nueva')
    fireEvent.change(screen.getByLabelText('Monto de la deuda (L)'), { target: { value: '120.50' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Registrar fiado' }))
    })

    await waitFor(() => expect(screen.getByText('Cliente #9 no existe')).toBeInTheDocument())
    expect((accion.mock.calls[0][1] as FormData).get('monto')).toBe('120.50')
    expect(screen.getByLabelText('Monto de la deuda (L)')).toHaveValue(120.5)
  })
})
