import { BookingStatus } from '@academia/types';
import { CircleCheck, CircleMinus, CircleX, Clock } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

/**
 * El resultado de una reserva pasada, en primera persona (HU-404, AC1).
 *
 * `NO_SHOW` va en texto neutro, sin ícono de alerta —«No asististe», nunca
 * «Faltaste»— porque es un dato, no una reprimenda (T7).
 */
export function BadgeResultadoHistorial({ estado }: { estado: BookingStatus | null }) {
  switch (estado) {
    case BookingStatus.ATTENDED:
      return (
        <Badge tono="success" icon={CircleCheck}>
          Asististe
        </Badge>
      );
    case BookingStatus.NO_SHOW:
      return (
        <Badge tono="neutral" icon={CircleMinus}>
          No asististe
        </Badge>
      );
    case BookingStatus.CANCELLED:
      return (
        <Badge tono="destructive" icon={CircleX}>
          Cancelaste
        </Badge>
      );
    default:
      // El profesor todavía no marcó asistencia (D33: sin límite de tiempo).
      return (
        <Badge tono="neutral" icon={Clock}>
          Sin marcar
        </Badge>
      );
  }
}
