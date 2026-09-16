import { fireEvent, render, screen } from '@testing-library/react'

import { Alert, Button, Card, EmptyState, ErrorMessage, Input, LoadingSpinner, MetricCard, PageHeader, buttonClass } from '@/components/ui'
import * as uiExports from '@/components/ui'

describe('shared ui components', () => {
  it('renders button variants and widths from props', () => {
    render(
      <Button variant="danger" size="lg" fullWidth className="extra-class">
        Eliminar
      </Button>
    )

    const button = screen.getByRole('button', { name: 'Eliminar' })

    expect(button).toHaveClass('bg-danger')
    expect(button).toHaveClass('px-6')
    expect(button).toHaveClass('w-full')
    expect(button).toHaveClass('extra-class')
  })

  it('disables the button and shows a spinner while loading', () => {
    render(<Button loading>Guardar</Button>)

    const button = screen.getByRole('button', { name: /Cargando/ })

    expect(button).toBeDisabled()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('renders card header data only when provided', () => {
    const { rerender } = render(
      <Card title="Resumen" subtitle="Detalle">
        Contenido
      </Card>
    )

    expect(screen.getByText('Resumen')).toBeInTheDocument()
    expect(screen.getByText('Detalle')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()

    rerender(<Card>Solo contenido</Card>)

    expect(screen.queryByText('Resumen')).not.toBeInTheDocument()
    expect(screen.getByText('Solo contenido')).toBeInTheDocument()
  })

  it('renders empty state defaults and triggers actions', () => {
    const onClick = jest.fn()

    render(
      <EmptyState
        title="Sin datos"
        message="Todavía no hay resultados"
        action={{ label: 'Recargar', onClick }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Recargar' }))

    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders the empty state action as a link when href is given', () => {
    render(
      <EmptyState
        message="Sin clientes"
        action={{ label: 'Crear cliente', href: '/clientes/nuevo' }}
      />
    )

    expect(screen.getByRole('link', { name: 'Crear cliente' })).toHaveAttribute('href', '/clientes/nuevo')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders dismissible error messages', () => {
    const onDismiss = jest.fn()

    render(<ErrorMessage message="Algo salió mal" onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: '✕' }))

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('connects input labels, generated ids, and error state', () => {
    render(<Input label="Nombre completo" error="Campo requerido" placeholder="Nombre" />)

    const input = screen.getByLabelText('Nombre completo')

    expect(input).toHaveAttribute('id', 'nombre-completo')
    expect(input).toHaveClass('border-danger')
    expect(screen.getByText('Campo requerido')).toBeInTheDocument()
  })

  it('supports opt-out of full width on input wrappers', () => {
    const { container } = render(<Input fullWidth={false} aria-label="Código" />)

    expect(container.firstChild).not.toHaveClass('w-full')
  })

  it('renders loading spinners in inline and full-page modes', () => {
    const { rerender, container } = render(<LoadingSpinner message="Cargando ventas" />)

    expect(screen.getByText('Cargando ventas')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('py-12')

    rerender(<LoadingSpinner fullPage message="" />)

    expect(screen.queryByText('Cargando ventas')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveClass('fixed')
  })

  it('builds button classes for links that match the Button component', () => {
    render(<Button variant="secondary" size="sm">Editar</Button>)

    const button = screen.getByRole('button', { name: 'Editar' })
    for (const cls of buttonClass('secondary', 'sm').split(' ')) {
      expect(button).toHaveClass(cls)
    }
  })

  it('renders the page header with back link and actions', () => {
    render(
      <PageHeader
        title="Clientes"
        description="Listado"
        backHref="/dashboard"
        actions={<button>Nuevo</button>}
      />
    )

    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '← Volver' })).toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument()
  })

  it('renders alerts with an accessible role per tone', () => {
    const { rerender } = render(<Alert tone="danger">Error</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Error')

    rerender(<Alert tone="warning" title="Stock bajo">2 productos</Alert>)
    expect(screen.getByRole('status')).toHaveTextContent('Stock bajo')
  })

  it('highlights metric values only when a tone is given', () => {
    const { rerender } = render(<MetricCard title="Saldo" value="L 10.00" />)
    expect(screen.getByText('L 10.00')).toHaveClass('text-text')

    rerender(<MetricCard title="Saldo" value="L 10.00" tone="danger" />)
    expect(screen.getByText('L 10.00')).toHaveClass('text-danger')
  })

  it('re-exports all shared ui building blocks', () => {
    expect(uiExports.Button).toBe(Button)
    expect(uiExports.Input).toBe(Input)
    expect(uiExports.Card).toBe(Card)
    expect(uiExports.ErrorMessage).toBe(ErrorMessage)
    expect(uiExports.EmptyState).toBe(EmptyState)
    expect(uiExports.LoadingSpinner).toBe(LoadingSpinner)
  })
})
