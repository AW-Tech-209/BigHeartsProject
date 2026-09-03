import { Heart } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * El lockup de marca: ícono de corazón + palabra. Hereda el color del contenedor
 * (`currentColor`), así sirve igual sobre superficie clara (`text-primary`) que
 * sobre el panel `--brand` (`text-brand-foreground`).
 */
export function MarcaBigHearts({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-lg font-semibold', className)}>
      <Heart aria-hidden="true" strokeWidth={0} fill="currentColor" className="size-6 shrink-0" />
      BigHearts
    </span>
  );
}
