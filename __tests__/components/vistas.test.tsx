import { render, screen } from '@testing-library/react'
import { ClientesView, DashboardView, ProductosView, VentasView, cargarDashboard } from '@/components/vistas'
import { createDemoRepositories, getRepositories } from '@/repositories/container'
import { InMemoryClienteRepository } from '@/repositories/memory'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe('vistas compartidas entre app y demo', () => {
  it('la demo se construye con la factory en modo demo', async () => {
    const repos = await getRepositories('demo')
    expect(repos.clientes).toBeInstanceOf(InMemoryClienteRepository)
  })

  it('en modo real enlaza a crear y a los detalles', async () => {
    const clientes = await createDemoRepositories().clientes.getConSaldo()
    render(<ClientesView clientes={clientes} />)

    expect(screen.getByRole('link', { name: 'Nuevo cliente' })).toHaveAttribute('href', '/clientes/nuevo')
    expect(screen.getByRole('link', { name: /María González/ })).toHaveAttribute('href', '/clientes/1')
    expect(screen.queryByText(/Solo lectura/)).not.toBeInTheDocument()
  })

  it('en modo demo deshabilita acciones y no enlaza a páginas inexistentes', async () => {
    const repos = createDemoRepositories()
    const { rerender } = render(<ClientesView clientes={await repos.clientes.getConSaldo()} modo="demo" />)

    expect(screen.getByRole('button', { name: 'Nuevo cliente' })).toBeDisabled()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText(/Solo lectura/)).toBeInTheDocument()

    rerender(<ProductosView productos={await repos.productos.getAll()} modo="demo" />)
    for (const boton of screen.getAllByRole('button', { name: 'Editar' })) {
      expect(boton).toBeDisabled()
    }

    rerender(<VentasView ventas={await repos.ventas.getAll()} modo="demo" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('el dashboard apunta el inventario a la ruta de su modo', async () => {
    const datos = await cargarDashboard(createDemoRepositories())
    const { rerender } = render(<DashboardView datos={datos} modo="demo" />)
    expect(screen.getByRole('link', { name: /Ver inventario/ })).toHaveAttribute('href', '/demo/productos')
    expect(screen.getByText('Resumen de tu negocio (datos de demostración)')).toBeInTheDocument()

    rerender(<DashboardView datos={datos} />)
    expect(screen.getByRole('link', { name: /Ver inventario/ })).toHaveAttribute('href', '/productos')
  })
})
