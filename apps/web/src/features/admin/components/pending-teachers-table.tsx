import type { User } from '@academia/types';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRequestDate, type TeacherResolution } from '../lib/teacher-resolution';
import { ResolveTeacherDialog } from './resolve-teacher-dialog';

type PendingTeachersTableProps = {
  teachers: User[];
  /** Id del profesor cuya resolución está en vuelo, o `null` si no hay ninguna. */
  resolvingId: string | null;
  /** Debe resolverse cuando el servidor responda, falle o no (ver el diálogo). */
  onResolve: (teacher: User, resolution: TeacherResolution) => void | Promise<void>;
};

/**
 * La cola de aprobación, como tabla.
 *
 * **Tabla y no tarjetas** porque aquí se escanea para administrar, no para
 * elegir (`layout-y-composicion.md`, «Tarjeta o fila»): las columnas alineadas
 * permiten comparar fechas de solicitud de un vistazo, cosa que doce tarjetas
 * no permiten.
 *
 * Se monta sobre `<table>` nativa, con `<caption>` y `<th scope="col">`. Un
 * `<div role="table">` habría costado lo mismo y habría perdido la navegación
 * por celdas que los lectores de pantalla ya traen gratis.
 *
 * Las acciones son `<button>` de verdad, no filas pulsables: una fila con
 * `onClick` no sale en la lista de controles de un lector de pantalla, no se
 * alcanza con Tab y no dice qué hace.
 */
export function PendingTeachersTable({
  teachers,
  resolvingId,
  onResolve,
}: PendingTeachersTableProps) {
  return (
    <Table>
      {/* El `<caption>` es el nombre accesible de la tabla: lo primero que se
          oye al entrar en ella. Va visible porque también sirve de contexto a
          quien la ve — el número dice cuánto trabajo hay. */}
      <TableCaption>
        {teachers.length === 1
          ? '1 profesor espera tu aprobación, del más antiguo al más reciente.'
          : `${teachers.length} profesores esperan tu aprobación, del más antiguo al más reciente.`}
      </TableCaption>

      <TableHeader>
        <TableRow>
          <TableHead>Profesor</TableHead>
          <TableHead>Solicitud</TableHead>
          {/* La columna de acciones no tiene título visible que aporte nada,
              pero omitirlo dejaría un `<th>` vacío que el lector anuncia como
              «en blanco». */}
          <TableHead className="text-right">
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {teachers.map((teacher) => (
          <TableRow key={teacher.id}>
            {/* `scope="row"` convierte el nombre en el encabezado de la fila:
                al leer la celda de la fecha, el lector dice de quién es. */}
            <TableHead scope="row" className="font-normal text-foreground">
              <span className="block font-medium">
                {teacher.firstName} {teacher.lastName}
              </span>
              <span className="block text-sm text-muted-foreground">{teacher.email}</span>
            </TableHead>

            <TableCell className="text-muted-foreground whitespace-nowrap">
              {formatRequestDate(teacher.createdAt)}
            </TableCell>

            <TableCell>
              <div className="flex flex-wrap justify-end gap-2">
                <ResolveTeacherDialog
                  teacher={teacher}
                  resolution="approve"
                  isPending={resolvingId === teacher.id}
                  onConfirm={() => onResolve(teacher, 'approve')}
                />
                <ResolveTeacherDialog
                  teacher={teacher}
                  resolution="reject"
                  isPending={resolvingId === teacher.id}
                  onConfirm={() => onResolve(teacher, 'reject')}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
