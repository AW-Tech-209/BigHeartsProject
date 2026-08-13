import { ChevronDown } from 'lucide-react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Select nativo estilizado. Se usa el `<select>` del navegador a propósito: es
 * el control más robusto para teclado y lectores de pantalla. El chevron es
 * decorativo (`aria-hidden`).
 */
export const NativeSelect = forwardRef<HTMLSelectElement, React.ComponentPropsWithoutRef<'select'>>(
  function NativeSelect({ className, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'h-11 w-full appearance-none rounded-lg border border-input bg-card pr-10 pl-3.5',
            'text-base text-foreground transition-colors',
            'aria-invalid:border-destructive-border',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  },
);
