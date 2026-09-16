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
        rounded-lg border border-border bg-surface
        ${className}
      `}
      {...props}
    >
      {(title || subtitle) && (
        <div className="border-b border-border px-5 py-3">
          {title && (
            <h3 className="text-sm font-medium text-text">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}
