import {
  type Classroom,
  type ClassroomListItem,
  derivarEstadoAula,
  type EstadoAula as EstadoAulaTipo,
} from '@academia/types';
import { Link } from 'react-router-dom';

import { describirDuracion, describirHorario } from '@/features/aulas/lib/horario';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { cn } from '@/lib/utils';
import { EstadoAula } from './estado-aula';
import { varianteEstadoAula } from './estado-aula-variantes';
import { IndicadorCupo } from './indicador-cupo';

/**
 * El aula que pinta la tarjeta.
 *
 * El nombre del profesor es **opcional** porque no siempre viaja: el catálogo
 * (`ClassroomListItem`) lo trae para decir quién da la clase, y «Mis aulas»
 * (`MisAulasResponse`) no, porque el profesor es quien pregunta.
 */
export type AulaDeTarjeta = Classroom &
  Partial<Pick<ClassroomListItem, 'teacherFirstName' | 'teacherLastName'>>;

/**
 * Desde dónde se mira el aula. No es una variante estética: cambia **qué
 * pregunta responde la tarjeta**.
 *
 * - `catalogo` — la del estudiante: ¿me da tiempo a reservar? → cupo restante.
 * - `profesor` — la de «Mis aulas»: ¿cuánta gente viene? → inscritos sobre cupo.
 */
export type PerspectivaTarjeta = 'catalogo' | 'profesor';

type TarjetaAulaProps = {
  classroom: AulaDeTarjeta;
  perspectiva?: PerspectivaTarjeta;
  /** El reloj contra el que se deriva el estado. Por defecto, ahora mismo. */
  ahora?: Date;
  className?: string;
};

/**
 * Los tres estados que **son** una lectura del cupo. En la perspectiva del
 * profesor se omite su badge, porque `<IndicadorCupo variante="inscritos">` ya
 * dice lo mismo con los números que a él le sirven: «Quedan 2 cupos» y «8 de 10
 * inscritos» en la misma tarjeta serían dos formas de contar lo mismo, y el
 * AC8 de HU-207 pide explícitamente la segunda y no la primera.
 *
 * Los estados de ciclo de vida —cancelada, finalizada, en curso— sí conservan
 * su badge: no salen del cupo y no hay nada más que los diga.
 */
const ESTADOS_DE_CUPO: readonly EstadoAulaTipo[] = ['disponible', 'ultimos-cupos', 'llena'];

/**
 * La tarjeta de un aula (`layout-y-composicion.md`, anatomía de tarjeta). Lleva
 * el riel de 4px — la firma visual del producto — y es escaneable con visión
 * periférica sin leer una palabra.
 *
 * El estado se calcula aquí llamando a `derivarEstadoAula()` de
 * `@academia/types` (B3): esta tarjeta no reimplementa esa lógica, solo la
 * consume y la pinta con `<EstadoAula>`. **El riel siempre lleva el estado
 * derivado**, en las dos perspectivas.
 */
export function TarjetaAula({
  classroom,
  perspectiva = 'catalogo',
  ahora = new Date(),
  className,
}: TarjetaAulaProps) {
  const estado = derivarEstadoAula({ classroom, ahora });
  const cuposRestantes = Math.max(classroom.maxStudents - classroom.currentBookings, 0);
  const variante = varianteEstadoAula[estado];
  const tituloId = `aula-${classroom.id}-titulo`;

  const esVistaDelProfesor = perspectiva === 'profesor';
  const nombreDelProfesor =
    classroom.teacherFirstName && classroom.teacherLastName
      ? `${classroom.teacherFirstName} ${classroom.teacherLastName}`
      : undefined;

  // En «Mis aulas» el nombre del dueño es el del propio lector: en su sitio va
  // la duración, que es lo que le falta para saber si la clase le cabe.
  const lineaSecundaria = [
    esVistaDelProfesor ? undefined : nombreDelProfesor,
    nivelesDeIngles[classroom.level].nombre,
    esVistaDelProfesor ? describirDuracion(classroom.durationMinutes) : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  const muestraBadge = !esVistaDelProfesor || !ESTADOS_DE_CUPO.includes(estado);

  return (
    <article
      aria-labelledby={tituloId}
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card p-4 pl-5',
        // El anillo va en la TARJETA aunque el foco lo reciba el enlace del
        // título (`patrones-dominio.md`): un anillo de 3px alrededor de tres
        // palabras se pierde en una rejilla de seis, y lo que el usuario
        // necesita saber es qué tarjeta tiene el foco, no qué texto.
        'focus-within:ring-2 focus-within:ring-ring',
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

        {/*
          **El enlace al detalle es el título, no la tarjeta entera** (HU-204,
          B6). El `<article>` ya toma su nombre accesible del `<h3>` por
          `aria-labelledby`: envolverlo todo en un `<a>` haría que un lector de
          pantalla anunciara el nombre del aula dos veces y metiera la fecha, el
          estado y el cupo dentro del texto del enlace.

          Es un `<a>` de navegación, nunca un `<div onClick>`: así funciona el
          Tab, el Enter, «abrir en otra pestaña» y el menú contextual sin que
          haya que reimplementar ninguno.
        */}
        <h3 id={tituloId} className="text-base font-medium text-foreground">
          <Link
            to={`/aulas/${classroom.id}`}
            className="rounded-sm underline-offset-4 outline-none hover:underline"
          >
            {classroom.title}
          </Link>
        </h3>

        <p className="text-[13px] text-muted-foreground">{lineaSecundaria}</p>

        {muestraBadge && (
          <EstadoAula estado={estado} cuposRestantes={cuposRestantes} className="mt-1" />
        )}

        {esVistaDelProfesor && (
          <IndicadorCupo
            variante="inscritos"
            maxStudents={classroom.maxStudents}
            currentBookings={classroom.currentBookings}
            className="mt-1 flex"
          />
        )}
      </div>
    </article>
  );
}
