import {
  type AttendanceStatus,
  BookingStatus,
  type CommunicationPreference,
  type InscritoAula,
} from '@academia/types';
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  CircleX,
  RotateCw,
  Users,
} from 'lucide-react';
import { useId, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAnnounce } from '@/hooks/use-announce';
import { useInscritosAula } from '@/features/aulas/hooks/use-inscritos-aula';
import { useMarkAttendance } from '@/features/aulas/hooks/use-mark-attendance';
import { describirHorario } from '@/features/aulas/lib/horario';
import { mensajeErrorAsistencia } from '@/features/aulas/lib/mensaje-error-asistencia';
import {
  etiquetaModoComunicacion,
  iconoModoComunicacion,
  MODOS_COMUNICACION_EN_ORDEN,
} from '@/features/aulas/lib/modos-comunicacion';
import { hearingLossLevelLabels } from '@/features/auth/lib/accessibility-labels';
import { cn } from '@/lib/utils';

type InscritosAulaProps = {
  classroomId: string;
  /** Solo el dueño ve esta sección; para el resto, el componente no pinta nada. */
  esDueno: boolean;
  /** Desde que la clase termina se puede marcar asistencia, sin límite (HU-403, D33). */
  claseTerminada: boolean;
  /** Instante en que termina la clase, ISO 8601 (`scheduledAt + durationMinutes`). */
  finDeClaseISO: string;
};

/**
 * Quién reservó la clase, con su perfil de accesibilidad (HU-305), y desde
 * HU-403 el control para marcar asistencia. Es pedagógica, no administrativa:
 * el profesor prepara la sesión sabiendo cómo se comunica cada estudiante, no
 * solo cuántos son.
 */
