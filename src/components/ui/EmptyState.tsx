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
  'px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-light transition-colors';

export function EmptyState({
  icon = '📭',
  title,
  message,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      {title && (
        <h3 className="text-lg font-semibold text-text mb-2">
          {title}
        </h3>
      )}
      <p className="text-text-secondary mb-6">{message}</p>
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
