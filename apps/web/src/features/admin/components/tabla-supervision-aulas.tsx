import type { ClassroomListItem } from '@academia/types';

import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FilaAulaSupervision } from './fila-aula-supervision';

type TablaSupervisionAulasProps = {
  items: ClassroomListItem[];
  total: number;
  ahora?: Date;
};

/**
 * La supervisión completa, como tabla (T9, AC7): fila y no tarjeta, porque
 * aquí se escanea para administrar, no para elegir. Mismo mecanismo que
 * `<PendingTeachersTable>`: `<table>` nativa, `<caption>` visible y
 * `<th scope="col">`/`scope="row"`.
 */
export function TablaSupervisionAulas({ items, total, ahora }: TablaSupervisionAulasProps) {
  return (
    <Table>
      <TableCaption>
        {total === 1 ? '1 aula encontrada.' : `${total} aulas encontradas.`}
      </TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Profesor</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Inscritos</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((classroom) => (
          <FilaAulaSupervision key={classroom.id} classroom={classroom} ahora={ahora} />
        ))}
      </TableBody>
    </Table>
  );
}
