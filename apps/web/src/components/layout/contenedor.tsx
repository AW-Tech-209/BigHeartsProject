import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Ancho de lectura de toda la aplicación: 1152px centrados.
 *
 * Existe como componente y no como clase suelta porque el ancho lo comparten la
 * barra del shell y el contenido: si se escribiera a mano en cada sitio, la
 * marca de la barra y el título de la página dejarían de estar alineados en
 * cuanto alguien tocara uno de los dos.
 */
export function Contenedor({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6', className)} {...props} />;
}
