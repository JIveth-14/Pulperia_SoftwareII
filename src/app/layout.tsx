import type { Metadata } from 'next';
import { ToastProvider } from '@/components/Toast/ToastContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pulpería',
  description: 'Gestión de clientes, fiados, inventario y ventas',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
