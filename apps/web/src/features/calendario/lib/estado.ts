import { BookingStatus, derivarEstadoAula } from '@academia/types';

import type { EstadoAula } from '@/components/dominio/estado-aula-variantes';

import type { AulaEnCalendario } from '../components/evento-calendario';

export function estadoEnCalendario(aula: AulaEnCalendario, ahora: Date): EstadoAula {
  return derivarEstadoAula({
    classroom: aula,
    ahora,
    tieneReservaConfirmada: aula.myBookingStatus === BookingStatus.CONFIRMED,
  });
}
