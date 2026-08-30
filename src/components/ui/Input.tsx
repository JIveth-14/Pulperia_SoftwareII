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

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text mb-2"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md
          text-text placeholder-text-secondary
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          disabled:bg-gray-50 disabled:text-text-secondary disabled:cursor-not-allowed
          ${error ? 'border-danger focus:ring-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
