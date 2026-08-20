import { type ClassroomListItem, derivarEstadoAula } from '@academia/types';

import { describirHorario } from '@/features/aulas/lib/horario';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { cn } from '@/lib/utils';
import { EstadoAula } from './estado-aula';
import { varianteEstadoAula } from './estado-aula-variantes';

type TarjetaAulaProps = {
  classroom: ClassroomListItem;
  /** El reloj contra el que se deriva el estado. Por defecto, ahora mismo. */
  ahora?: Date;
  className?: string;
};

/**
 * La tarjeta de un aula en el catálogo (`layout-y-composicion.md`, anatomía
 * de tarjeta). Lleva el riel de 4px — la firma visual del producto — y es
 * escaneable con visión periférica sin leer una palabra.
 *
 * El estado se calcula aquí llamando a `derivarEstadoAula()` de
 * `@academia/types` (B3): esta tarjeta no reimplementa esa lógica, solo la
 * consume y la pinta con `<EstadoAula>`.
 */
export function TarjetaAula({ classroom, ahora = new Date(), className }: TarjetaAulaProps) {
  const estado = derivarEstadoAula({ classroom, ahora });
  const cuposRestantes = Math.max(classroom.maxStudents - classroom.currentBookings, 0);
  const variante = varianteEstadoAula[estado];
  const tituloId = `aula-${classroom.id}-titulo`;

  return (
    <article
      aria-labelledby={tituloId}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5',
        className,
      )}
    >
      <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', variante.riel)} />

      <div className="space-y-1.5">
        {/*
          La fecha va ANTES del título en el DOM a propósito: quien navega con
          lector de pantalla se entera de CUÁNDO es la clase antes de CÓMO se
          llama, que es el orden en que decide un estudiante. Fecha completa y
          con zona explícita (B6): el nombre accesible de la tarjeta sigue
          siendo el título, no la fecha (aria-labelledby apunta al h3).
        */}
        <p className="text-xs text-muted-foreground">{describirHorario(classroom.scheduledAt)}</p>

        <h3 id={tituloId} className="text-base font-medium text-foreground">
          {classroom.title}
        </h3>

        <p className="text-[13px] text-muted-foreground">
          {classroom.teacherFirstName} {classroom.teacherLastName} ·{' '}
          {nivelesDeIngles[classroom.level].nombre}
        </p>

        <EstadoAula estado={estado} cuposRestantes={cuposRestantes} className="mt-1" />
      </div>
    </article>
  );
}
