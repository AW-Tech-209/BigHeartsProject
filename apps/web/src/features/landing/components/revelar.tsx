import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { useRevelar } from '../lib/use-revelar';

type RevelarProps = {
  children: ReactNode;
  /** Retraso en ms, para escalonar bloques hermanos. */
  retraso?: number;
  className?: string;
};

/**
 * Envuelve un bloque de la landing para que aparezca con un desplazamiento y un
 * fundido suaves al entrar en pantalla. Sin JS o con movimiento reducido el
 * contenido se muestra tal cual.
 */
export function Revelar({ children, retraso = 0, className }: RevelarProps) {
  const { ref, visible, anima } = useRevelar();

  return (
    <div
      ref={ref}
      data-visible={visible}
      style={anima && retraso ? { transitionDelay: `${retraso}ms` } : undefined}
      className={cn(anima && 'revelar', className)}
    >
      {children}
    </div>
  );
}
