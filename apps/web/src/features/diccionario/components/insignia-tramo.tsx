import { TRAMO_MODULO_LABELS, type TramoModulo } from '@academia/types';

import { cn } from '@/lib/utils';
import { ESTILO_TRAMO } from '../lib/tramos';

type InsigniaTramoProps = {
  tramo: TramoModulo;
  /** Texto en lugar del nombre del tramo (p. ej. «Módulo 1» en una sugerencia). */
  texto?: string;
  /** Antepone «Módulo N · » al nombre del tramo. */
  modulo?: number;
  className?: string;
};

/** Categórica, no de estado: color del tramo + barras + texto, para que nunca dependa del color. */
export function InsigniaTramo({ tramo, texto, modulo, className }: InsigniaTramoProps) {
  const { icono: Icono, texto: color, borde } = ESTILO_TRAMO[tramo];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-0.5 text-sm font-medium',
        borde,
        color,
        className,
      )}
    >
      <Icono aria-hidden="true" strokeWidth={2.5} className="size-4 shrink-0" />
      {modulo !== undefined && <span className="text-foreground">Módulo {modulo} ·</span>}
      {texto ?? TRAMO_MODULO_LABELS[tramo]}
      {texto && <span className="sr-only">, tramo {TRAMO_MODULO_LABELS[tramo]}</span>}
    </span>
  );
}
