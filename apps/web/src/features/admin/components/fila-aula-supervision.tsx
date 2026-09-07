import { type ClassroomListItem, derivarEstadoAula } from '@academia/types';

import { EstadoAula } from '@/components/dominio/estado-aula';
import { varianteEstadoAula } from '@/components/dominio/estado-aula-variantes';
import { FilaLista } from '@/components/dominio/fila-lista';
import { IndicadorCupo } from '@/components/dominio/indicador-cupo';
import { describirFechaCompacta } from '@/features/aulas/lib/horario';

type FilaAulaSupervisionProps = {
  classroom: ClassroomListItem;
  /** El reloj contra el que se deriva el estado. Por defecto, ahora mismo. */
  ahora?: Date;
};

/**
 * Una fila de la supervisión (HU-210 T9): profesor, título enlazado al detalle,
 * fecha, estado e inscritos sobre cupo. Fila y no tarjeta —el admin administra,
 * no elige (`layout-y-composicion.md`)— y adopta `<FilaLista>` como el historial.
 *
 * El estado se deriva con `derivarEstadoAula()` de `@academia/types`, nunca
 * reimplementado; el chip toma su ícono y su tono.
 */
export function FilaAulaSupervision({ classroom, ahora = new Date() }: FilaAulaSupervisionProps) {
  const estado = derivarEstadoAula({ classroom, ahora });
  const variante = varianteEstadoAula[estado];
  const cuposRestantes = Math.max(classroom.maxStudents - classroom.currentBookings, 0);

  return (
    <FilaLista
      aulaId={classroom.id}
      icon={variante.icon}
      tono={variante.tono}
      titulo={classroom.title}
      subtitulo={
        <>
          <span className="font-medium text-foreground">
            {classroom.teacherFirstName} {classroom.teacherLastName}
          </span>
          {' · '}
          {describirFechaCompacta(classroom.scheduledAt)}
        </>
      }
    >
      <EstadoAula estado={estado} cuposRestantes={cuposRestantes} />
      <IndicadorCupo
        variante="inscritos"
        maxStudents={classroom.maxStudents}
        currentBookings={classroom.currentBookings}
      />
    </FilaLista>
  );
}
