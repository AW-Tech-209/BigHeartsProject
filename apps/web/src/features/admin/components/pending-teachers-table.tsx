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
 *
 * **Bajo `sm` la fila se convierte en tarjeta** (HU-508, T4): tres columnas no
 * caben en 375px y la alternativa —barrido horizontal— deja las acciones fuera
 * de la pantalla. Se apila con CSS sobre el MISMO `<table>`, no con un segundo
 * marcado: cambiar `display` le quita a la tabla sus roles implícitos, así que
 * se declaran a mano para que el lector de pantalla siga leyendo lo mismo.
 */
export function PendingTeachersTable({
  teachers,
  resolvingId,
  onResolve,
}: PendingTeachersTableProps) {
  return (
    <Table role="table" className="max-sm:block">
      {/* El `<caption>` es el nombre accesible de la tabla: lo primero que se
          oye al entrar en ella. Va visible porque también sirve de contexto a
          quien la ve — el número dice cuánto trabajo hay. */}
      <TableCaption>
        {teachers.length === 1
          ? '1 profesor espera tu aprobación, del más antiguo al más reciente.'
          : `${teachers.length} profesores esperan tu aprobación, del más antiguo al más reciente.`}
      </TableCaption>

      <TableHeader className="max-sm:hidden">
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

      <TableBody role="rowgroup" className="max-sm:block max-sm:space-y-3 max-sm:px-4 max-sm:pb-4">
        {teachers.map((teacher) => (
          <TableRow
            key={teacher.id}
            role="row"
            className="max-sm:block max-sm:rounded-xl max-sm:border max-sm:border-border max-sm:p-4"
          >
            {/* `scope="row"` convierte el nombre en el encabezado de la fila:
                al leer la celda de la fecha, el lector dice de quién es. */}
            <TableHead
              scope="row"
              role="rowheader"
              className="font-normal text-foreground max-sm:block max-sm:px-0 max-sm:pt-0"
            >
              <span className="block font-medium">
                {teacher.firstName} {teacher.lastName}
              </span>
              <span className="block text-sm break-words text-muted-foreground">
                {teacher.email}
              </span>
            </TableHead>

            <TableCell
              role="cell"
              className="text-muted-foreground max-sm:block max-sm:px-0 max-sm:py-1 sm:whitespace-nowrap"
            >
              {/* Bajo `sm` la fila de encabezados no existe —ni en pantalla ni
                  para el lector—, así que la fecha nombra aquí de qué es. */}
              <span className="sm:hidden">Solicitud: </span>
              {formatRequestDate(teacher.createdAt)}
            </TableCell>

            <TableCell role="cell" className="max-sm:block max-sm:px-0 max-sm:pb-0">
              <div className="flex flex-wrap gap-2 max-sm:flex-col sm:justify-end">
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
