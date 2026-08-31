import {
  type AttendanceStatus,
  BookingStatus,
  type CommunicationPreference,
  type InscritoAula,
} from '@academia/types';
import { CircleCheck, CircleHelp, CircleMinus, CircleX, RotateCw, Users } from 'lucide-react';
import { useState } from 'react';

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
                <TableHead>Modo de comunicación</TableHead>
                <TableHead>Pérdida auditiva</TableHead>
                <TableHead>Reserva</TableHead>
                {claseTerminada && <TableHead>Asistencia</TableHead>}
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

  return (
    <TableRow>
      <TableHead scope="row" className="font-normal text-foreground">
        {nombre}
      </TableHead>
      <TableCell>
        <ModoDelEstudiante modo={inscrito.communicationPreference} />
      </TableCell>
      <TableCell className="text-foreground">
        {inscrito.hearingLossLevel
          ? hearingLossLevelLabels[inscrito.hearingLossLevel]
          : 'Sin declarar'}
      </TableCell>
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
    </TableRow>
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
      // Neutro y sin juicio (HU-403): nunca un ícono de alerta.
      return (
        <Badge tono="neutral" icon={CircleMinus}>
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
            'h-11 gap-1.5 px-3 text-sm',
            estadoActual === BookingStatus.ATTENDED &&
              'border-success bg-success-soft text-success-soft-foreground',
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
            'h-11 gap-1.5 px-3 text-sm',
            estadoActual === BookingStatus.NO_SHOW && 'border-foreground bg-muted text-foreground',
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
