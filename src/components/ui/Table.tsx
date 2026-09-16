import Link from 'next/link';

type Alineacion = 'left' | 'right';

interface CeldaProps {
  children?: React.ReactNode;
  align?: Alineacion;
  /** Oculta la columna en pantallas pequeñas (menos importante). */
  ocultarEnMovil?: boolean;
  className?: string;
}

const alinear = (align: Alineacion = 'left') => (align === 'right' ? 'text-right' : 'text-left');
const visibilidad = (ocultar?: boolean) => (ocultar ? 'hidden sm:table-cell' : '');

/** Contenedor de tabla: borde fino y desplazamiento horizontal si no cabe. */
export function Table({ children, titulo }: { children: React.ReactNode; titulo?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {titulo && <div className="border-b border-border px-5 py-3 text-sm font-medium text-text">{titulo}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border text-xs text-text-secondary">{children}</tr>
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>;
}

export function Th({ children, align, ocultarEnMovil, className = '' }: CeldaProps) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-2.5 font-medium first:pl-5 last:pr-5 ${alinear(align)} ${visibilidad(ocultarEnMovil)} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align, ocultarEnMovil, className = '' }: CeldaProps) {
  return (
    <td
      className={`px-4 py-3 align-middle first:pl-5 last:pr-5 ${alinear(align)} ${visibilidad(ocultarEnMovil)} ${className}`}
    >
      {children}
    </td>
  );
}

/**
 * Fila de tabla. Con `href`, toda la fila es clicable: el enlace va en la
 * primera celda (accesible y con foco) y se estira sobre la fila.
 */
export function Tr({ children, destacada = false }: { children: React.ReactNode; destacada?: boolean }) {
  return (
    <tr className={`relative transition-colors hover:bg-muted/60 ${destacada ? 'bg-danger-soft/40' : ''}`}>
      {children}
    </tr>
  );
}

/** Enlace que cubre toda la fila (`Tr` es `relative`). */
export function EnlaceFila({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-text after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded focus-visible:after:ring-2 focus-visible:after:ring-primary"
    >
      {children}
    </Link>
  );
}
