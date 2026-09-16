/**
 * Tarjeta de métrica usada en los dashboards (real y demo).
 * Extraída para eliminar la duplicación literal que existía en ambas páginas (DRY).
 */
export type MetricColor = 'blue' | 'green' | 'red' | 'purple';

const COLOR_CLASSES: Record<MetricColor, string> = {
  blue: 'bg-blue-50 text-blue-900',
  green: 'bg-green-50 text-green-900',
  red: 'bg-red-50 text-red-900',
  purple: 'bg-purple-50 text-purple-900',
};

export function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: MetricColor;
}) {
  return (
    <div className={`rounded-lg p-6 ${COLOR_CLASSES[color]}`}>
      <p className="text-sm font-medium opacity-75">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
