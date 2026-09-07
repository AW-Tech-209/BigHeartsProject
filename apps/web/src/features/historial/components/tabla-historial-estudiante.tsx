import type { ClassroomListItem } from '@academia/types';

import { FilaLista } from '@/components/dominio/fila-lista';
import { describirFechaCompacta } from '@/features/aulas/lib/horario';
import { AccionFilaHistorial } from './accion-fila-historial';
import { BadgeResultadoHistorial, resultadoHistorial } from './badge-resultado-historial';

type TablaHistorialEstudianteProps = {
  items: ClassroomListItem[];
  total: number;
};

/** El historial del estudiante (HU-404, AC1): clase, fecha, profesor y resultado. */
export function TablaHistorialEstudiante({ items, total }: TablaHistorialEstudianteProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <p className="border-b border-border px-4 py-3 text-base text-muted-foreground sm:px-5">
        {total === 1 ? '1 clase encontrada.' : `${total} clases encontradas.`}
      </p>

      <ul aria-label="Historial de clases" className="subir-suave">
        {items.map((item) => (
          <FilaLista
            key={item.id}
            aulaId={item.id}
            icon={resultadoHistorial(item.myBookingStatus).icon}
            tono={resultadoHistorial(item.myBookingStatus).tono}
            titulo={item.title}
            subtitulo={`${describirFechaCompacta(item.scheduledAt)} · ${item.teacherFirstName} ${item.teacherLastName}`}
          >
            <BadgeResultadoHistorial estado={item.myBookingStatus} />
            <AccionFilaHistorial aulaId={item.id} />
          </FilaLista>
        ))}
      </ul>
    </div>
  );
}
