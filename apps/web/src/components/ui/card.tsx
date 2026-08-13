import { cn } from '@/lib/utils';

/** Superficie base: borde de 1px + fondo (la elevación es por borde, no sombra). */
export function Card({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={cn('rounded-xl border border-border bg-card', className)} {...props} />;
}
