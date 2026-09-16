import { render, screen, within } from '@testing-library/react'
import { StockBajo, esCritico, nivelStock } from '@/components/productos/StockBajo'

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

const producto = (id: number, nombre: string, stock: number, stock_minimo: number) => ({
  id,
  nombre,
  stock,
  stock_minimo,
})

describe('StockBajo', () => {
  it('calcula el nivel relativo al mínimo y marca como crítico la mitad o menos', () => {
    expect(nivelStock(producto(1, 'Arroz', 8, 12))).toBeCloseTo(0.667, 2)
    expect(nivelStock(producto(1, 'X', 0, 5))).toBe(0)
    expect(nivelStock(producto(1, 'X', 3, 0))).toBe(1)
    expect(esCritico(producto(1, 'Aceite', 3, 6))).toBe(true)
    expect(esCritico(producto(1, 'Arroz', 8, 12))).toBe(false)
  })

  it('no renderiza nada sin productos', () => {
    const { container } = render(<StockBajo productos={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ordena del más crítico al menos crítico con barra y faltante', () => {
    render(
      <StockBajo
        productos={[producto(1, 'Arroz 1lb', 8, 12), producto(2, 'Aceite 500ml', 0, 6)]}
      />
    )

    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByText('Aceite 500ml')).toBeInTheDocument()
    expect(within(items[0]).getByText('Agotado')).toBeInTheDocument()
    expect(within(items[1]).getByText('Faltan 4 para el mínimo')).toBeInTheDocument()

    const barra = screen.getByRole('progressbar', { name: 'Stock de Arroz 1lb' })
    expect(barra).toHaveAttribute('aria-valuenow', '8')
    expect(barra.firstChild).toHaveStyle({ width: '67%' })
  })

  it('limita la cantidad visible y enlaza al resto', () => {
    render(
      <StockBajo
        productos={[producto(1, 'A', 1, 5), producto(2, 'B', 2, 5), producto(3, 'C', 3, 5)]}
        limite={2}
        href="/productos"
      />
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver 1 más →' })).toHaveAttribute('href', '/productos')
  })
})
