import { BookingStatus, derivarEstadoAula, type ClassroomListItem } from '@academia/types';
import { Link } from 'react-router-dom';

import { EstadoAula } from '@/components/dominio/estado-aula';
import { varianteEstadoAula } from '@/components/dominio/estado-aula-variantes';
import { ModoInstruccion } from '@/components/dominio/modo-instruccion';
import { describirHorarioPartes, describirHorarioRenglon } from '@/features/aulas/lib/horario';
import { cn } from '@/lib/utils';

export type AulaEnCalendario = Pick<
  ClassroomListItem,
  | 'id'
  | 'title'
  | 'scheduledAt'
  | 'durationMinutes'
  | 'status'
  | 'currentBookings'
  | 'maxStudents'
  | 'instructionMode'
> &
  Partial<Pick<ClassroomListItem, 'myBookingStatus'>>;

/** Una clase de la semana: un enlace al detalle con riel, hora, título, estado y modo. */
export function EventoCalendario({ aula, ahora }: { aula: AulaEnCalendario; ahora: Date }) {
  const estado = derivarEstadoAula({
    classroom: aula,
    ahora,
    tieneReservaConfirmada: aula.myBookingStatus === BookingStatus.CONFIRMED,
  });
  const { hora } = describirHorarioRenglon(aula.scheduledAt);
  const { cuando } = describirHorarioPartes(aula.scheduledAt);

  return (
    <Link
      to={`/aulas/${aula.id}`}
      aria-label={`${cuando}: ${aula.title}`}
      className="transicion-rapida relative block space-y-2 overflow-hidden rounded-lg border border-border bg-card p-3 pl-4 shadow-xs hover:border-foreground/30"
    >
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 w-1', varianteEstadoAula[estado].riel)}
      />
      <span className="block text-sm font-medium tabular-nums text-muted-foreground">{hora}</span>
      <span className="block font-medium text-foreground">{aula.title}</span>
      <EstadoAula estado={estado} />
      <ModoInstruccion modo={aula.instructionMode} />
    </Link>
  );
}
