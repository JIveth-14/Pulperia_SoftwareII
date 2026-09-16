import Link from 'next/link';

/**
 * La acción puede ser un enlace (usable desde Server Components) o un
 * callback (solo desde Client Components: un RSC no puede pasar funciones).
 */
type EmptyStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
  action?: EmptyStateAction;
}

const actionClassName =
  'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
      {icon && <div className="mb-3 text-2xl text-text-secondary">{icon}</div>}
      {title && (
        <h3 className="mb-1 text-sm font-medium text-text">
          {title}
        </h3>
      )}
      <p className="mb-5 text-sm text-text-secondary">{message}</p>
      {action?.href !== undefined && (
        <Link href={action.href} className={actionClassName}>
          {action.label}
        </Link>
      )}
      {action?.onClick && (
        <button onClick={action.onClick} className={actionClassName}>
          {action.label}
        </button>
      )}
    </div>
  );
}
