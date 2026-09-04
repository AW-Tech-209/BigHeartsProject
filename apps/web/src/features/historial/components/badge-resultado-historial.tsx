import { BookingStatus } from '@academia/types';
import { CircleCheck, CircleMinus, CircleX, Clock, type LucideIcon } from 'lucide-react';

import { Badge, type badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

type Tono = NonNullable<VariantProps<typeof badgeVariants>['tono']>;

/**
 * El resultado de una reserva pasada, en primera persona (HU-404, AC1), con su
 * ícono y tono. Centralizado aquí porque `<FilaHistorial>` reutiliza el mismo
 * ícono en el chip de la fila — misma forma en dos sitios, nunca dos mapeos
 * que un día puedan decir cosas distintas.
 *
 * `NO_SHOW` va en tono neutro, sin ícono de alerta —«No asististe», nunca
 * «Faltaste»— porque es un dato, no una reprimenda (T7).
 */
export function resultadoHistorial(estado: BookingStatus | null): {
  icon: LucideIcon;
  texto: string;
  tono: Tono;
} {
  switch (estado) {
    case BookingStatus.ATTENDED:
      return { icon: CircleCheck, texto: 'Asististe', tono: 'success' };
    case BookingStatus.NO_SHOW:
      return { icon: CircleMinus, texto: 'No asististe', tono: 'neutral' };
    case BookingStatus.CANCELLED:
      return { icon: CircleX, texto: 'Cancelaste', tono: 'destructive' };
    default:
      // El profesor todavía no marcó asistencia (D33: sin límite de tiempo).
      return { icon: Clock, texto: 'Sin marcar', tono: 'neutral' };
  }
}

export function BadgeResultadoHistorial({ estado }: { estado: BookingStatus | null }) {
  const { icon, texto, tono } = resultadoHistorial(estado);

  return (
    <Badge tono={tono} icon={icon}>
      {texto}
    </Badge>
  );
}
