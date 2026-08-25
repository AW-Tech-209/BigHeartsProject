import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Rejilla de tarjetas: 1 columna en móvil, 2 desde 640px, 3 desde 1024px.
 *
 * **Nunca cuatro.** No es una preferencia estética: a partir de la cuarta
 * columna el título de un aula parte en tres líneas y la lista deja de poder
 * escanearse de un vistazo, que es justo para lo que existe la tarjeta.
 */
export function RejillaAulas({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}
      {...props}
    />
  );
}
