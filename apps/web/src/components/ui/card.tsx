import { cn } from '@/lib/utils';

/** Superficie base: borde de 1px + fondo, con una sombra mínima que la despega
 *  del lienzo sin convertirla en capa flotante. */
export function Card({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card shadow-xs', className)}
      {...props}
    />
  );
}
