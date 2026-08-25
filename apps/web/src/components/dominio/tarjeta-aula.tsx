import {
  type Classroom,
  type ClassroomListItem,
  coincideConLaPreferencia,
  type CommunicationPreference,
  derivarEstadoAula,
  type EstadoAula as EstadoAulaTipo,
} from '@academia/types';
import { Presentation, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { AccionesDeAula } from '@/features/aulas/components/acciones-de-aula';
import { AccionReservarAula } from '@/features/aulas/components/accion-reservar-aula';
import { APOYOS_AULA } from '@/features/aulas/lib/apoyos-aula';
import { describirDuracion, describirHorario } from '@/features/aulas/lib/horario';
import { MODOS_COMUNICACION_EN_ORDEN } from '@/features/aulas/lib/modos-comunicacion';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { cn } from '@/lib/utils';
import { EstadoAula } from './estado-aula';
import { varianteEstadoAula } from './estado-aula-variantes';
import { IndicadorCupo } from './indicador-cupo';
import { ModoComunicacionBadge } from './modo-comunicacion-badge';

/**
 * Los modos declarados, en el orden CANÓNICO del enum — no el de inserción.
 * Así, todas las tarjetas muestran las etiquetas en la misma secuencia aunque
 * el servidor reciba los valores en otro orden.
 */
function modosEnOrden(modos: CommunicationPreference[]): CommunicationPreference[] {
  return MODOS_COMUNICACION_EN_ORDEN.filter((modo) => modos.includes(modo));
}

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
  /**
   * La preferencia de comunicación de quien mira (T12). Se pasa como prop y
   * no se lee con `useAuth()` aquí dentro: mismo criterio que `ahora`, la
   * tarjeta se mantiene pura y testeable sin montar el store de sesión.
   * `undefined`/`null` (sin preferencia declarada) nunca produce una marca.
   */
  preferenciaEstudiante?: CommunicationPreference | null;
  /**
   * `true` si el aula la imparte quien está mirando (HU-208, T1).
   *
   * Prop y no `useAuth()` aquí dentro, por el mismo motivo que `ahora` y
   * `preferenciaEstudiante`: la tarjeta se mantiene pura y testeable sin montar
   * el store de sesión. Quien la monta compara `classroom.teacherId` con el
   * usuario de la sesión.
   *
   * **No es un permiso.** Marca de quién es la clase para que el profesor
   * distinga lo suyo en un catálogo que sigue siendo único; lo que puede
   * hacerse con ella lo decide el servidor en `PATCH` y `cancel` (§4.8).
   */
  esMia?: boolean;
  /**
   * Si a quien mira se le puede ofrecer reservar (HU-208, T3). Llega ya
   * resuelto por `puedeReservar()`: la tarjeta no conoce roles.
   */
  puedeReservarla?: boolean;
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
  preferenciaEstudiante,
  esMia = false,
  puedeReservarla = false,
  className,
}: TarjetaAulaProps) {
  const estado = derivarEstadoAula({ classroom, ahora });
  const cuposRestantes = Math.max(classroom.maxStudents - classroom.currentBookings, 0);
  const variante = varianteEstadoAula[estado];
  const tituloId = `aula-${classroom.id}-titulo`;

  const esVistaDelProfesor = perspectiva === 'profesor';
  const sinModosDeclarados = classroom.communicationModes.length === 0;
  // AC4: solo marca las que coinciden, nunca las que no — sin marca negativa.
  const coincideConLaMia = coincideConLaPreferencia(classroom, preferenciaEstudiante);
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

  // HU-208: la marca solo tiene sentido en el catálogo, donde conviven aulas
  // propias y ajenas. En «Mis aulas» TODAS son suyas: marcarlas una por una no
  // distinguiría nada y sería el ruido que la propia pantalla ya evita al no
  // repetir el nombre del profesor en cada tarjeta.
  const marcaDePropiedad = esMia && !esVistaDelProfesor;

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
        <h3 id={tituloId} className="relative z-10 text-base font-medium text-foreground">
          <Link
            to={`/aulas/${classroom.id}`}
            className="after:absolute after:inset-0 after:z-0 after:rounded-xl after:content-[''] rounded-sm underline-offset-4 outline-none hover:underline"
          >
            {classroom.title}
          </Link>
        </h3>

        <p className="text-[13px] text-muted-foreground">{lineaSecundaria}</p>

        {/*
          AC2: el distintivo va **junto** al estado, nunca en su lugar. Una
          clase propia con últimos cupos tiene que decir las dos cosas: de quién
          es y cómo va de sitio. Por eso comparten fila en vez de competir por
          el mismo hueco.

          Tono `primary` porque el diccionario de color reserva ese token para
          «lo tuyo», y `suave` por la regla del sólido: el color pleno es solo
          de `acceso-abierto` y `en-curso`, los dos estados que piden actuar
          ahora mismo. Con ícono y texto propios (`Presentation`, `Tu clase`),
          que es la codificación triple obligatoria — la marca se distingue con
          el color apagado y en alto contraste.
        */}
        {(muestraBadge || marcaDePropiedad) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {muestraBadge && <EstadoAula estado={estado} cuposRestantes={cuposRestantes} />}
            {marcaDePropiedad && (
              <Badge tono="primary" icon={Presentation}>
                Tu clase
              </Badge>
            )}
          </div>
        )}

        {/*
          T10: todos los modos declarados, siempre visibles en las dos
          perspectivas. T12: la marca de coincidencia solo aparece del lado
          del estudiante, y solo cuando SÍ coincide (AC4, nunca marca negativa).
        */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {classroom.communicationModes.length === 0 ? (
            <ModoComunicacionBadge modo={null} />
          ) : (
            modosEnOrden(classroom.communicationModes).map((modo) => (
              <ModoComunicacionBadge key={modo} modo={modo} />
            ))
          )}
          {!esVistaDelProfesor && coincideConLaMia && (
            <Badge tono="primary" icon={UserCheck}>
              Coincide con tu preferencia
            </Badge>
          )}
        </div>

        {APOYOS_AULA.some(({ clave }) => classroom[clave]) && (
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Apoyos disponibles">
            {APOYOS_AULA.filter(({ clave }) => classroom[clave]).map(
              ({ clave, etiqueta, icon: Icon }) => (
                <Badge key={clave} tono="neutral" icon={Icon}>
                  {etiqueta}
                </Badge>
              ),
            )}
          </div>
        )}

        {esVistaDelProfesor && (
          <IndicadorCupo
            variante="inscritos"
            maxStudents={classroom.maxStudents}
            currentBookings={classroom.currentBookings}
            className="mt-1 flex"
          />
        )}

        {/*
            HU-208, T2/AC3. Sobre la clase propia el catálogo ofrece **otra
            promesa**, no la del estudiante: gestionarla, no reservarla. Mismo
            destino que el título —`/aulas/:id`— y a propósito: para el dueño ese
            detalle YA es su vista de gestión (le revela el enlace de la
            videollamada, HU-204).
        */}
        {marcaDePropiedad && (
          <Link
            to={`/aulas/${classroom.id}`}
            className="relative z-10 mt-1 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            Gestionar mi clase
          </Link>
        )}

        {/*
          HU-208, T3/AC4. El hueco de `Reservar mi cupo` (HU-301). Devuelve
          `null` hoy para todos los roles, pero la regla de quién lo vería ya
          está puesta y verificada: `puedeReservar()` fuera, y aquí el `&&
          !esMia` que impide ofrecérselo a nadie sobre su propia clase.
        */}
        {!esVistaDelProfesor && (
          <AccionReservarAula aula={classroom} puedeReservar={puedeReservarla && !esMia} />
        )}

        {/* T15: la vía para que un aula «sin indicar» deje de estarlo. */}
        {esVistaDelProfesor && sinModosDeclarados && (
          <Link
            to={`/mis-aulas/${classroom.id}/accesibilidad`}
            className="relative z-10 mt-1 inline-block text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            Completar accesibilidad
          </Link>
        )}

        {esVistaDelProfesor && <AccionesDeAula aula={classroom} esDueno compact />}
      </div>
    </article>
  );
}
