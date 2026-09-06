import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * La altura del renglón de aula en reposo. La comparten los esqueletos de carga
 * de cada pantalla para que la lista no salte cuando llegan los datos.
 */
export const ALTURA_RENGLON_AULA = 'h-28';

/**
 * Lista de aulas: una pila de una sola columna a todo el ancho. Cada aula es un
 * renglón horizontal de alto modular (`<TarjetaAula>`), no una tarjeta en
 * rejilla — así una lista larga se escanea sin que el número de etiquetas de
 * cada clase descoloque la siguiente.
 *
 * La rejilla 1/2/3 columnas (`<RejillaAulas>`) queda para los tableros donde el
 * aula se pinta compacta (las próximas clases del panel del estudiante).
 */
export function ListaAulas({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('flex flex-col gap-2.5', className)} {...props} />;
}
