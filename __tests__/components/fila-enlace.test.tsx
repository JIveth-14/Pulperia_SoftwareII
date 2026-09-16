import { fireEvent, render, screen } from '@testing-library/react'
import { EnlaceFila, Table, TBody, Td, Tr } from '@/components/ui'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))

function Tabla() {
  return (
    <>
      <nav>
        <a href="/productos">Productos</a>
        <button>Nuevo cliente</button>
      </nav>
      <Table>
        <TBody>
          <Tr href="/clientes/1">
            <Td>
              <EnlaceFila href="/clientes/1">Ana García</EnlaceFila>
            </Td>
            <Td>Barrio El Centro</Td>
          </Tr>
          <Tr href="/clientes/2">
            <Td>
              <EnlaceFila href="/clientes/2">Rosa Mendoza</EnlaceFila>
            </Td>
            <Td>
              Col. La Esperanza <button>Acción</button>
            </Td>
          </Tr>
        </TBody>
      </Table>
    </>
  )
}

describe('filas clicables de tabla', () => {
  beforeEach(() => jest.clearAllMocks())

  it('regresión: no usa enlaces superpuestos que tapen la página', () => {
    const { container } = render(<Tabla />)
    expect(container.innerHTML).not.toMatch(/after:absolute|after:inset-0/)
    expect(container.querySelector('tr.relative')).toBeNull()
  })

  it('un clic fuera de la tabla (menú, botones) no abre ningún registro', () => {
    render(<Tabla />)
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo cliente' }))
    fireEvent.click(screen.getByRole('link', { name: 'Productos' }))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('un clic en cualquier celda abre SU registro, no el último', () => {
    render(<Tabla />)
    fireEvent.click(screen.getByText('Barrio El Centro'))
    expect(mockPush).toHaveBeenCalledWith('/clientes/1')
  })

  it('los enlaces y botones dentro de la fila manejan su propio clic', () => {
    render(<Tabla />)
    fireEvent.click(screen.getByRole('link', { name: 'Rosa Mendoza' }))
    fireEvent.click(screen.getByRole('button', { name: 'Acción' }))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('Ctrl/Cmd+clic abre en otra pestaña y seleccionar texto no navega', () => {
    const abrir = jest.spyOn(window, 'open').mockImplementation(() => null)
    render(<Tabla />)

    fireEvent.click(screen.getByText('Barrio El Centro'), { metaKey: true })
    expect(abrir).toHaveBeenCalledWith('/clientes/1', '_blank', 'noopener')

    const seleccion = jest.spyOn(window, 'getSelection').mockReturnValue({ toString: () => '9876' } as Selection)
    fireEvent.click(screen.getByText('Barrio El Centro'))
    expect(mockPush).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Barrio El Centro'), { button: 1 })
    expect(mockPush).not.toHaveBeenCalled()
    abrir.mockRestore()
    seleccion.mockRestore()
  })
})
