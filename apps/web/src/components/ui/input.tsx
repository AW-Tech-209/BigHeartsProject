import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Input de texto accesible. Alto 44px (objetivo táctil mínimo), borde con
 * contraste ≥3:1 (`--input`) y borde destructivo cuando `aria-invalid`.
 * El anillo de foco lo aplica la regla global `:focus-visible`.
 */
export const Input = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-11 w-full rounded-lg border border-input bg-card px-3.5 text-base text-foreground',
          'transition-colors placeholder:text-muted-foreground',
          'aria-invalid:border-destructive-border aria-invalid:bg-destructive-soft/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
