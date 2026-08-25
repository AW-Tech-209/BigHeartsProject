import {
  BookingStatus,
  type ClassroomDetail,
  coincideConLaPreferencia,
  derivarEstadoAula,
  UserRole,
} from '@academia/types';
import { BookOpen, CalendarClock, ExternalLink, RotateCw, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { EstadoAula } from '@/components/dominio/estado-aula';
import { varianteEstadoAula } from '@/components/dominio/estado-aula-variantes';
import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { IndicadorCupo } from '@/components/dominio/indicador-cupo';
import { ModoComunicacionBadge } from '@/components/dominio/modo-comunicacion-badge';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { AccionesDeAula } from '@/features/aulas/components/acciones-de-aula';
import { esAulaNoEncontrada, useClassroom } from '@/features/aulas/hooks/use-classroom';
import { APOYOS_AULA } from '@/features/aulas/lib/apoyos-aula';
import { describirDuracion, describirHorario } from '@/features/aulas/lib/horario';
import { nivelesDeIngles } from '@/features/aulas/lib/niveles';
import { etiquetaPlataformaReunion } from '@/features/aulas/lib/plataforma-reunion';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { cn } from '@/lib/utils';

/**
 * El detalle de un aula (HU-204): la pantalla a la que lleva cada tarjeta, y de
 * la que colgarán el botón de reservar (HU-301) y la ventana de acceso al
 * enlace (HU-303).
 *
 * La ven los tres roles. **Lo que cambia según quién mira no es el acceso a la
 * pantalla sino qué trae la respuesta**: el `meetingLink` viaja solo a quien el
 * servidor decide (§4.1), y aquí se pinta si llegó. Esta página no comprueba
 * ningún permiso para eso, a propósito: replicar la regla en el cliente la
 * convertiría en apariencia.
 *
 * Un aula cancelada **se abre y muestra su estado** en vez de responder 404
 * (AC4): quien llega con el enlace guardado tiene que poder entender qué pasó.
 */
export function AulaDetallePage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch, isRefetching } = useClassroom(id);

  const aula = data?.classroom;
  const noEncontrada = isError && esAulaNoEncontrada(error);

  /*
    Un `<h1>` distinto por estado, y nunca vacío. `<PaginaCabecera>` mueve el
    foco al título cada vez que cambia, así que quien navega con lector de
    pantalla oye primero «Cargando la clase…» y después el nombre real —que es
    justo el aviso que una SPA no da por su cuenta—. Poner el título del aula
    antes de tenerlo obligaría a inventárselo.
  */
  const titulo = aula
    ? aula.title
    : isPending
      ? 'Cargando la clase…'
      : noEncontrada
        ? 'No encontramos esta clase'
        : 'No pudimos cargar esta clase';

  return (
    <AppShell>
      <PaginaCabecera titulo={titulo} contexto={aula ? describirLaClase(aula) : undefined} />

      {/*
        Estado 1 — cargando. Con texto, nunca un esqueleto mudo: aquí el texto
        es **el propio `<h1>`**, que dice «Cargando la clase…» y recibe el foco.

        Por eso no lleva la región `role="status"` con texto `sr-only` que sí
        llevan `/aulas` y `/mis-aulas`: allí el `<h1>` es fijo y sin ella la
        carga sería muda; aquí sonaría dos veces seguidas, que para quien navega
        con lector es ruido, no información.
      */}
      {isPending && <Skeleton className="h-64" aria-hidden="true" />}

      {/*
        Estado 2 — no encontrada (AC3). Con salida hacia el catálogo, nunca una
        pantalla en blanco: el usuario tiene que poder seguir desde aquí sin
        usar el botón de volver del navegador.
      */}
      {noEncontrada && (
        <EstadoVacio
          ilustracion="no-encontrado"
          titular="Esta clase ya no está"
          ayuda="Puede que la dirección esté mal escrita o que el aula se haya eliminado. Mira las clases publicadas para encontrar otra."
          accion={
            <Button render={<Link to="/aulas" />} className="h-12 px-6 text-base">
              Ver las aulas publicadas
            </Button>
          }
        />
      )}

      {/* Estado 3 — error de lectura, que sí se puede reintentar. */}
      {isError && !noEncontrada && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar esta clase">
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
              {isRefetching ? 'Cargando la clase…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {/* Estado 4 — el aula. */}
      {aula && (
        <DetalleDelAula
          aula={aula}
          esDueno={user?.id === aula.teacherId}
          preferenciaEstudiante={
            user?.role === UserRole.STUDENT ? user.communicationPreference : undefined
          }
        />
      )}
    </AppShell>
  );
}

/** La línea de contexto de la cabecera: quién la da y de qué nivel es (AC1). */
function describirLaClase(aula: ClassroomDetail): string {
  const nivel = nivelesDeIngles[aula.level].nombre.toLocaleLowerCase('es');
  return `Clase de nivel ${nivel} con ${aula.teacherFirstName} ${aula.teacherLastName}.`;
}

type DetalleDelAulaProps = {
  aula: ClassroomDetail;
  esDueno: boolean;
  /** `undefined` si quien mira no es estudiante o no declaró preferencia. */
  preferenciaEstudiante?: ClassroomDetail['communicationModes'][number] | null;
};

function DetalleDelAula({ aula, esDueno, preferenciaEstudiante }: DetalleDelAulaProps) {
  // El estado sale SIEMPRE de la función compartida de `@academia/types`
  // (AC6, §7.3). En el Sprint 2 `myBookingStatus` llega en `null`, así que
  // `reservada` y `acceso-abierto` no son alcanzables todavía; la comparación se
  // escribe igual para que HU-301 solo tenga que empezar a rellenar el campo.
  const estado = derivarEstadoAula({
    classroom: aula,
    ahora: new Date(),
    tieneReservaConfirmada: aula.myBookingStatus === BookingStatus.CONFIRMED,
  });

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)]">
        <div className="space-y-6">
          <section
            aria-labelledby="aula-descripcion"
            className="rounded-xl border border-border bg-card p-6 sm:p-7"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary-soft p-2 text-primary">
                  <BookOpen aria-hidden="true" strokeWidth={2} className="size-5" />
                </span>
                <h2 id="aula-descripcion" className="text-xl font-medium">
                  De qué trata la clase
                </h2>
              </div>
              <p className="max-w-[65ch] text-base leading-relaxed whitespace-pre-line">
                {aula.description}
              </p>
            </div>
          </section>

          <section
            aria-labelledby="aula-accesibilidad"
            className="rounded-xl border border-border bg-card p-6 sm:p-7"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-primary-soft p-2 text-primary">
                  <Users aria-hidden="true" strokeWidth={2} className="size-5" />
                </span>
                <div>
                  <h2 id="aula-accesibilidad" className="text-xl font-medium">
                    Cómo se imparte
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Comunicación y apoyos disponibles para seguir la clase.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {aula.communicationModes.length === 0 ? (
                  <ModoComunicacionBadge modo={null} />
                ) : (
                  aula.communicationModes.map((modo) => (
                    <ModoComunicacionBadge key={modo} modo={modo} />
                  ))
                )}
                {coincideConLaPreferencia(aula, preferenciaEstudiante) && (
                  <Badge tono="primary" icon={UserCheck}>
                    Coincide con tu preferencia
                  </Badge>
                )}
              </div>

              {(aula.hasInterpreter || aula.hasLiveCaptions || aula.hasVisualMaterials) && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {APOYOS_AULA.filter(({ clave }) => aula[clave]).map(
                    ({ clave, etiqueta, icon: Icon }) => (
                      <li
                        key={clave}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-base text-foreground"
                      >
                        <Icon
                          aria-hidden="true"
                          strokeWidth={2}
                          className="size-4 shrink-0 text-primary"
                        />
                        {etiqueta}
                      </li>
                    ),
                  )}
                </ul>
              )}

              <p className="border-t border-border pt-4 text-sm text-muted-foreground">
                Plataforma: {etiquetaPlataformaReunion[aula.meetingProvider]}
              </p>
            </div>
          </section>
        </div>

        <aside className="space-y-6" aria-label="Resumen de la clase">
          <section className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pl-7">
            <span
              aria-hidden="true"
              className={cn('absolute inset-y-0 left-0 w-1', varianteEstadoAula[estado].riel)}
            />
            <div className="space-y-5">
              <EstadoAula
                estado={estado}
                cuposRestantes={Math.max(aula.maxStudents - aula.currentBookings, 0)}
              />

              <dl className="divide-y divide-border">
                <Dato termino="Fecha y hora" icon={CalendarClock}>
                  {describirHorario(aula.scheduledAt)}
                </Dato>
                <Dato termino="Duración">{describirDuracion(aula.durationMinutes)}</Dato>
                <Dato termino="Cupo" className="pt-4">
                  <IndicadorCupo
                    variante={esDueno ? 'inscritos' : 'cupos'}
                    maxStudents={aula.maxStudents}
                    currentBookings={aula.currentBookings}
                    className="flex"
                  />
                </Dato>
              </dl>
            </div>
          </section>

          {aula.meetingLink && <EnlaceDeLaClase url={aula.meetingLink} />}

          <AccionesDeAula aula={aula} esDueno={esDueno} />
        </aside>
      </div>
    </div>
  );
}

