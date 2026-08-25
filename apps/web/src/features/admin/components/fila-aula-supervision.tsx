import { type ClassroomListItem, derivarEstadoAula } from '@academia/types';

import { EstadoAula } from '@/components/dominio/estado-aula';
import { varianteEstadoAula } from '@/components/dominio/estado-aula-variantes';
import { IndicadorCupo } from '@/components/dominio/indicador-cupo';
import { TableCell, TableHead, TableRow } from '@/components/ui/table';
import { describirHorario } from '@/features/aulas/lib/horario';

type FilaAulaSupervisionProps = {
  classroom: ClassroomListItem;
  /** El reloj contra el que se deriva el estado. Por defecto, ahora mismo. */
  ahora?: Date;
};

/**
 * Una fila de la supervisión (T9): profesor, título, fecha con zona
 * explícita, estado e inscritos sobre cupo. Fila y no tarjeta —el admin
 * administra, no elige (`layout-y-composicion.md`)— pero conserva el riel de
 * estado de 4px como borde izquierdo de la primera celda: la firma visual del
 * producto no desaparece solo porque cambió de forma.
 *
 * El estado se deriva aquí con `derivarEstadoAula()` de `@academia/types`,
 * nunca reimplementado, igual que en `<TarjetaAula>`.
 */
export function FilaAulaSupervision({ classroom, ahora = new Date() }: FilaAulaSupervisionProps) {
  const estado = derivarEstadoAula({ classroom, ahora });
  const variante = varianteEstadoAula[estado];
  const cuposRestantes = Math.max(classroom.maxStudents - classroom.currentBookings, 0);
  // Mismo token que el riel de la tarjeta, en forma de borde: `bg-*` → `border-*`.
  const rielBorde = variante.riel.replace('bg-', 'border-');

  return (
    <TableRow>
      <TableHead scope="row" className={`border-l-4 font-normal text-foreground ${rielBorde}`}>
        {classroom.teacherFirstName} {classroom.teacherLastName}
      </TableHead>
      <TableCell className="text-foreground">{classroom.title}</TableCell>
      <TableCell className="text-muted-foreground whitespace-nowrap">
        {describirHorario(classroom.scheduledAt)}
      </TableCell>
      <TableCell>
        <EstadoAula estado={estado} cuposRestantes={cuposRestantes} />
      </TableCell>
      <TableCell>
        <IndicadorCupo
          variante="inscritos"
          maxStudents={classroom.maxStudents}
          currentBookings={classroom.currentBookings}
        />
      </TableCell>
    </TableRow>
  );
}
