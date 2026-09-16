import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/Toast/ToastContext';
import './globals.css';

// Fuente autoalojada por Next (no hace peticiones a Google en runtime).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pulpería - Gestión de Negocio',
  description: 'Sistema integral para gestionar inventario, ventas, clientes y créditos en tu pulpería',
  keywords: 'gestión, pulpería, inventario, ventas, clientes, fiados, negocio',
  authors: [{ name: 'Jessica Iveth P. Dubón', url: 'https://github.com/JIveth-14' }],
  creator: 'Jessica Iveth P. Dubón',
  publisher: 'Pulpería Software',
  metadataBase: new URL('https://pulperia.vercel.app'),
  openGraph: {
    title: 'Pulpería - Gestión Integral de Negocio',
    description: 'Gestiona clientes, inventario, ventas y créditos desde una plataforma centralizada',
    url: 'https://pulperia.vercel.app',
    siteName: 'Pulpería',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulpería - Gestión de Negocio',
    description: 'Sistema para gestionar tu pulpería de forma eficiente',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#fafafa',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-text">
        <ToastProvider>{children}</ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
