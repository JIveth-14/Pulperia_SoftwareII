export type AlertTone = 'neutral' | 'warning' | 'danger';

const TONE_CLASSES: Record<AlertTone, string> = {
  neutral: 'border-border bg-surface text-text-secondary',
  warning: 'border-warning/25 bg-warning-soft text-warning',
  danger: 'border-danger/20 bg-danger-soft text-danger',
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children?: React.ReactNode;
}

/** Aviso en línea (stock bajo, errores de carga, modo solo lectura). */
export function Alert({ tone = 'neutral', title, children }: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`rounded-md border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}
    >
      {title && <p className="font-medium">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  );
}
