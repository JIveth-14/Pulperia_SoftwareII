import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Enlace "Volver" encima del título. */
  backHref?: string;
  /** Acciones alineadas a la derecha (botones o enlaces). */
  actions?: React.ReactNode;
}

/** Encabezado estándar de página: título, descripción opcional y acciones. */
export function PageHeader({ title, description, backHref, actions }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {backHref && (
        <Link href={backHref} className="text-sm text-text-secondary hover:text-text">
          ← Volver
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
          {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
