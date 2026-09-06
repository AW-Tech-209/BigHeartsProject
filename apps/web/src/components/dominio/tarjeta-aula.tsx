import { useId, useState, type ReactNode } from 'react';
import {
  BookingStatus,
  type Classroom,
  type ClassroomListItem,
  coincideConLaPreferencia,
  type CommunicationPreference,
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
import { APOYOS_AULA } from '@/features/aulas/lib/apoyos-aula';
import { describirDuracion, describirHorarioRenglon } from '@/features/aulas/lib/horario';
import { MODOS_COMUNICACION_EN_ORDEN } from '@/features/aulas/lib/modos-comunicacion';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { cn } from '@/lib/utils';
import { EstadoAula } from './estado-aula';
import { varianteEstadoAula } from './estado-aula-variantes';
import { IndicadorCupo } from './indicador-cupo';
import { ModoComunicacionBadge } from './modo-comunicacion-badge';

/**
 * Los modos declarados, en el orden CANÓNICO del enum — no el de inserción.
 * Así, todos los renglones muestran las etiquetas en la misma secuencia aunque
 * el servidor reciba los valores en otro orden.
 */
function modosEnOrden(modos: CommunicationPreference[]): CommunicationPreference[] {
  return MODOS_COMUNICACION_EN_ORDEN.filter((modo) => modos.includes(modo));
}

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
 * Cuántas etiquetas de modo/apoyo se ven antes de colapsar tras «+N». Es un
 * TECHO: si en la fila ya hay badges siempre visibles (`Tu clase`, `Coincide…`,
 * `Modo sin indicar`), el hueco real baja para que la fila no envuelva y el
 * renglón no crezca de alto.
 */
const MAX_ETIQUETAS_VISIBLES_POR_DEFECTO = 2;

type TarjetaAulaProps = {
  classroom: AulaDeTarjeta;
  perspectiva?: PerspectivaTarjeta;
  /** El reloj contra el que se deriva el estado. Por defecto, ahora mismo. */
  ahora?: Date;
  /**
   * La preferencia de comunicación de quien mira (T12). Se pasa como prop y
   * no se lee con `useAuth()` aquí dentro: mismo criterio que `ahora`, el
   * renglón se mantiene puro y testeable sin montar el store de sesión.
   * `undefined`/`null` (sin preferencia declarada) nunca produce una marca.
   */
  preferenciaEstudiante?: CommunicationPreference | null;
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
   * Cuántas etiquetas de modo/apoyo se ven antes de colapsar tras «+N». Tope
   * FIJO, sin medición del DOM. El estado, «Tu clase» y «Coincide con tu
   * preferencia» no cuentan y nunca colapsan.
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
  const sinModosDeclarados = classroom.communicationModes.length === 0;
  const coincideConLaMia = coincideConLaPreferencia(classroom, preferenciaEstudiante);
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

  // Modos y apoyos comparten una sola fila y colapsan tras «+N» cuando pasan del
  // tope. El estado, «Tu clase» y «Coincide…» van aparte y nunca colapsan.
  const colapsables: Etiqueta[] = [
    ...(sinModosDeclarados
      ? []
      : modosEnOrden(classroom.communicationModes).map((modo) => ({
          key: `modo-${modo}`,
          node: <ModoComunicacionBadge key={modo} modo={modo} className="px-2 py-0.5 text-xs" />,
        }))),
    ...APOYOS_AULA.filter(({ clave }) => classroom[clave]).map(
      ({ clave, etiqueta, icon: Icon }) => ({
        key: `apoyo-${clave}`,
        node: (
          <Badge key={clave} tono="neutral" icon={Icon} className="px-2 py-0.5 text-xs">
            {etiqueta}
          </Badge>
        ),
      }),
    ),
  ];
  // Cada badge siempre visible que no sea el estado se come un hueco de la fila:
  // se descuenta del techo para que «Tu clase» + «Coincide…» no empujen tres
  // etiquetas más a una segunda línea.
  const badgesFijosExtra =
    (marcaDePropiedad ? 1 : 0) +
    (!esVistaDelProfesor && coincideConLaMia ? 1 : 0) +
    (sinModosDeclarados ? 1 : 0);
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
        'transition-[border-color,box-shadow,background-color] duration-150 ease-suave',
        'hover:border-input hover:bg-muted/50',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1',
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
            {!esVistaDelProfesor && coincideConLaMia && (
              <Badge tono="primary" icon={UserCheck}>
                Coincide con tu preferencia
              </Badge>
            )}
            {sinModosDeclarados && (
              <ModoComunicacionBadge modo={null} className="px-2 py-0.5 text-xs" />
            )}
            {visibles.map((etiqueta) => etiqueta.node)}
            {ocultas.length > 0 && (
              <button
                type="button"
                aria-expanded={abierta}
                aria-controls={bandaId}
                aria-label={abierta ? 'Ver menos etiquetas' : `Ver ${ocultas.length} etiquetas más`}
                onClick={() => setEtiquetasAbiertas((v) => !v)}
                className="relative z-10 inline-flex items-center gap-1 rounded-full border border-input bg-card px-2.5 py-0.5 text-xs font-medium text-foreground hover:bg-muted"
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

        {/* Zona 3 — cupo. Solo el profesor: en el catálogo lo dice el badge. */}
        {esVistaDelProfesor && (
          <div className="w-44 shrink-0">
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

          {/* T15: la vía para que un aula «sin indicar» deje de estarlo. */}
          {esVistaDelProfesor && sinModosDeclarados && (
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
          className="relative z-10 mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3 whitespace-nowrap"
        >
          <span className="text-xs text-muted-foreground">También:</span>
          {ocultas.map((etiqueta) => etiqueta.node)}
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
