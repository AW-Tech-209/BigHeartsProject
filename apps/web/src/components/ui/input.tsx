import type { LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

type InputProps = React.ComponentPropsWithoutRef<'input'> & {
  /** Ícono guía a la izquierda. Es decorativo: no sustituye a la etiqueta. */
  iconoInicio?: LucideIcon;
};

/**
 * Input de texto accesible. Alto 44px (objetivo táctil mínimo), borde con
 * contraste ≥3:1 (`--input`) y borde destructivo cuando `aria-invalid`.
 * El anillo de foco lo aplica la regla global `:focus-visible`.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = 'text', iconoInicio: Icono, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-11 w-full rounded-lg border border-input bg-card px-3.5 text-base text-foreground',
        'transition-colors placeholder:text-muted-foreground',
        'aria-invalid:border-destructive-border aria-invalid:bg-destructive-soft/40',
        'disabled:cursor-not-allowed disabled:opacity-50',
        Icono && 'pl-10',
        className,
      )}
      {...props}
    />
  );

  if (!Icono) return input;

  return (
    <span className="relative block">
      <Icono
        aria-hidden="true"
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
      {input}
    </span>
  );
});
