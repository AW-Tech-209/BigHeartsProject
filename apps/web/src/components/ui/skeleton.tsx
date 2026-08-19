import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Bloque gris que ocupa el sitio del contenido mientras carga.
 *
 * Va `aria-hidden` **a propósito**: para un lector de pantalla un esqueleto es
 * ruido, y aquí el ruido no es un detalle — quien no oye el sistema depende por
 * completo de lo que la pantalla y el lector le dicen. El estado de carga se
 * anuncia con TEXTO en un `role="status"` del contenedor
 * (`Cargando aulas disponibles…`), nunca con la animación sola.
 *
 * ```tsx
 * <div role="status" className="space-y-3">
 *   <span className="sr-only">Cargando aulas disponibles…</span>
 *   <Skeleton className="h-24" />
 * </div>
 * ```
 */
export function Skeleton({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-muted', className)}
      {...props}
    />
  );
}
