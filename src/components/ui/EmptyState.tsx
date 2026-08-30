interface EmptyStateProps {
  icon?: string;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

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
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-light transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
