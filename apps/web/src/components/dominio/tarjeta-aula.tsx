import { useId, useState, type ReactNode } from 'react';
import {
  type AccessibilityPreference,
  BookingStatus,
  type Classroom,
  type ClassroomListItem,
  coincideConLaAccesibilidad,
  derivarEstadoAula,
  type EstadoAula as EstadoAulaTipo,
} from '@academia/types';
import {
  Accessibility,
  Ban,
  ChevronDown,
  ChevronUp,
  Presentation,
  Settings,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccionCancelarReserva } from '@/features/aulas/components/accion-cancelar-reserva';
import { useAccionEntrarAClase } from '@/features/aulas/components/accion-entrar-a-clase';
import { useAccionesDeAula } from '@/features/aulas/components/acciones-de-aula';
import { useAccionReservarAula } from '@/features/aulas/components/accion-reservar-aula';
import { apoyosEnOrden, etiquetaApoyo, iconoApoyo } from '@/features/aulas/lib/accesibilidad-aula';
import { describirDuracion, describirHorarioRenglon } from '@/features/aulas/lib/horario';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { cn } from '@/lib/utils';
import { EstadoAula } from './estado-aula';
import { varianteEstadoAula } from './estado-aula-variantes';
import { IndicadorCupo } from './indicador-cupo';
import { ModoInstruccion } from './modo-instruccion';

/**
 * El aula que pinta el renglón.
 *
 * El nombre del profesor es **opcional** porque no siempre viaja: el catálogo
 * (`ClassroomListItem`) lo trae para decir quién da la clase, y «Mis aulas»
 * (`MisAulasResponse`) no, porque el profesor es quien pregunta.
 */
export type AulaDeTarjeta = Classroom &
  Partial<
    Pick<
      ClassroomListItem,
      | 'teacherFirstName'
      | 'teacherLastName'
      | 'myBookingStatus'
      | 'myBookingId'
      | 'myBookingCancelable'
      | 'accessState'
      | 'accessOpensAt'
    >
  >;

/**
 * Desde dónde se mira el aula. No es una variante estética: cambia **qué
 * pregunta responde el renglón**.
 *
 * - `catalogo` — la del estudiante: ¿me da tiempo a reservar? → cupo restante.
 * - `profesor` — la de «Mis aulas»: ¿cuánta gente viene? → inscritos sobre cupo.
 */
export type PerspectivaTarjeta = 'catalogo' | 'profesor';

/**
 * Cuántos apoyos se ven antes de colapsar tras «+N». Es un TECHO: si en la fila
 * ya está `Tu clase`, el hueco real baja para que la fila no envuelva.
 */
const MAX_ETIQUETAS_VISIBLES_POR_DEFECTO = 2;

type TarjetaAulaProps = {
  classroom: AulaDeTarjeta;
  perspectiva?: PerspectivaTarjeta;
  /** El reloj contra el que se deriva el estado. Por defecto, ahora mismo. */
  ahora?: Date;
  /**
   * La preferencia de accesibilidad de quien mira (D44), ya traducida con
   * `preferenciaDelUsuario()`. Prop y no `useAuth()`, igual que `ahora`.
   * Sin modo de instrucción declarado nunca produce una marca.
   */
  preferenciaEstudiante?: AccessibilityPreference | null;
  /**
   * `true` si el aula la imparte quien está mirando (HU-208, T1). Prop y no
   * `useAuth()` por el mismo motivo que `ahora`. **No es un permiso.**
   */
  esMia?: boolean;
  /**
   * Si a quien mira se le puede ofrecer reservar (HU-208, T3). Llega ya
   * resuelto por `puedeReservar()`: el renglón no conoce roles.
   */
  puedeReservarla?: boolean;
  /**
   * Cuántos apoyos se ven antes de colapsar tras «+N». Tope FIJO, sin medición
   * del DOM. El modo de instrucción y el estado nunca colapsan.
   */
  maxEtiquetasVisibles?: number;
  className?: string;
};

