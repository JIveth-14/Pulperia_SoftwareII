import { fireEvent, render, screen } from '@testing-library/react'

import { Button, Card, EmptyState, ErrorMessage, Input, LoadingSpinner } from '@/components/ui'
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

    expect(screen.getByText('📭')).toBeInTheDocument()
    expect(screen.getByText('Sin datos')).toBeInTheDocument()
    expect(onClick).toHaveBeenCalledTimes(1)
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

  it('re-exports all shared ui building blocks', () => {
    expect(uiExports.Button).toBe(Button)
    expect(uiExports.Input).toBe(Input)
    expect(uiExports.Card).toBe(Card)
    expect(uiExports.ErrorMessage).toBe(ErrorMessage)
    expect(uiExports.EmptyState).toBe(EmptyState)
    expect(uiExports.LoadingSpinner).toBe(LoadingSpinner)
  })
})
