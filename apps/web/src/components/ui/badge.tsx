import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Etiqueta corta: estado, categoría, conteo.
 *
 * Dos ejes separados a propósito, `tono` y `enfasis`:
 *  - el **tono** dice QUÉ significa (el diccionario de color del skill);
 *  - el **énfasis** dice CUÁNTO grita.
 *
 * Están separados porque la regla del sólido es una decisión de producto —solo
 * `acceso-abierto` y `en-curso` van en color pleno— y no una propiedad del
 * color. Vive en `components/dominio/estado-aula-variantes.ts`, no aquí: esta
 * primitiva es genérica y no debe conocer los estados del aula.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
  {
    variants: {
      tono: {
        neutral: 'border-border bg-muted text-muted-foreground',
        primary: 'border-primary/30 bg-primary-soft text-primary-soft-foreground',
        success: 'border-success-border bg-success-soft text-success-soft-foreground',
        attention: 'border-attention-border bg-attention-soft text-attention-soft-foreground',
        destructive:
          'border-destructive-border bg-destructive-soft text-destructive-soft-foreground',
        info: 'border-info/30 bg-info-soft text-info-soft-foreground',
      },
      enfasis: {
        suave: '',
        solido: '',
      },
    },
    compoundVariants: [
      {
        tono: 'neutral',
        enfasis: 'solido',
        class: 'border-foreground bg-foreground text-background',
      },
      {
        tono: 'primary',
        enfasis: 'solido',
        class: 'border-primary bg-primary text-primary-foreground',
      },
      {
        tono: 'success',
        enfasis: 'solido',
        class: 'border-success bg-success text-success-foreground',
      },
      {
        tono: 'attention',
        enfasis: 'solido',
        class: 'border-attention bg-attention text-attention-foreground',
      },
      {
        tono: 'destructive',
        enfasis: 'solido',
        class: 'border-destructive bg-destructive text-destructive-foreground',
      },
      { tono: 'info', enfasis: 'solido', class: 'border-info bg-info text-info-foreground' },
    ],
    defaultVariants: { tono: 'neutral', enfasis: 'suave' },
  },
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  children: ReactNode;
  /**
   * Ícono de lucide. **Obligatorio cuando la etiqueta comunica un estado**: sin
   * él el estado viajaría solo en el color, y el color solo no llega a quien no
   * lo distingue ni sobrevive al modo de alto contraste.
   */
  icon?: LucideIcon;
  className?: string;
};

export function Badge({ tono, enfasis, icon: Icon, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tono, enfasis }), className)}>
      {Icon && <Icon aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />}
      {children}
    </span>
  );
}

export { badgeVariants };
