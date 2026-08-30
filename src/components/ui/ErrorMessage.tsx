interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 flex items-start justify-between">
      <div className="flex items-start gap-3">
        <span className="text-lg">⚠️</span>
        <p>{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          ✕
        </button>
      )}
    </div>
  );
}
