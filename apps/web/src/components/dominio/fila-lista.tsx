import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import type { badgeVariants } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';

type Tono = NonNullable<VariantProps<typeof badgeVariants>['tono']>;

/** El mismo tono suave que ya usa `<Badge>`, aplicado al fondo del chip. */
const CHIP_POR_TONO: Record<Tono, string> = {
  neutral: 'bg-muted text-muted-foreground',
  primary: 'bg-primary-soft text-primary-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  attention: 'bg-attention-soft text-attention-soft-foreground',
  destructive: 'bg-destructive-soft text-destructive-soft-foreground',
  info: 'bg-info-soft text-info-soft-foreground',
};

/**
 * Una fila de lista (`layout-y-composicion.md` §4: fila para administrar y
 * listas largas, sin `rounded-xl`). La usan el historial (HU-415) y la
 * supervisión de aulas del admin (HU-210) — dejó de ser `<table>` en ambos.
 *
 * El chip de la izquierda es un refuerzo de forma Y de color —el mismo tono e
 * ícono que lleva el resultado/estado a la derecha—, nunca una señal nueva:
 * quien la mira sin distinguir el color todavía tiene la forma y el texto.
 *
 * En `sm+` los elementos de la derecha (badge de estado, cifras y botón de
 * acción) van **en fila**, con el botón al extremo derecho. Bajo `sm` la fila
 * apila: cabecera arriba y ese bloque debajo, sangrado y envolviendo.
 */
type FilaListaProps = {
  aulaId: string;
  icon: LucideIcon;
  /** Tono del chip; por defecto neutro. */
  tono?: Tono;
  titulo: string;
  subtitulo: ReactNode;
  /** El resultado, el estado o las cifras de la fila, a la derecha (o debajo en móvil). */
  children: ReactNode;
};

export function FilaLista({
  aulaId,
  icon: Icon,
  tono = 'neutral',
  titulo,
  subtitulo,
  children,
}: FilaListaProps) {
  return (
    <li className="flex flex-col gap-2.5 border-b border-border px-4 py-4 transicion-suave last:border-b-0 hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span
          aria-hidden="true"
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            CHIP_POR_TONO[tono],
          )}
        >
          <Icon strokeWidth={2} className="size-5" />
        </span>

        <div className="min-w-0">
          <p className="truncate text-base font-medium text-foreground">
            <Link
              to={`/aulas/${aulaId}`}
              className="rounded-sm underline-offset-4 outline-none hover:underline"
            >
              {titulo}
            </Link>
          </p>
          <p className="truncate text-sm text-muted-foreground">{subtitulo}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-14 sm:justify-end sm:gap-x-4 sm:pl-0">
        {children}
      </div>
    </li>
  );
}