/**
 * Los tres estados que **son** una lectura del cupo. En la perspectiva del
 * profesor se omite su badge, porque `<IndicadorCupo variante="inscritos">` ya
 * dice lo mismo con los números que a él le sirven (AC8 de HU-207). Los estados
 * de ciclo de vida —cancelada, finalizada, en curso— sí conservan su badge.
 */
const ESTADOS_DE_CUPO: readonly EstadoAulaTipo[] = ['disponible', 'ultimos-cupos', 'llena'];

type Etiqueta = { key: string; node: ReactNode };

/**
 * El renglón de un aula (`layout-y-composicion.md`, anatomía de tarjeta): una
 * fila horizontal a todo el ancho de alto modular, con el riel de 4px —la firma
 * visual del producto— y cuatro zonas de ancho fijo (cuándo · qué · cupo · qué
 * hago) que no cambian de orden entre estados ni roles.
 *
 * El estado se calcula aquí con `derivarEstadoAula()` de `@academia/types` (B3):
 * el renglón no reimplementa esa lógica, solo la consume. **El riel siempre
 * lleva el estado derivado**, en las dos perspectivas.
 */
export function TarjetaAula({
  classroom,
  perspectiva = 'catalogo',
  ahora = new Date(),
  preferenciaEstudiante,
  esMia = false,
  puedeReservarla = false,
  maxEtiquetasVisibles = MAX_ETIQUETAS_VISIBLES_POR_DEFECTO,
  className,
}: TarjetaAulaProps) {
  const [etiquetasAbiertas, setEtiquetasAbiertas] = useState(false);
  const bandaId = useId();
  const tituloId = `aula-${classroom.id}-titulo`;

  const estado = derivarEstadoAula({
    classroom,
    ahora,
    tieneReservaConfirmada: classroom.myBookingStatus === BookingStatus.CONFIRMED,
  });
  const cuposRestantes = Math.max(classroom.maxStudents - classroom.currentBookings, 0);
  const variante = varianteEstadoAula[estado];

  const esVistaDelProfesor = perspectiva === 'profesor';
  const miReservaCancelada =
    !esVistaDelProfesor && classroom.myBookingStatus === BookingStatus.CANCELLED;
  const sinModoDeclarado = !classroom.instructionMode;
  const coincideConLaMia =
    !esVistaDelProfesor && coincideConLaAccesibilidad(classroom, preferenciaEstudiante);
  const marcaDePropiedad = esMia && !esVistaDelProfesor;

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

  // Se omite el badge de estado solo cuando el profesor mira un estado que ya
  // dice el conteo de inscritos (AC8 de HU-207). Si la reserva del estudiante
  // está cancelada, el badge propio lo sustituye «Reserva cancelada».
  const muestraBadgeEstado =
    !miReservaCancelada && (!esVistaDelProfesor || !ESTADOS_DE_CUPO.includes(estado));
  const { dia, hora, zona } = describirHorarioRenglon(classroom.scheduledAt);

  // Solo los apoyos colapsan tras «+N». El modo de instrucción va en su propia
  // línea (HU-507): nunca comparte fila con ellos ni se esconde.
  const colapsables: Etiqueta[] = apoyosEnOrden(classroom.supports ?? []).map((apoyo) => ({
    key: `apoyo-${apoyo}`,
    node: (
      <li key={apoyo}>
        <Badge tono="neutral" icon={iconoApoyo[apoyo]} className="px-2 py-0.5 text-xs">
          {etiquetaApoyo[apoyo]}
        </Badge>
      </li>
    ),
  }));
  const badgesFijosExtra = marcaDePropiedad ? 1 : 0;
  const cupoColapsables = Math.max(Math.max(maxEtiquetasVisibles, 0) - badgesFijosExtra, 0);
  const visibles = colapsables.slice(0, cupoColapsables);
  const ocultas = colapsables.slice(cupoColapsables);
  const abierta = etiquetasAbiertas && ocultas.length > 0;

  const reservar = useAccionReservarAula({
    aula: classroom,
    puedeReservar: puedeReservarla && !esMia && !esVistaDelProfesor,
    estado,
  });
  const cancelar = useAccionCancelarReserva({
    aula: {
      id: classroom.id,
      title: classroom.title,
      scheduledAt: classroom.scheduledAt,
      myBookingId: classroom.myBookingId ?? null,
      myBookingStatus: esVistaDelProfesor ? null : (classroom.myBookingStatus ?? null),
      myBookingCancelable: classroom.myBookingCancelable ?? null,
    },
    compact: true,
  });
  const entrar = useAccionEntrarAClase({
    aula: {
      id: classroom.id,
      accessState: esVistaDelProfesor ? 'sin-acceso' : (classroom.accessState ?? 'sin-acceso'),
      accessOpensAt: classroom.accessOpensAt ?? null,
    },
    // El dueño entra a su propia clase mientras está en curso (D25: el enlace es
    // suyo sin ventana), igual que el estudiante con el acceso abierto.
    forzarEntrada: esVistaDelProfesor && estado === 'en-curso',
  });
  const gestion = useAccionesDeAula({ aula: classroom, esDueno: esVistaDelProfesor });

  const hayAvisos = Boolean(reservar.aviso || cancelar.aviso || entrar.aviso || gestion.aviso);

  return (
    <article
      aria-labelledby={tituloId}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 pl-5 shadow-xs',
        // El anillo va en el renglón aunque el foco lo reciba el enlace del
        // título: lo que el usuario necesita saber es qué renglón tiene el foco.
        'focus-within:ring-2 focus-within:ring-ring',
        'transicion-suave hover:border-input hover:bg-muted/50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1 transicion-suave',
          miReservaCancelada ? varianteEstadoAula.cancelada.riel : variante.riel,
        )}
      />

      <div className="flex flex-wrap items-start gap-4">
        {/*
          Zona 1 — cuándo. Va ANTES del título en el DOM a propósito: quien
          navega con lector de pantalla se entera de CUÁNDO es la clase antes de
          CÓMO se llama. La zona se nombra siempre (B6), en su propia línea.
        */}
        <div className="w-29 shrink-0 overflow-hidden border-r border-border pr-4">
          <p className="text-xs text-muted-foreground">{dia}</p>
          {hora && <p className="text-[17px] font-medium tabular-nums">{hora}</p>}
          {zona && (
            <p className="text-xs leading-tight text-pretty text-muted-foreground">({zona})</p>
          )}
        </div>

        {/* Zona 2 — qué. */}
        <div className="min-w-0 flex-1 space-y-1">
          {/*
            **El enlace al detalle es el título, no el renglón entero** (HU-204,
            B6). Es un `<a>` de navegación, nunca un `<div onClick>`.
          */}
          <h3
            id={tituloId}
            className="relative z-10 truncate text-base font-medium text-foreground"
          >
            <Link
              to={`/aulas/${classroom.id}`}
              className="after:absolute after:inset-0 after:z-0 after:rounded-xl after:content-[''] rounded-sm underline-offset-4 outline-none hover:underline"
            >
              {classroom.title}
            </Link>
          </h3>

          <p className="truncate text-[13px] text-muted-foreground">{lineaSecundaria}</p>

          <div className="relative z-10 flex flex-wrap items-center gap-1.5 pt-0.5">
            <ModoInstruccion modo={classroom.instructionMode} />
            {coincideConLaMia && (
              <Badge tono="primary" icon={UserCheck}>
                Coincide con tu preferencia
              </Badge>
            )}
          </div>

          {/* `whitespace-nowrap` es heredable: cada badge queda en una línea y
              es `flex-wrap` quien lo baja entero al siguiente renglón, nunca su
              texto el que crece en vertical. */}
          <div className="relative z-10 flex flex-wrap items-center gap-1.5 whitespace-nowrap">
            {miReservaCancelada && (
              <Badge tono="destructive" icon={Ban}>
                Reserva cancelada
              </Badge>
            )}
            {muestraBadgeEstado && <EstadoAula estado={estado} cuposRestantes={cuposRestantes} />}
            {marcaDePropiedad && (
              <Badge tono="primary" icon={Presentation}>
                Tu clase
              </Badge>
            )}
            {visibles.length > 0 && (
              <>
                <span aria-hidden="true" className="ml-1 text-xs text-muted-foreground">
                  Apoyos:
                </span>
                <ul aria-label="Apoyos de la clase" className="flex flex-wrap gap-1.5">
                  {visibles.map((etiqueta) => etiqueta.node)}
                </ul>
              </>
            )}
            {ocultas.length > 0 && (
              <button
                type="button"
                aria-expanded={abierta}
                aria-controls={bandaId}
                aria-label={
                  abierta
                    ? 'Ver menos apoyos'
                    : `Ver ${ocultas.length} ${ocultas.length === 1 ? 'apoyo' : 'apoyos'} más`
                }
                onClick={() => setEtiquetasAbiertas((v) => !v)}
                className="relative z-10 inline-flex items-center gap-1 rounded-full border border-input bg-card px-2.5 py-0.5 text-xs font-medium text-foreground transicion-rapida hover:bg-muted"
              >
                {abierta ? (
                  <>
                    <ChevronUp aria-hidden="true" strokeWidth={2} className="size-3.5" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown aria-hidden="true" strokeWidth={2} className="size-3.5" />
                    {`+${ocultas.length}`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Zona 3 — cupo. Solo el profesor: en el catálogo lo dice el badge.
            `self-center`: se centra en el alto de la fila igual que la zona de
            acción, en vez de colgar del borde superior. */}
        {esVistaDelProfesor && (
          <div className="w-44 shrink-0 self-center">
            <IndicadorCupo
              variante="inscritos"
              maxStudents={classroom.maxStudents}
              currentBookings={classroom.currentBookings}
              className="flex whitespace-nowrap"
            />
          </div>
        )}

        {/*
          Zona 4 — qué hago. `self-center`: los botones se centran en el alto de
          la fila en vez de colgar del borde superior cuando la zona «qué» es más
          alta por los badges.
        */}
        <div className="relative z-10 flex w-49 shrink-0 flex-col gap-2 self-center">
          {reservar.boton}
          {cancelar.boton}
          {entrar.boton}

          {/* HU-208, T2/AC3. Sobre la clase propia el catálogo ofrece gestionarla. */}
          {marcaDePropiedad && (
            <Button
              render={<Link to={`/aulas/${classroom.id}`} />}
              variant="outline"
              className="h-11 w-full gap-2 px-3.5"
            >
              <Settings aria-hidden="true" strokeWidth={2} className="size-4" />
              Gestionar mi clase
            </Button>
          )}

          {/* HU-507, T5: el dueño completa el modo desde el catálogo o desde «Mis aulas». */}
          {(esVistaDelProfesor || marcaDePropiedad) && sinModoDeclarado && (
            <Button
              render={<Link to={`/mis-aulas/${classroom.id}/accesibilidad`} />}
              variant="outline"
              className="h-11 w-full gap-2 px-3.5"
            >
              <Accessibility aria-hidden="true" strokeWidth={2} className="size-4" />
              Completar accesibilidad
            </Button>
          )}

          {gestion.boton}
        </div>
      </div>

      {abierta && (
        <div
          id={bandaId}
          className="aparece relative z-10 mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 whitespace-nowrap"
        >
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            También:
          </span>
          <ul aria-label="Más apoyos de la clase" className="flex flex-wrap gap-1.5">
            {ocultas.map((etiqueta) => etiqueta.node)}
          </ul>
        </div>
      )}

      {hayAvisos && (
        <div className="relative z-10 mt-3 space-y-2 border-t border-border pt-3">
          {reservar.aviso}
          {cancelar.aviso}
          {entrar.aviso}
          {gestion.aviso}
        </div>
      )}
    </article>
  );
}
