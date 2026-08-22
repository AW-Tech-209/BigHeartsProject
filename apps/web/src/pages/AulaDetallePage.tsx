import {
  BookingStatus,
  type ClassroomDetail,
  coincideConLaPreferencia,
  derivarEstadoAula,
  UserRole,
} from '@academia/types';
import { ExternalLink, RotateCw, UserCheck } from 'lucide-react';
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
      {/*
        El riel de 4px con el color del estado, igual que en la tarjeta: es la
        firma visual del producto y lo que permite reconocer de un vistazo, y
        sin leer, que esta clase está cancelada (`patrones-dominio.md`).
      */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pl-7">
        <span
          aria-hidden="true"
          className={cn('absolute inset-y-0 left-0 w-1', varianteEstadoAula[estado].riel)}
        />

        <div className="space-y-6">
          <EstadoAula
            estado={estado}
            cuposRestantes={Math.max(aula.maxStudents - aula.currentBookings, 0)}
          />

          <dl className="grid gap-6 sm:grid-cols-2">
            <Dato termino="Fecha y hora">{describirHorario(aula.scheduledAt)}</Dato>
            <Dato termino="Duración">{describirDuracion(aula.durationMinutes)}</Dato>
            <Dato termino="Cupo" className="sm:col-span-2">
              {/*
                Los mismos dos números, contados según quién pregunta
                (`patrones-dominio.md`): el dueño quiere saber cuánta gente
                viene; quien no lo es, si le queda sitio.
              */}
              <IndicadorCupo
                variante={esDueno ? 'inscritos' : 'cupos'}
                maxStudents={aula.maxStudents}
                currentBookings={aula.currentBookings}
                className="flex"
              />
            </Dato>
          </dl>
        </div>
      </div>

      <section aria-labelledby="aula-descripcion" className="space-y-2">
        <h2 id="aula-descripcion" className="text-xl font-medium">
          De qué trata la clase
        </h2>
        <p className="max-w-[65ch] text-base leading-relaxed whitespace-pre-line">
          {aula.description}
        </p>
      </section>

      {/*
        T11: el bloque completo de accesibilidad — todos los modos, no solo el
        principal de la tarjeta —, los apoyos activos y la plataforma. T12
        (extensión de bajo riesgo, AC4): la marca de coincidencia se repite
        aquí porque es donde el estudiante decide de verdad si reserva, no
        solo en el listado.
      */}
      <section aria-labelledby="aula-accesibilidad" className="space-y-3">
        <h2 id="aula-accesibilidad" className="text-xl font-medium">
          Cómo se imparte
        </h2>

        <div className="flex flex-wrap items-center gap-1.5">
          {aula.communicationModes.length === 0 ? (
            <ModoComunicacionBadge modo={null} />
          ) : (
            aula.communicationModes.map((modo) => <ModoComunicacionBadge key={modo} modo={modo} />)
          )}
          {coincideConLaPreferencia(aula, preferenciaEstudiante) && (
            <Badge tono="primary" icon={UserCheck}>
              Coincide con tu preferencia
            </Badge>
          )}
        </div>

        {(aula.hasInterpreter || aula.hasLiveCaptions || aula.hasVisualMaterials) && (
          <ul className="space-y-1.5">
            {APOYOS_AULA.filter(({ clave }) => aula[clave]).map(
              ({ clave, etiqueta, icon: Icon }) => (
                <li key={clave} className="flex items-center gap-2 text-base text-foreground">
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

        <p className="text-sm text-muted-foreground">
          Plataforma: {etiquetaPlataformaReunion[aula.meetingProvider]}
        </p>
      </section>

      {/*
        El enlace solo se pinta si el servidor lo mandó. En este sprint eso
        significa «quien mira es el profesor dueño y la clase no está
        cancelada»; HU-303 añade al estudiante con cupo dentro de la ventana de
        30 minutos, y entonces habrá que revisar el texto de ayuda de abajo,
        que hoy está escrito para el dueño. La condición NO se replica aquí:
        quien decide es §4.1, en el servidor.
      */}
      {aula.meetingLink && <EnlaceDeLaClase url={aula.meetingLink} />}

      <AccionesDeAula aula={aula} esDueno={esDueno} />
    </div>
  );
}

/** Una fila de la ficha: el término y su valor. */
function Dato({
  termino,
  children,
  className,
}: {
  termino: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <dt className="text-[13px] text-muted-foreground">{termino}</dt>
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
    <section aria-labelledby="aula-enlace" className="space-y-3">
      <h2 id="aula-enlace" className="text-xl font-medium">
        Enlace de la clase
      </h2>
      <p className="max-w-[65ch] text-base text-muted-foreground">
        Solo tú lo ves. Los estudiantes con cupo podrán entrar desde 30 minutos antes de que empiece
        la clase.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-full items-center gap-2 rounded-lg text-base break-all text-primary underline underline-offset-4 hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
        <span>{url}</span>
        {/* Que se abra en otra pestaña se avisa, no se descubre. */}
        <span className="sr-only">(se abre en otra pestaña)</span>
      </a>
    </section>
  );
}
