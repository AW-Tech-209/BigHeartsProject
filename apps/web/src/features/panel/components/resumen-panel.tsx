import type {
  ResumenPanelAdmin,
  ResumenPanelEstudiante,
  ResumenPanelProfesor,
} from '@academia/types';
import { UserRole } from '@academia/types';
import {
  Activity,
  BookmarkCheck,
  CalendarClock,
  ClipboardList,
  MessagesSquare,
  RotateCw,
  UserCheck,
  Users,
} from 'lucide-react';

import { IndicadorCupo } from '@/components/dominio/indicador-cupo';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { AccionEntrarAClase } from '@/features/aulas/components/accion-entrar-a-clase';
import { describirHorario } from '@/features/aulas/lib/horario';
import {
  etiquetaModoComunicacion,
  MODOS_COMUNICACION_EN_ORDEN,
} from '@/features/aulas/lib/modos-comunicacion';

import { useResumenPanel } from '../hooks/use-resumen-panel';
import { tiempoRelativo } from '../lib/tiempo-relativo';
import { Numero, TarjetaResumen } from './tarjeta-resumen';

/**
 * La fila de tres tarjetas de «¿cómo voy?» encima del contenido de `/panel`
 * (HU-502). Se inserta, no sustituye: los bloques de HU-209/HU-309 siguen
 * debajo sin cambios.
 */
export function ResumenPanel() {
  const { data, isPending, isError, refetch, isRefetching } = useResumenPanel();

  return (
    <section aria-labelledby="resumen-panel-titulo" className="space-y-4">
      <h2 id="resumen-panel-titulo" className="text-xl font-medium text-foreground">
        Cómo va tu plataforma
      </h2>

      {isPending && (
        <div role="status">
          <span className="sr-only">Cargando el resumen…</span>
          <Rejilla aria-hidden="true">
            {Array.from({ length: 3 }, (_, indice) => (
              <Skeleton key={indice} className="h-32" />
            ))}
          </Rejilla>
        </div>
      )}

      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar el resumen">
          <div className="space-y-4">
            <p>
              Revisa tu conexión e inténtalo otra vez. El resto del panel sigue disponible debajo.
            </p>
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
              {isRefetching ? 'Cargando el resumen…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {data && (
        <Rejilla>
          {data.rol === UserRole.STUDENT && <TarjetasEstudiante data={data} />}
          {data.rol === UserRole.TEACHER && <TarjetasProfesor data={data} />}
          {data.rol === UserRole.ADMIN && <TarjetasAdmin data={data} />}
        </Rejilla>
      )}
    </section>
  );
}

function Rejilla({ children, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" {...props}>
      {children}
    </div>
  );
}

function TarjetasEstudiante({ data }: { data: ResumenPanelEstudiante }) {
  const { proximaClase, reservasActivas, clasesQueCoinciden, sinPreferencia } = data;

  return (
    <>
      <TarjetaResumen
        titulo="Tu próxima clase"
        icono={CalendarClock}
        enlace={
          proximaClase
            ? { texto: 'Ver la clase', a: `/aulas/${proximaClase.id}` }
            : { texto: 'Ver el catálogo', a: '/aulas' }
        }
      >
        {proximaClase ? (
          <>
            <p className="text-xs text-muted-foreground">
              {describirHorario(proximaClase.scheduledAt)}
            </p>
            <p className="text-base font-medium text-foreground">{proximaClase.title}</p>
            <p className="text-sm font-medium">{tiempoRelativo(proximaClase.scheduledAt)}</p>
            <AccionEntrarAClase
              aula={{
                id: proximaClase.id,
                accessState: proximaClase.accessState,
                accessOpensAt: proximaClase.accessOpensAt,
              }}
            />
          </>
        ) : (
          <p className="text-sm">No tienes ninguna clase reservada por venir.</p>
        )}
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Clases que coinciden contigo"
        icono={MessagesSquare}
        enlace={
          sinPreferencia
            ? { texto: 'Ir a mi perfil', a: '/perfil' }
            : { texto: 'Ver el catálogo', a: '/aulas' }
        }
      >
        {sinPreferencia ? (
          <p className="text-sm">
            Indica tu preferencia de comunicación y verás qué clases con cupo encajan contigo.
          </p>
        ) : (
          <>
            <Numero>{clasesQueCoinciden}</Numero>
            <p className="text-sm">
              {clasesQueCoinciden === 1
                ? 'clase con cupo coincide con tu preferencia'
                : 'clases con cupo coinciden con tu preferencia'}
            </p>
          </>
        )}
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Tus reservas activas"
        icono={BookmarkCheck}
        enlace={
          reservasActivas > 0
            ? { texto: 'Ver mis clases', a: '/mis-clases' }
            : { texto: 'Ver el catálogo', a: '/aulas' }
        }
      >
        {reservasActivas > 0 ? (
          <>
            <Numero>{reservasActivas}</Numero>
            <p className="text-sm">
              {reservasActivas === 1 ? 'clase próxima reservada' : 'clases próximas reservadas'}
            </p>
          </>
        ) : (
          <p className="text-sm">No tienes ninguna clase reservada.</p>
        )}
      </TarjetaResumen>
    </>
  );
}

