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
import { describirHorario } from '@/features/aulas/lib/horario';

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
          <TableHead>Inscritos</TableHead>
          <TableHead>Asistieron</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableHead scope="row" className="font-normal text-foreground">
              {item.title}
            </TableHead>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {describirHorario(item.scheduledAt)}
            </TableCell>
            <TableCell className="text-foreground">{item.totalInscritos}</TableCell>
            <TableCell className="text-foreground">{item.totalAsistieron}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
