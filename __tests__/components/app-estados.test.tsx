import { act, fireEvent, render, screen } from '@testing-library/react'
import ErrorApp from '@/app/(app)/error'
import NoEncontrado from '@/app/(app)/not-found'
import Cargando from '@/app/(app)/loading'
import { AvisoExito } from '@/components/formularios'
import { RegistroServiceWorker } from '@/components/layout/RegistroServiceWorker'
import { ToastProvider } from '@/components/Toast/ToastContext'

const mockReplace = jest.fn()
let mockParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/clientes/4',
  useSearchParams: () => mockParams,
}))

describe('estados de las páginas de la app', () => {
  it('error.tsx registra el error y permite reintentar', () => {
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {})
    const reset = jest.fn()
    render(<ErrorApp error={new Error('db caída')} reset={reset} />)

    expect(screen.getByRole('heading', { name: 'No se pudo cargar esta página' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(reset).toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Ir al dashboard' })).toHaveAttribute('href', '/dashboard')
    expect(consola).toHaveBeenCalled()
    consola.mockRestore()
  })

  it('not-found.tsx y loading.tsx', () => {
    const { unmount } = render(<NoEncontrado />)
    expect(screen.getByRole('heading', { name: 'No encontramos lo que buscas' })).toBeInTheDocument()
    unmount()

    render(<Cargando />)
    expect(screen.getByLabelText('Cargando')).toHaveAttribute('aria-busy', 'true')
  })
})

describe('AvisoExito', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => jest.useRealTimers())

  it('muestra el mensaje una sola vez y limpia el parámetro conservando los demás', () => {
    mockParams = new URLSearchParams('exito=pago-registrado&q=maria')
    const { rerender } = render(
      <ToastProvider>
        <AvisoExito />
      </ToastProvider>
    )

    expect(screen.getAllByText('Pago registrado')).toHaveLength(1)
    expect(mockReplace).toHaveBeenCalledWith('/clientes/4?q=maria', { scroll: false })

    rerender(
      <ToastProvider>
        <AvisoExito />
      </ToastProvider>
    )
    expect(screen.getAllByText('Pago registrado')).toHaveLength(1)

    act(() => {
      jest.advanceTimersByTime(3500)
    })
    expect(screen.queryByText('Pago registrado')).not.toBeInTheDocument()
  })

  it('ignora claves desconocidas pero igual limpia la URL', () => {
    mockParams = new URLSearchParams('exito=otra-cosa')
    render(
      <ToastProvider>
        <AvisoExito />
      </ToastProvider>
    )

    expect(mockReplace).toHaveBeenCalledWith('/clientes/4', { scroll: false })
    expect(document.body.textContent).not.toContain('otra-cosa')
  })

  it('no hace nada sin parámetro', () => {
    mockParams = new URLSearchParams()
    render(
      <ToastProvider>
        <AvisoExito />
      </ToastProvider>
    )
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

describe('RegistroServiceWorker', () => {
  const entorno = process.env.NODE_ENV
  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', { value: entorno, configurable: true })
    // @ts-expect-error limpieza del mock
    delete navigator.serviceWorker
  })

  it('registra /sw.js solo en producción', () => {
    const register = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', { value: { register }, configurable: true })

    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true })
    const { unmount } = render(<RegistroServiceWorker />)
    expect(register).not.toHaveBeenCalled()
    unmount()

    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })
    render(<RegistroServiceWorker />)
    expect(register).toHaveBeenCalledWith('/sw.js')
  })

  it('avisa si el registro falla', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {})
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: jest.fn().mockRejectedValue(new Error('bloqueado')) },
      configurable: true,
    })
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', configurable: true })

    render(<RegistroServiceWorker />)
    await act(async () => {})

    expect(aviso).toHaveBeenCalledWith('[PWA] No se pudo registrar el service worker:', expect.any(Error))
    aviso.mockRestore()
  })
})
