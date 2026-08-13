import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlert, CircleCheck, Clock, Info, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const calloutVariants = cva('flex gap-3 rounded-xl border p-4 text-base', {
  variants: {
    variant: {
      info: 'border-info/30 bg-info-soft text-info-soft-foreground',
      success: 'border-success-border bg-success-soft text-success-soft-foreground',
      attention: 'border-attention-border bg-attention-soft text-attention-soft-foreground',
      destructive: 'border-destructive-border bg-destructive-soft text-destructive-soft-foreground',
    },
  },
  defaultVariants: { variant: 'info' },
});

/** Ícono por defecto de cada variante (se puede sobrescribir con `icon`). */
const defaultIcon: Record<
  NonNullable<VariantProps<typeof calloutVariants>['variant']>,
  LucideIcon
> = {
  info: Info,
  success: CircleCheck,
  attention: Clock,
  destructive: CircleAlert,
};

type CalloutProps = VariantProps<typeof calloutVariants> & {
  title?: ReactNode;
  children?: ReactNode;
  /** Sobrescribe el ícono por defecto de la variante. */
  icon?: LucideIcon;
  className?: string;
  /** Región viva: `polite` para confirmaciones, `assertive` para errores que bloquean. */
  live?: 'polite' | 'assertive' | 'off';
};

/**
 * Mensaje contextual con triple codificación obligatoria: color + ícono + texto
 * (§8 de la guía). Sirve para confirmaciones, avisos y errores a nivel de bloque.
 */
export function Callout({
  variant = 'info',
  title,
  children,
  icon,
  className,
  live,
}: CalloutProps) {
  const Icon = icon ?? defaultIcon[variant ?? 'info'];

  return (
    <div
      className={cn(calloutVariants({ variant }), className)}
      role={live === 'assertive' ? 'alert' : undefined}
      aria-live={live && live !== 'assertive' ? live : undefined}
    >
      <Icon aria-hidden="true" strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="max-w-[65ch] leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
