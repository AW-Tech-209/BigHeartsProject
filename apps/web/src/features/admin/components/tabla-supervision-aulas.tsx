import type { ClassroomListItem } from '@academia/types';

import { FilaAulaSupervision } from './fila-aula-supervision';

type TablaSupervisionAulasProps = {
  items: ClassroomListItem[];
  total: number;
  ahora?: Date;
};

/**
 * La supervisión completa, en filas (HU-210 T9/AC7): fila y no tarjeta, porque
 * aquí se escanea para administrar, no para elegir. Mismo patrón «Fila» que el
 * historial (`<FilaLista>`) — dejó de ser `<table>`—: cada fila enlaza al
 * detalle del aula.
 */
export function TablaSupervisionAulas({ items, total, ahora }: TablaSupervisionAulasProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-xs">
      <p className="border-b border-border px-4 py-3 text-base text-muted-foreground sm:px-5">
        {total === 1 ? '1 aula encontrada.' : `${total} aulas encontradas.`}
      </p>

      <ul aria-label="Aulas de la academia" className="subir-suave">
        {items.map((classroom) => (
          <FilaAulaSupervision key={classroom.id} classroom={classroom} ahora={ahora} />
        ))}
      </ul>
    </div>
  );
}