function TarjetasProfesor({ data }: { data: ResumenPanelProfesor }) {
  const { proximaClase, asistenciaSinMarcar, comunicacionDelGrupo } = data;

  return (
    <>
      <TarjetaResumen
        titulo="Tu próxima clase"
        icono={CalendarClock}
        enlace={
          proximaClase
            ? { texto: 'Ver la lista de inscritos', a: `/aulas/${proximaClase.id}` }
            : { texto: 'Publicar una clase', a: '/mis-aulas/nueva' }
        }
      >
        {proximaClase ? (
          <>
            <p className="text-xs text-muted-foreground">
              {describirHorario(proximaClase.scheduledAt)}
            </p>
            <p className="text-base font-medium text-foreground">{proximaClase.title}</p>
            <IndicadorCupo
              variante="inscritos"
              maxStudents={proximaClase.maxStudents}
              currentBookings={proximaClase.currentBookings}
            />
          </>
        ) : (
          <p className="text-sm">No tienes ninguna clase programada.</p>
        )}
      </TarjetaResumen>

      <TarjetaResumen
        titulo="Asistencia sin marcar"
        icono={ClipboardList}
        tono={asistenciaSinMarcar > 0 ? 'attention' : 'success'}
        enlace={asistenciaSinMarcar > 0 ? { texto: 'Ir a mis aulas', a: '/mis-aulas' } : undefined}
      >
        {asistenciaSinMarcar > 0 ? (
          <>
            <Numero>{asistenciaSinMarcar}</Numero>
            <p className="text-sm">
              {asistenciaSinMarcar === 1
                ? 'clase terminada sin asistencia marcada'
                : 'clases terminadas sin asistencia marcada'}
            </p>
          </>
        ) : (
          <p className="text-sm">Nada pendiente de marcar.</p>
        )}
      </TarjetaResumen>

      <TarjetaResumen titulo="Cómo se comunica tu grupo" icono={MessagesSquare}>
        {comunicacionDelGrupo.total === 0 ? (
          <p className="text-sm">Aún no hay inscritos en tus próximas clases.</p>
        ) : (
          <ul className="space-y-0.5 text-sm">
            {MODOS_COMUNICACION_EN_ORDEN.filter((modo) => comunicacionDelGrupo.porModo[modo]).map(
              (modo) => (
                <li key={modo}>
                  {etiquetaModoComunicacion[modo]} · {comunicacionDelGrupo.porModo[modo]}
                </li>
              ),
            )}
            {comunicacionDelGrupo.sinIndicar > 0 && (
              <li>Sin indicar · {comunicacionDelGrupo.sinIndicar}</li>
            )}
          </ul>
        )}
      </TarjetaResumen>
    </>
  );
}

function TarjetasAdmin({ data }: { data: ResumenPanelAdmin }) {
  const {
    profesoresPendientes,
    clasesHoy,
    clasesEnCurso,
    cuposReservadosSemana,
    cuposOfrecidosSemana,
  } = data;

  return (
    <>
      <TarjetaResumen
        titulo="Profesores pendientes de aprobar"
        icono={UserCheck}
        tono={profesoresPendientes > 0 ? 'attention' : 'success'}
        enlace={
          profesoresPendientes > 0
            ? { texto: 'Revisar solicitudes', a: '#aprobaciones-pendientes' }
            : undefined
        }
      >
        {profesoresPendientes > 0 ? (
          <>
            <Numero>{profesoresPendientes}</Numero>
            <p className="text-sm">
              {profesoresPendientes === 1
                ? 'profesor espera tu aprobación'
                : 'profesores esperan tu aprobación'}
            </p>
          </>
        ) : (
          <p className="text-sm">No hay solicitudes pendientes.</p>
        )}
      </TarjetaResumen>

      <TarjetaResumen titulo="La operación de hoy" icono={Activity}>
        <p className="text-sm">
          <span className="text-2xl font-medium tabular-nums">{clasesHoy}</span>{' '}
          {clasesHoy === 1 ? 'clase programada hoy' : 'clases programadas hoy'}
        </p>
        <p className="text-sm">{clasesEnCurso} en curso ahora</p>
      </TarjetaResumen>

      <TarjetaResumen titulo="Ocupación de la semana" icono={Users}>
        {cuposOfrecidosSemana > 0 ? (
          <>
            <Numero>
              {cuposReservadosSemana} de {cuposOfrecidosSemana}
            </Numero>
            <p className="text-sm">cupos reservados en los próximos 7 días</p>
          </>
        ) : (
          <p className="text-sm">No hay clases con cupo esta semana.</p>
        )}
      </TarjetaResumen>
    </>
  );
}
