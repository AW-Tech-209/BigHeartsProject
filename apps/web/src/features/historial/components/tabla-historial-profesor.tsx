import type { AulaImpartida } from '@academia/types';

import { FilaLista } from '@/components/dominio/fila-lista';
import { describirFechaCompacta } from '@/features/aulas/lib/horario';
import { AccionFilaHistorial } from './accion-fila-historial';
import { BadgeAsistenciaAula, estadoAsistenciaAula } from './badge-asistencia-aula';

type TablaHistorialProfesorProps = {
  items: AulaImpartida[];
  total: number;
};

/**
 * El historial del profesor (HU-404, AC2): clase, fecha, inscritos y asistentes,
 * más si todavía le falta marcar la asistencia (HU-403). Cada fila enlaza al
 * detalle del aula, que es donde se marca.
 */
export function TablaHistorialProfesor({ items, total }: TablaHistorialProfesorProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <p className="border-b border-border px-4 py-3 text-base text-muted-foreground sm:px-5">
        {total === 1 ? '1 aula encontrada.' : `${total} aulas encontradas.`}
      </p>

      <ul aria-label="Historial de clases impartidas" className="entra-escalonada">
        {items.map((item) => {
          const asistencia = estadoAsistenciaAula(item);
          return (
            <FilaLista
              key={item.id}
              aulaId={item.id}
              icon={asistencia.icon}
              tono={asistencia.tono}
              titulo={item.title}
              subtitulo={describirFechaCompacta(item.scheduledAt)}
            >
              {asistencia.completa && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {item.totalAsistieron} de {item.totalInscritos} asistieron
                </span>
              )}
              <BadgeAsistenciaAula aula={item} />
              <AccionFilaHistorial aulaId={item.id} marcarAsistencia={asistencia.pendiente} />
            </FilaLista>
          );
        })}
      </ul>
    </div>
  );
}
