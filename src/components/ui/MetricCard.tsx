/**
 * Tarjeta de métrica usada en los dashboards (real y demo).
 * Extraída para eliminar la duplicación literal que existía en ambas páginas (DRY).
 *
 * Diseño neutro: el color solo se usa cuando comunica algo (p. ej. deuda).
 */
export type MetricTone = 'default' | 'success' | 'danger';

const TONE_CLASSES: Record<MetricTone, string> = {
  default: 'text-text',
  success: 'text-success',
  danger: 'text-danger',
};

export function MetricCard({
  title,
  value,
  tone = 'default',
  detalle,
}: {
  title: string;
  value: string;
  tone?: MetricTone;
  /** Dato secundario debajo del valor. */
  detalle?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-5 py-4">
      <p className="text-sm text-text-secondary">{title}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${TONE_CLASSES[tone]}`}>
        {value}
      </p>
      {detalle && <p className="mt-0.5 text-xs text-text-secondary">{detalle}</p>}
    </div>
  );
}
