import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Contenedor } from '@/components/layout/contenedor';
import { cn } from '@/lib/utils';

type SeccionLandingProps = ComponentPropsWithoutRef<'section'> & {
  /** Ancla para la navegación de la cabecera. */
  id: string;
  /** Fondo a sangre completa. `card` es el tono oscuro invertido. */
  fondo?: 'base' | 'muted' | 'tinta';
  children: ReactNode;
};

const FONDO: Record<NonNullable<SeccionLandingProps['fondo']>, string> = {
  base: 'bg-background',
  muted: 'bg-muted',
  tinta: 'bg-foreground text-background',
};

/**
 * Una sección de la landing: fondo a sangre completa, borde inferior de
 * separación y el contenido dentro del contenedor de 1152px de la app.
 */
export function SeccionLanding({
  id,
  fondo = 'base',
  className,
  children,
  ...props
}: SeccionLandingProps) {
  return (
    <section id={id} className={cn('scroll-mt-20 border-b border-border', FONDO[fondo])} {...props}>
      <Contenedor className={cn('py-16 sm:py-24', className)}>{children}</Contenedor>
    </section>
  );
}

const COLOR_MARCA: Record<string, string> = {
  primary: 'bg-primary',
  attention: 'bg-attention',
  neutral: 'bg-muted-foreground',
};

/**
 * El rótulo que abre cada sección: una franja de 4px con color de significado y
 * un texto en la tipografía monoespaciada. Jerarquía por tamaño y peso, nunca
 * por color — el color de la franja solo refuerza de qué habla el bloque.
 */
export function RotuloSeccion({
  children,
  color = 'primary',
  className,
}: {
  children: ReactNode;
  color?: 'primary' | 'attention' | 'neutral';
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 font-mono text-[13px] tracking-wide text-muted-foreground',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('block h-5 w-1 shrink-0', COLOR_MARCA[color])} />
      {children}
    </p>
  );
}
