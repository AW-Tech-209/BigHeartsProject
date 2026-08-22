import type { CommunicationPreference } from '@academia/types';
import { CircleHelp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  etiquetaModoComunicacion,
  iconoModoComunicacion,
} from '@/features/aulas/lib/modos-comunicacion';

type ModoComunicacionBadgeProps = {
  /** El modo a mostrar, o `null` si el aula no lo tiene indicado. */
  modo: CommunicationPreference | null;
  className?: string;
};

/**
 * Un modo de comunicación con su codificación triple (ícono + texto sobre un
 * tono neutro): es un DATO que el profesor declaró, no un estado con
 * significado propio en el diccionario de color del skill, así que no lleva
 * ni `success` ni `attention` — solo `neutral`.
 *
 * Sin `modo` pinta «Modo sin indicar» (HU-211, decisión 5): a un aula sin
 * declarar no se le inventa un valor, y la interfaz lo dice tal cual.
 */
export function ModoComunicacionBadge({ modo, className }: ModoComunicacionBadgeProps) {
  if (!modo) {
    return (
      <Badge tono="neutral" icon={CircleHelp} className={className}>
        Modo sin indicar
      </Badge>
    );
  }

  return (
    <Badge tono="neutral" icon={iconoModoComunicacion[modo]} className={className}>
      {etiquetaModoComunicacion[modo]}
    </Badge>
  );
}
