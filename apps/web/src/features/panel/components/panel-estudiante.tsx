import { BookingStatus, derivarEstadoAula, EstadoTemporalAula } from '@academia/types';
import type { ClassroomListItem } from '@academia/types';
import { CalendarCheck, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EstadoAula } from '@/components/dominio/estado-aula';
import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { ModoComunicacionBadge } from '@/components/dominio/modo-comunicacion-badge';
import { RejillaAulas } from '@/components/layout/rejilla-aulas';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { AccionEntrarAClase } from '@/features/aulas/components/accion-entrar-a-clase';
import { useMisReservas } from '@/features/aulas/hooks/use-mis-reservas';
import { describirHorario } from '@/features/aulas/lib/horario';
import { MODOS_COMUNICACION_EN_ORDEN } from '@/features/aulas/lib/modos-comunicacion';

/** Cuántas clases próximas caben en el inicio (AC3): no duplica «Mis clases». */
const PROXIMAS_VISIBLES = 3;

/**
 * El inicio del estudiante: sus próximas clases reservadas.
 *
 * `GET /bookings/mias` con el filtro `proximas` ya excluye lo cancelado y lo
 * pasado (mismo criterio que `<PanelProfesor>`), así que solo se pide tres.
 * No se reutiliza `<TarjetaAula>` completa: en el panel no se reserva ni se
 * cancela (fuera de alcance), solo se entra a la clase o se navega a su
 * detalle o a «Mis clases».
 */
export function PanelEstudiante() {
  const { data, isPending, isError, refetch, isRefetching } = useMisReservas({
    estado: EstadoTemporalAula.PROXIMAS,
    pageSize: PROXIMAS_VISIBLES,
  });

  const proximas = data?.items ?? [];

  return (
    <section aria-labelledby="panel-estudiante" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2
          id="panel-estudiante"
          className="flex items-center gap-2 text-xl font-medium text-foreground"
        >
          <CalendarCheck aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
          Tus clases
        </h2>

        {proximas.length > 0 && (
          <Button
            render={<Link to="/mis-clases" />}
            variant="outline"
            className="h-11 px-5 text-base"
          >
            Ver todas mis clases
          </Button>
        )}
      </div>

      {isPending && (
        <div role="status">
          <span className="sr-only">Cargando tus clases…</span>
          <RejillaAulas aria-hidden="true">
            {Array.from({ length: PROXIMAS_VISIBLES }, (_, indice) => (
              <Skeleton key={indice} className="h-32" />
            ))}
          </RejillaAulas>
        </div>
      )}

      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar tus clases">
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
              {isRefetching ? 'Cargando tus clases…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {!isPending && !isError && proximas.length === 0 && (
        <EstadoVacio
          titular="No tienes clases reservadas"
          ayuda="En el catálogo están las clases de la academia, cada una con su horario, su nivel y los cupos que quedan."
          accion={
            <Button render={<Link to="/aulas" />} className="h-12 px-6 text-base">
              Explorar clases
            </Button>
          }
        />
      )}

      {!isPending && !isError && proximas.length > 0 && (
        <RejillaAulas>
          {proximas.map((aula) => (
            <TarjetaClaseProxima key={aula.id} aula={aula} />
          ))}
        </RejillaAulas>
      )}
    </section>
  );
}

/**
 * La ficha compacta de una clase en el panel: fecha, estado, modos de
 * comunicación y el acceso de HU-304. Sin reservar ni cancelar — esas
 * acciones viven en el detalle del aula y en «Mis clases» (fuera de alcance).
 */
function TarjetaClaseProxima({ aula }: { aula: ClassroomListItem }) {
  const estado = derivarEstadoAula({
    classroom: aula,
    ahora: new Date(),
    tieneReservaConfirmada: aula.myBookingStatus === BookingStatus.CONFIRMED,
  });
  const cuposRestantes = Math.max(aula.maxStudents - aula.currentBookings, 0);
  const tituloId = `panel-clase-${aula.id}-titulo`;
  const modos = MODOS_COMUNICACION_EN_ORDEN.filter((modo) =>
    aula.communicationModes.includes(modo),
  );

  return (
    <article
      aria-labelledby={tituloId}
      className="rounded-xl border border-border bg-card p-4 pl-5"
    >
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">{describirHorario(aula.scheduledAt)}</p>

        <h3 id={tituloId} className="text-base font-medium text-foreground">
          <Link
            to={`/aulas/${aula.id}`}
            className="rounded-sm underline-offset-4 outline-none hover:underline"
          >
            {aula.title}
          </Link>
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <EstadoAula estado={estado} cuposRestantes={cuposRestantes} />
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1" aria-label="Formas de comunicación">
          {modos.length === 0 ? (
            <ModoComunicacionBadge modo={null} className="px-2 py-0.5 text-xs" />
          ) : (
            modos.map((modo) => (
              <ModoComunicacionBadge key={modo} modo={modo} className="px-2 py-0.5 text-xs" />
            ))
          )}
        </div>

        <AccionEntrarAClase
          aula={{
            id: aula.id,
            accessState: aula.accessState ?? 'sin-acceso',
            accessOpensAt: aula.accessOpensAt ?? null,
          }}
        />
      </div>
    </article>
  );
}
