import { cn } from '@/lib/utils';

/** Label visible (nunca placeholder como etiqueta). Peso 500, tamaño 15px. */
export function Label({ className, ...props }: React.ComponentPropsWithoutRef<'label'>) {
  return (
    <label
      className={cn('text-sm font-medium text-foreground select-none', className)}
      {...props}
    />
  );
}
