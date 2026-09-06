import type { AulaImpartida } from '@academia/types';

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

type TablaHistorialProfesorProps = {
  items: AulaImpartida[];
  total: number;
};

/** El historial del profesor (HU-404, AC2): clase, fecha, inscritos y asistentes. */
export function TablaHistorialProfesor({ items, total }: TablaHistorialProfesorProps) {
  return (
    <Table>
      <TableCaption>
        {total === 1 ? '1 aula encontrada.' : `${total} aulas encontradas.`}
      </TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Clase</TableHead>
          <TableHead>Fecha</TableHead>
          <TableHead className="text-right">Inscritos</TableHead>
          <TableHead className="text-right">Asistieron</TableHead>
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
            <TableCell className="text-right text-foreground tabular-nums">
              {item.totalInscritos}
            </TableCell>
            <TableCell className="text-right text-foreground tabular-nums">
              {item.totalAsistieron}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
