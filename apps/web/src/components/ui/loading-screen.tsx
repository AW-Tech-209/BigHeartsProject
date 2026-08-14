import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Estado de carga a pantalla completa.
 *
 * Nunca es un spinner suelto: §9 de la guía exige que todo estado de carga
 * lleve texto, porque el ícono girando no dice QUÉ se está esperando. El
 * `role="status"` hace que el lector de pantalla lo lea sin robar el foco, y
 * con `prefers-reduced-motion` la regla global detiene el giro — el texto
 * sigue explicando lo mismo por sí solo.
 */
export function LoadingScreen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn('grid min-h-dvh place-items-center bg-background px-4', className)}
    >
      <p className="flex items-center gap-3 text-base text-muted-foreground">
        <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 shrink-0 animate-spin" />
        {children}
      </p>
    </div>
  );
}
