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
 * Una fila del historial (`layout-y-composicion.md` §4: fila para listas
 * largas, sin `rounded-xl`). El chip de la izquierda es un refuerzo de forma
 * Y de color —el mismo tono e ícono que ya lleva el resultado a la
 * derecha—, nunca una señal nueva: quien la mira sin distinguir el color
 * todavía tiene la forma y el texto del resultado.
 */
type FilaHistorialProps = {
  aulaId: string;
  icon: LucideIcon;
  /** Tono del chip; por defecto neutro (el historial del profesor no tiene resultado). */
  tono?: Tono;
  titulo: string;
  subtitulo: string;
  /** El resultado o las cifras de la fila, a la derecha. */
  children: ReactNode;
};

export function FilaHistorial({
  aulaId,
  icon: Icon,
  tono = 'neutral',
  titulo,
  subtitulo,
  children,
}: FilaHistorialProps) {
  return (
    <li className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
      <span
        aria-hidden="true"
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg',
          CHIP_POR_TONO[tono],
        )}
      >
        <Icon strokeWidth={2} className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
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

      <div className="shrink-0">{children}</div>
    </li>
  );
}
