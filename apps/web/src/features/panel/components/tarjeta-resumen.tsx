import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

/**
 * Tono de una tarjeta del resumen. `attention` (ámbar) SOLO en las dos que D39
 * permite —«Asistencia sin marcar» y «Profesores pendientes»—, y solo cuando el
 * número es mayor que cero; `success` cuando ese mismo cero es buena noticia.
 */
export type TonoResumen = 'neutral' | 'attention' | 'success';

type TarjetaResumenProps = {
  titulo: string;
  icono: LucideIcon;
  tono?: TonoResumen;
  /** El pie de la tarjeta: a dónde ir. `a` con `#` es un ancla de la misma página. */
  enlace?: { texto: string; a: string };
  children: ReactNode;
};

const TONO: Record<TonoResumen, { caja: string; icono: string }> = {
  neutral: { caja: 'border-border bg-card', icono: 'text-muted-foreground' },
  attention: {
    caja: 'border-attention-border bg-attention-soft text-attention-soft-foreground',
    icono: 'text-attention',
  },
  success: {
    caja: 'border-success-border bg-success-soft text-success-soft-foreground',
    icono: 'text-success',
  },
};

export function TarjetaResumen({
  titulo,
  icono: Icono,
  tono = 'neutral',
  enlace,
  children,
}: TarjetaResumenProps) {
  const tituloId = `resumen-${titulo.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <article
      aria-labelledby={tituloId}
      className={cn('flex flex-col gap-2 rounded-xl border p-4 pl-5', TONO[tono].caja)}
    >
      <h3 id={tituloId} className="flex items-center gap-2 text-sm font-medium">
        <Icono
          aria-hidden="true"
          strokeWidth={2}
          className={cn('size-4 shrink-0', TONO[tono].icono)}
        />
        {titulo}
      </h3>

      <div className="flex-1 space-y-1">{children}</div>

      {enlace &&
        (enlace.a.startsWith('#') ? (
          <a
            href={enlace.a}
            className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {enlace.texto}
          </a>
        ) : (
          <Link
            to={enlace.a}
            className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {enlace.texto}
          </Link>
        ))}
    </article>
  );
}

/** El número grande de una tarjeta: conteo literal, cifras alineadas. */
export function Numero({ children }: { children: ReactNode }) {
  return <p className="text-2xl font-medium tabular-nums">{children}</p>;
}
