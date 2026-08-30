interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  message = 'Cargando...',
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-r-transparent animate-spin"></div>
      </div>
      {message && (
        <p className="text-text-secondary font-medium">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
}
