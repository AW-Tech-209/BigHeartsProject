import type { ClassroomListItem } from '@academia/types';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { describirFechaCompacta } from '@/features/aulas/lib/horario';
import { BadgeResultadoHistorial } from './badge-resultado-historial';

type TablaHistorialEstudianteProps = {
  items: ClassroomListItem[];
  total: number;
};

/** El historial del estudiante (HU-404, AC1): clase, fecha con zona, profesor y resultado. */
export function TablaHistorialEstudiante({ items, total }: TablaHistorialEstudianteProps) {
  return (
    <Table>
      <TableCaption>
        {total === 1 ? '1 clase encontrada.' : `${total} clases encontradas.`}
      </TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Clase</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead>Profesor</TableHead>
          <TableHead>Resultado</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableHead scope="row" className="font-medium text-foreground">
              {item.title}
            </TableHead>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {describirFechaCompacta(item.scheduledAt)}
            </TableCell>
            <TableCell className="whitespace-nowrap text-foreground">
              {item.teacherFirstName} {item.teacherLastName}
            </TableCell>
            <TableCell>
              <BadgeResultadoHistorial estado={item.myBookingStatus} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
