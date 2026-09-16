import Link from 'next/link';
import { Alert, buttonClass, type ButtonSize, type ButtonVariant } from '@/components/ui';

interface AccionProps {
  href: string;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** En solo lectura (demo) se muestra el botón deshabilitado, sin enlace. */
  soloLectura?: boolean;
}

/** Enlace con aspecto de botón que se deshabilita en modo solo lectura. */
export function Accion({ href, children, variant = 'primary', size = 'md', soloLectura = false }: AccionProps) {
  if (soloLectura) {
    return (
      <button
        type="button"
        disabled
        title="Deshabilitado en modo demo"
        className={buttonClass('secondary', size)}
      >
        {children}
      </button>
    );
  }

  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {children}
    </Link>
  );
}

/** Aviso de solo lectura mostrado sobre cada listado de la demo. */
export function AvisoSoloLectura() {
  return (
    <Alert>
      Solo lectura: en la demo las acciones de crear, editar y eliminar están deshabilitadas.
    </Alert>
  );
}

/**
 * Tarjeta navegable: en modo normal enlaza al detalle; en solo lectura
 * (la demo no tiene páginas de detalle) se muestra sin enlace.
 */
export function EnlaceTarjeta({ href, children }: { href?: string; children: React.ReactNode }) {
  if (!href) return <>{children}</>;
  return (
    <Link href={href} className="block rounded-lg transition-colors hover:[&>div]:border-border-strong">
      {children}
    </Link>
  );
}
