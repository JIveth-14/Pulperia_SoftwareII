import { fireEvent, render, screen, within } from '@testing-library/react'
import { BarraNavegacion, esRutaActiva } from '@/components/layout/BarraNavegacion'
import { Badge, EnlaceFila, Table, TBody, Td, Th, THead, Tr } from '@/components/ui'
import { ClientesView, ProductosView, VentasView } from '@/components/vistas'
import { createDemoRepositories } from '@/repositories/container'

let mockPathname = '/clientes/4'
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }))

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/ventas', label: 'Ventas' },
]

describe('BarraNavegacion', () => {
  it('marca activa la sección, incluso en subrutas, y el inicio solo en coincidencia exacta', () => {
    expect(esRutaActiva('/clientes/4/editar', '/clientes', '/dashboard')).toBe(true)
    expect(esRutaActiva('/clientes-x', '/clientes', '/dashboard')).toBe(false)
    expect(esRutaActiva('/demo/clientes', '/demo', '/demo')).toBe(false)
    expect(esRutaActiva('/demo', '/demo', '/demo')).toBe(true)
  })

  it('expone la página actual con aria-current y abre el menú móvil', () => {
    mockPathname = '/clientes/4'
    render(
      <BarraNavegacion
        marca="Pulpería"
        inicioHref="/dashboard"
        items={ITEMS}
        usuario="ana@pulperia.hn"
        salir={<button>Cerrar sesión</button>}
      />
    )

    const actuales = screen.getAllByRole('link', { name: 'Clientes', hidden: true })
    expect(actuales.every((a) => a.getAttribute('aria-current') === 'page')).toBe(true)
    expect(screen.getAllByRole('link', { name: 'Ventas', hidden: true })[0]).not.toHaveAttribute('aria-current')

    const boton = screen.getByRole('button', { name: 'Menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    const panel = document.getElementById(boton.getAttribute('aria-controls')!)!
    expect(panel).not.toBeVisible()

    fireEvent.click(boton)
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toBeVisible()
    expect(within(panel).getByText('ana@pulperia.hn')).toBeInTheDocument()
  })
})

describe('tablas y badges', () => {
  it('renderiza encabezados, alineación y fila enlazada', () => {
    render(
      <Table titulo="Ventas">
        <THead>
          <Th>Venta</Th>
          <Th align="right" ocultarEnMovil>
            Total
          </Th>
        </THead>
        <TBody>
          <Tr>
            <Td>
              <EnlaceFila href="/ventas/1">Venta #1</EnlaceFila>
            </Td>
            <Td align="right">
              <Badge tone="warning">Crédito</Badge>
            </Td>
          </Tr>
        </TBody>
      </Table>
    )

    expect(screen.getByRole('columnheader', { name: 'Total' })).toHaveClass('text-right', 'hidden', 'sm:table-cell')
    expect(screen.getByRole('link', { name: 'Venta #1' })).toHaveAttribute('href', '/ventas/1')
    expect(screen.getByText('Crédito')).toHaveClass('text-warning')
  })

  it('las vistas muestran resúmenes, estados y nombres de cliente', async () => {
    const repos = createDemoRepositories()
    const clientes = await repos.clientes.getConSaldo()
    const { rerender } = render(<ClientesView clientes={clientes} />)

    expect(screen.getByText(/5 clientes · 2 con deuda/)).toBeInTheDocument()
    expect(screen.getAllByText('Al día')).toHaveLength(3)

    rerender(<ProductosView productos={await repos.productos.getAll()} />)
    expect(screen.getByText('7 productos · 3 con stock bajo')).toBeInTheDocument()

    rerender(<VentasView ventas={await repos.ventas.getAll()} clientes={await repos.clientes.getAll()} />)
    const fila = screen.getByRole('link', { name: 'Venta #2' }).closest('tr')!
    expect(within(fila).getByText('María González')).toBeInTheDocument()
    expect(within(fila).getByText('Crédito')).toBeInTheDocument()
  })
})
