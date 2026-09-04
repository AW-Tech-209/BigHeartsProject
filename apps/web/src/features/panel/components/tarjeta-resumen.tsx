import { ArrowRight, type LucideIcon } from 'lucide-react';
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
  /** Con un destino único, la tarjeta entera es enlazable y clicable (T6, AC3). */
  comoTarjeta?: boolean;
  children: ReactNode;
};

const TONO: Record<TonoResumen, { borde: string; caja: string; velo: string; riel: string }> = {
  neutral: {
    borde: 'border-border',
    caja: 'bg-muted text-muted-foreground',
    velo: '',
    riel: 'bg-muted-foreground',
  },
  attention: {
    borde: 'border-attention-border',
    caja: 'bg-attention-soft text-attention-soft-foreground',
    velo: 'bg-attention-soft',
    riel: 'bg-attention',
  },
  success: {
    borde: 'border-success-border',
    caja: 'bg-success-soft text-success-soft-foreground',
    velo: 'bg-success-soft',
    riel: 'bg-success',
  },
};

export function TarjetaResumen({
  titulo,
  icono: Icono,
  tono = 'neutral',
  enlace,
  comoTarjeta = false,
  children,
}: TarjetaResumenProps) {
  const tituloId = `resumen-${titulo.replace(/\s+/g, '-').toLowerCase()}`;
  const enlazable = comoTarjeta && enlace;

  return (
    <article
      aria-labelledby={tituloId}
      className={cn(
        'resumen-entra relative isolate flex h-full flex-col overflow-hidden rounded-xl border bg-card p-6 shadow-sm',
        TONO[tono].borde,
        enlazable &&
          'transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', TONO[tono].riel)} />
      {TONO[tono].velo && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute -left-12 -top-12 -z-10 size-44 rounded-full opacity-70 blur-2xl',
            TONO[tono].velo,
          )}
        />
      )}

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn('grid size-10 shrink-0 place-items-center rounded-lg', TONO[tono].caja)}
        >
          <Icono strokeWidth={2} className="size-5" />
        </span>
        <h3 id={tituloId} className="text-sm font-medium text-foreground">
          {titulo}
        </h3>
      </div>

      <div className="mt-4 flex-1 space-y-1">{children}</div>

      {enlace && (
        <div className="mt-4 border-t border-border pt-3">
          {enlazable ? <PieEnlaceTarjeta {...enlace} /> : <PieEnlace {...enlace} />}
        </div>
      )}
    </article>
  );
}

const CLASE_PIE =
  'text-sm font-medium text-primary underline underline-offset-4 hover:no-underline';

function PieEnlace({ texto, a }: { texto: string; a: string }) {
  return a.startsWith('#') ? (
    <a href={a} className={CLASE_PIE}>
      {texto}
    </a>
  ) : (
    <Link to={a} className={CLASE_PIE}>
      {texto}
    </Link>
  );
}

function PieEnlaceTarjeta({ texto, a }: { texto: string; a: string }) {
  const clase = cn(
    CLASE_PIE,
    "inline-flex items-center gap-1 outline-none after:absolute after:inset-0 after:content-['']",
  );
  const contenido = (
    <>
      {texto}
      <ArrowRight aria-hidden="true" className="size-4" />
    </>
  );
  return a.startsWith('#') ? (
    <a href={a} className={clase}>
      {contenido}
    </a>
  ) : (
    <Link to={a} className={clase}>
      {contenido}
    </Link>
  );
}

/** El número grande de una tarjeta: conteo literal, con la unidad o el contexto al lado. */
export function Numero({ children, contexto }: { children: ReactNode; contexto?: ReactNode }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-5xl font-semibold tracking-tight tabular-nums text-foreground">
        {children}
      </span>
      {contexto && <span className="text-sm text-muted-foreground">{contexto}</span>}
    </p>
  );
}
