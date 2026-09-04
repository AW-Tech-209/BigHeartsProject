import type { AulaImpartida } from '@academia/types';
import { CalendarCheck } from 'lucide-react';

import { describirFechaCompacta } from '@/features/aulas/lib/horario';
import { FilaHistorial } from './fila-historial';

type TablaHistorialProfesorProps = {
  items: AulaImpartida[];
  total: number;
};

/** El historial del profesor (HU-404, AC2): clase, fecha, inscritos y asistentes. */
export function TablaHistorialProfesor({ items, total }: TablaHistorialProfesorProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <p className="border-b border-border px-4 py-3 text-base text-muted-foreground sm:px-5">
        {total === 1 ? '1 aula encontrada.' : `${total} aulas encontradas.`}
      </p>

      <ul aria-label="Historial de aulas impartidas">
        {items.map((item) => (
          <FilaHistorial
            key={item.id}
            aulaId={item.id}
            icon={CalendarCheck}
            titulo={item.title}
            subtitulo={describirFechaCompacta(item.scheduledAt)}
          >
            <div className="text-right text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground tabular-nums">
                  {item.totalAsistieron}
                </span>{' '}
                asistieron
              </p>
              <p>
                de{' '}
                <span className="font-medium text-foreground tabular-nums">
                  {item.totalInscritos}
                </span>{' '}
                inscritos
              </p>
            </div>
          </FilaHistorial>
        ))}
      </ul>
    </div>
  );
}