/** Una fila de la ficha: el término y su valor. */
function Dato({
  termino,
  children,
  className,
  icon: Icon,
}: {
  termino: string;
  children: ReactNode;
  className?: string;
  icon?: typeof CalendarClock;
}) {
  return (
    <div
      className={cn(
        'space-y-1 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0',
        className,
      )}
    >
      <dt className="flex items-center gap-2 text-[13px] text-muted-foreground">
        {Icon && <Icon aria-hidden="true" strokeWidth={2} className="size-4" />}
        {termino}
      </dt>
      <dd className="text-base text-foreground">{children}</dd>
    </div>
  );
}

/**
 * El enlace de la videollamada, cuando el servidor lo reveló.
 *
 * Se muestra la URL completa y no solo un botón: el profesor la copia para
 * pegarla donde la necesite, y esconderla detrás de un «Abrir» le obligaría a
 * abrir la reunión para poder verla.
 */
function EnlaceDeLaClase({ url }: { url: string }) {
  return (
    <section
      aria-labelledby="aula-enlace"
      className="space-y-4 rounded-xl border-2 border-primary bg-primary-soft p-5"
    >
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-primary p-2 text-primary-foreground">
          <ExternalLink aria-hidden="true" strokeWidth={2} className="size-5" />
        </span>
        <div>
          <h2 id="aula-enlace" className="text-xl font-medium">
            Entra a la clase
          </h2>
          <p className="text-sm text-primary-soft-foreground">
            Solo tú lo ves. Los estudiantes con cupo podrán entrar 30 minutos antes.
          </p>
        </div>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex min-h-14 max-w-full flex-col justify-center gap-1 rounded-lg border border-primary bg-background px-4 py-3 text-base text-primary shadow-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-center gap-2 font-medium underline underline-offset-4">
          <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
          Entrar a la clase
        </span>
        <span className="break-all text-sm text-muted-foreground">{url}</span>
        {/* Que se abra en otra pestaña se avisa, no se descubre. */}
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    </section>
  );
}
