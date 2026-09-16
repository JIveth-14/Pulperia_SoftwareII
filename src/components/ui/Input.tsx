import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-text"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={`
          w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm
          text-text placeholder:text-text-secondary
          focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
          disabled:cursor-not-allowed disabled:bg-muted disabled:text-text-secondary
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
