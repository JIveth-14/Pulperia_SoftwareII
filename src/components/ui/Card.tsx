import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function Card({
  title,
  subtitle,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-md border border-gray-200 shadow-sm
        ${className}
      `}
      {...props}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-lg font-semibold text-text">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
