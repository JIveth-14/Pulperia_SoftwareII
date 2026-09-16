import Link from 'next/link';

interface BuscadorProps {
  /** Ruta de la lista (el formulario hace GET con `?q=`). */
  accion: string;
  valor?: string;
  placeholder: string;
  resultados?: number;
}

/** Búsqueda por URL: funciona sin JavaScript y se puede compartir o recargar. */
export function Buscador({ accion, valor = '', placeholder, resultados }: BuscadorProps) {
  return (
    <form action={accion} role="search" className="flex flex-wrap items-center gap-3">
      <label htmlFor="q" className="sr-only">
        {placeholder}
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={valor}
        placeholder={placeholder}
        className="w-full max-w-sm rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {valor && (
        <p className="text-sm text-text-secondary">
          {resultados} resultado{resultados === 1 ? '' : 's'} ·{' '}
          <Link href={accion} className="underline underline-offset-2 hover:text-text">
            Limpiar
          </Link>
        </p>
      )}
    </form>
  );
}