export function InscritosAula({
  classroomId,
  esDueno,
  claseTerminada,
  finDeClaseISO,
}: InscritosAulaProps) {
  const { data, isPending, isError, refetch, isRefetching } = useInscritosAula(classroomId, {
    enabled: esDueno,
  });

  if (!esDueno) {
    return null;
  }

  return (
    <section
      aria-labelledby="aula-inscritos"
      className="space-y-5 rounded-xl border border-border bg-card p-6 sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-primary-soft p-2 text-primary">
          <Users aria-hidden="true" strokeWidth={2} className="size-5" />
        </span>
        <div>
          <h2 id="aula-inscritos" className="text-xl font-medium">
            Quién viene a la clase
          </h2>
          <p className="text-sm text-muted-foreground">
            Cómo se comunica cada estudiante inscrito.
          </p>
        </div>
      </div>

      {isPending && <Skeleton className="h-32" aria-hidden="true" />}

      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar los inscritos">
          <div className="space-y-4">
            <p>Revisa tu conexión e inténtalo otra vez.</p>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="h-11 gap-2 px-5 text-base"
            >
              <RotateCw
                aria-hidden="true"
                strokeWidth={2}
                className={isRefetching ? 'size-5 animate-spin' : 'size-5'}
              />
              {isRefetching ? 'Cargando…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {data && data.confirmados.length === 0 && data.cancelados.length === 0 && (
        <EstadoVacio
          ilustracion="vacio"
          titular="Aún no hay inscritos"
          ayuda="Cuando alguien reserve un cupo, aparecerá aquí con su perfil de accesibilidad."
        />
      )}

      {data && (data.confirmados.length > 0 || data.cancelados.length > 0) && (
        <>
          <ResumenAccesibilidad inscritos={data.confirmados} />

          {!claseTerminada && (
            <Callout title="Aún no puedes marcar asistencia">
              <p>Podrás hacerlo cuando la clase termine, el {describirHorario(finDeClaseISO)}.</p>
            </Callout>
          )}

          <Table>
            <TableCaption>
              {data.confirmados.length === 1
                ? '1 inscrito con cupo confirmado.'
                : `${data.confirmados.length} inscritos con cupo confirmado.`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Reserva</TableHead>
                {claseTerminada && <TableHead>Asistencia</TableHead>}
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...data.confirmados, ...data.cancelados].map((inscrito) => (
                <FilaInscrito
                  key={inscrito.bookingId}
                  inscrito={inscrito}
                  classroomId={classroomId}
                  claseTerminada={claseTerminada}
                />
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </section>
  );
}

/** Cuántos inscritos confirmados hay por cada modo de comunicación (T6). */
function ResumenAccesibilidad({ inscritos }: { inscritos: InscritoAula[] }) {
  if (inscritos.length === 0) return null;

  const porModo = MODOS_COMUNICACION_EN_ORDEN.map((modo) => ({
    modo,
    cantidad: inscritos.filter((inscrito) => inscrito.communicationPreference === modo).length,
  })).filter(({ cantidad }) => cantidad > 0);
  const sinDeclarar = inscritos.filter(
    (inscrito) => inscrito.communicationPreference === null,
  ).length;

  return (
    <ul aria-label="Resumen de accesibilidad del grupo" className="flex flex-wrap gap-2">
      {porModo.map(({ modo, cantidad }) => (
        <li key={modo}>
          <Badge tono="neutral" icon={iconoModoComunicacion[modo]}>
            {cantidad} {etiquetaModoComunicacion[modo].toLocaleLowerCase('es')}
          </Badge>
        </li>
      ))}
      {sinDeclarar > 0 && (
        <li>
          <Badge tono="neutral" icon={CircleHelp}>
            {sinDeclarar} sin preferencia declarada
          </Badge>
        </li>
      )}
    </ul>
  );
}

/**
 * Una fila por inscrito. El modo de comunicación y la pérdida auditiva ya no
 * son columnas propias —apretaban la fila dentro del detalle del aula—: viven
 * tras «Ver detalle», que despliega una segunda fila con esos dos datos, igual
 * que el «+N» del renglón de aula. El resumen del grupo, arriba, sigue a la
 * vista: es lo que el profesor mira antes de preparar (HU-305 T6).
 */
function FilaInscrito({
  inscrito,
  classroomId,
  claseTerminada,
}: {
  inscrito: InscritoAula;
  classroomId: string;
  claseTerminada: boolean;
}) {
  const nombre = `${inscrito.firstName} ${inscrito.lastName}`;
  const [abierto, setAbierto] = useState(false);
  const detalleId = useId();
  const columnas = claseTerminada ? 4 : 3;

  return (
    <>
      <TableRow className={abierto ? 'border-b-0 hover:bg-transparent' : undefined}>
        <TableHead scope="row" className="font-normal text-foreground">
          {nombre}
        </TableHead>
        <TableCell>
          <BadgeDeReserva estado={inscrito.bookingStatus} />
        </TableCell>
        {claseTerminada && (
          <TableCell>
            {inscrito.bookingStatus === BookingStatus.CANCELLED ? (
              <span className="text-sm text-muted-foreground">No aplica</span>
            ) : (
              <ControlAsistencia
                classroomId={classroomId}
                bookingId={inscrito.bookingId}
                nombre={nombre}
                estadoActual={inscrito.bookingStatus}
              />
            )}
          </TableCell>
        )}
        <TableCell className="text-right">
          <button
            type="button"
            aria-expanded={abierto}
            aria-controls={detalleId}
            aria-label={abierto ? `Ocultar el detalle de ${nombre}` : `Ver el detalle de ${nombre}`}
            onClick={() => setAbierto((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground transicion-rapida hover:bg-muted"
          >
            {abierto ? (
              <>
                <ChevronUp aria-hidden="true" strokeWidth={2} className="size-3.5" />
                Ver menos
              </>
            ) : (
              <>
                <ChevronDown aria-hidden="true" strokeWidth={2} className="size-3.5" />
                Ver detalle
              </>
            )}
          </button>
        </TableCell>
      </TableRow>

      {abierto && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnas} className="pt-0">
            <dl
              id={detalleId}
              className="aparece flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-3"
            >
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">Modo de comunicación</dt>
                <dd>
                  <ModoDelEstudiante modo={inscrito.communicationPreference} />
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm text-muted-foreground">Pérdida auditiva</dt>
                <dd className="text-foreground">
                  {inscrito.hearingLossLevel
                    ? hearingLossLevelLabels[inscrito.hearingLossLevel]
                    : 'Sin declarar'}
                </dd>
              </div>
            </dl>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function BadgeDeReserva({ estado }: { estado: BookingStatus }) {
  switch (estado) {
    case BookingStatus.CANCELLED:
      return (
        <Badge tono="destructive" icon={CircleX}>
          Cancelada
        </Badge>
      );
    case BookingStatus.ATTENDED:
      return (
        <Badge tono="success" icon={CircleCheck}>
          Asistió
        </Badge>
      );
    case BookingStatus.NO_SHOW:
      // Rojo para el profesor que marca, simétrico con el verde de «Asistió»
      // (HU-415). Ícono `CircleMinus`, no de alerta: es un dato, no un reproche
      // — y el historial del ESTUDIANTE sigue viendo «No asististe» en neutro.
      return (
        <Badge tono="destructive" icon={CircleMinus}>
          No asistió
        </Badge>
      );
    default:
      return (
        <Badge tono="success" icon={CircleCheck}>
          Confirmada
        </Badge>
      );
  }
}

/** Marcar / corregir asistencia (HU-403, T6). Guardado explícito: cada botón guarda al pulsarlo. */
function ControlAsistencia({
  classroomId,
  bookingId,
  nombre,
  estadoActual,
}: {
  classroomId: string;
  bookingId: string;
  nombre: string;
  estadoActual: BookingStatus;
}) {
  const mutation = useMarkAttendance(classroomId);
  const announce = useAnnounce();
  const [error, setError] = useState<string | null>(null);

  function marcar(status: AttendanceStatus) {
    if (estadoActual === status || mutation.isPending) return;

    setError(null);
    mutation.mutate(
      { bookingId, status },
      {
        onSuccess: () => {
          announce(
            `${nombre}: ${status === BookingStatus.ATTENDED ? 'marcado como asistió' : 'marcado como no asistió'}.`,
          );
        },
        onError: (err) => setError(mensajeErrorAsistencia(err)),
      },
    );
  }

  return (
    <div className="space-y-2">
      <div role="group" aria-label={`Asistencia de ${nombre}`} className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          aria-pressed={estadoActual === BookingStatus.ATTENDED}
          disabled={mutation.isPending}
          onClick={() => marcar(BookingStatus.ATTENDED)}
          className={cn(
            'h-11 gap-1.5 px-3.5 text-sm transition-colors',
            estadoActual === BookingStatus.ATTENDED
              ? 'border-success bg-success-soft font-medium text-success-soft-foreground shadow-xs hover:bg-success-soft'
              : 'text-muted-foreground',
          )}
        >
          <CircleCheck aria-hidden="true" strokeWidth={2} className="size-4" />
          Asistió
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-pressed={estadoActual === BookingStatus.NO_SHOW}
          disabled={mutation.isPending}
          onClick={() => marcar(BookingStatus.NO_SHOW)}
          className={cn(
            'h-11 gap-1.5 px-3.5 text-sm transition-colors',
            estadoActual === BookingStatus.NO_SHOW
              ? 'border-destructive bg-destructive-soft font-medium text-destructive-soft-foreground shadow-xs hover:bg-destructive-soft'
              : 'text-muted-foreground',
          )}
        >
          <CircleMinus aria-hidden="true" strokeWidth={2} className="size-4" />
          No asistió
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** El modo del ESTUDIANTE, no el del aula: la ausencia se llama distinto que `<ModoComunicacionBadge>`. */
function ModoDelEstudiante({ modo }: { modo: CommunicationPreference | null }) {
  if (!modo) {
    return (
      <Badge tono="neutral" icon={CircleHelp}>
        Sin declarar preferencia
      </Badge>
    );
  }

  return (
    <Badge tono="neutral" icon={iconoModoComunicacion[modo]}>
      {etiquetaModoComunicacion[modo]}
    </Badge>
  );
}
