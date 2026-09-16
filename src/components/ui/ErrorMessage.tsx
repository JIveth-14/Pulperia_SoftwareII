interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-md border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      <p>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="font-medium text-danger/70 hover:text-danger"
        >
          ✕
        </button>
      )}
    </div>
  );
}
