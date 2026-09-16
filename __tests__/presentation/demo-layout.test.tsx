import { render, screen } from '@testing-library/react'

// Marca los <Link> de Next para distinguirlos de los <a> nativos.
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-next-link="true" {...props}>
      {children}
    </a>
  ),
}))
jest.mock('next/navigation', () => ({ redirect: jest.fn(), useRouter: () => ({ replace: jest.fn() }) }))
jest.mock('@/lib/demo/session', () => ({
  getDemoSession: jest.fn().mockResolvedValue({ expiresAt: Date.now() + 60_000, expired: false, remainingMs: 60_000 }),
}))

import DemoLayout from '@/app/(demo)/demo/(main)/layout'

describe('DemoLayout', () => {
  it('no usa <Link> para salir (su prefetch cerraba la sesión demo)', async () => {
    render(await DemoLayout({ children: <p>contenido</p> }))

    const salir = screen.getAllByRole('link', { name: 'Salir' })
    expect(salir.length).toBeGreaterThan(0)
    for (const link of salir) {
      expect(link).toHaveAttribute('href', '/demo/salir')
      expect(link).not.toHaveAttribute('data-next-link')
    }
  })
})
