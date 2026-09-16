export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-text-secondary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

/** Etiqueta corta de estado (forma de pago, estado de deuda, stock). */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
