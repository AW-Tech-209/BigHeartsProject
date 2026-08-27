import { BookingStatus, type CommunicationPreference, type InscritoAula } from '@academia/types';
import { CircleCheck, CircleHelp, CircleX, RotateCw, Users } from 'lucide-react';

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
import { useInscritosAula } from '@/features/aulas/hooks/use-inscritos-aula';
import {
  etiquetaModoComunicacion,
  iconoModoComunicacion,
  MODOS_COMUNICACION_EN_ORDEN,
} from '@/features/aulas/lib/modos-comunicacion';
import { hearingLossLevelLabels } from '@/features/auth/lib/accessibility-labels';

type InscritosAulaProps = {
  classroomId: string;
  /** Solo el dueño ve esta sección; para el resto, el componente no pinta nada. */
  esDueno: boolean;
};

/**
 * Quién reservó la clase, con su perfil de accesibilidad (HU-305). Es
 * pedagógica, no administrativa: el profesor prepara la sesión sabiendo cómo
 * se comunica cada estudiante, no solo cuántos son.
 */
export function InscritosAula({ classroomId, esDueno }: InscritosAulaProps) {
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...data.confirmados, ...data.cancelados].map((inscrito, indice) => (
                <FilaInscrito key={indice} inscrito={inscrito} />
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

function FilaInscrito({ inscrito }: { inscrito: InscritoAula }) {
  return (
    <TableRow>
      <TableHead scope="row" className="font-normal text-foreground">
        {inscrito.firstName} {inscrito.lastName}
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
        {inscrito.bookingStatus === BookingStatus.CONFIRMED ? (
          <Badge tono="success" icon={CircleCheck}>
            Confirmada
          </Badge>
        ) : (
          <Badge tono="destructive" icon={CircleX}>
            Cancelada
          </Badge>
        )}
      </TableCell>
    </TableRow>
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
