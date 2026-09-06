import { EstadoTemporalAula } from '@academia/types';
import { CalendarCheck, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { TarjetaAula } from '@/components/dominio/tarjeta-aula';
import { RejillaAulas } from '@/components/layout/rejilla-aulas';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { useMisAulas } from '@/features/aulas/hooks/use-mis-aulas';

/** Cuántas clases próximas caben en el inicio: una fila de la rejilla en escritorio. */
const PROXIMAS_VISIBLES = 3;

/**
 * El inicio del profesor: las clases que va a impartir.
 *
 * **De dónde sale el dato.** `GET /classrooms/mias` con el filtro `proximas`
 * (HU-207): ya viene acotado al token y ordenado con la más cercana primero, así
 * que aquí no hay nada que filtrar ni que ordenar — solo pedir tres.
 *
 * Hasta HU-207 esto leía el catálogo público y comparaba `teacherId` contra la
 * sesión **en el cliente**, con la limitación de que las clases del profesor
 * podían caer fuera de la página que devolvía el catálogo y el panel mostraba el
 * vacío teniéndolas. Eso ya no pasa, y **no es un patrón a replicar**: el
 * alcance de una lista lo decide el servidor (`ARQUITECTURA.md` §4.8, regla 3).
 */
export function PanelProfesor() {
  const { data, isPending, isError, refetch, isRefetching } = useMisAulas({
    estado: EstadoTemporalAula.PROXIMAS,
    pageSize: PROXIMAS_VISIBLES,
  });

  const proximas = data?.items ?? [];

  const crearUnaClase = (
    <Button render={<Link to="/mis-aulas/nueva" />} className="h-12 px-6 text-base">
      Crear una clase
    </Button>
  );

  return (
    <section aria-labelledby="panel-profesor" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2
          id="panel-profesor"
          className="flex items-center gap-3 text-xl font-medium text-foreground"
        >
          <span className="rounded-lg bg-primary-soft p-2 text-primary">
            <CalendarCheck aria-hidden="true" strokeWidth={2} className="size-5" />
          </span>
          Tus próximas clases
        </h2>

        {/*
          La acción primaria vive en UN solo sitio a la vez (AC7): en la cabecera
          de la sección cuando hay lista, y dentro del estado vacío cuando no la
          hay. Pintarla en los dos deja dos acciones primarias compitiendo, que
          es lo que prohíbe `layout-y-composicion.md`.
        */}
        {proximas.length > 0 && crearUnaClase}
      </div>

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo. */}
      {isPending && (
        <div role="status">
          <span className="sr-only">Cargando tus próximas clases…</span>
          <RejillaAulas aria-hidden="true">
            {Array.from({ length: PROXIMAS_VISIBLES }, (_, indice) => (
              <Skeleton key={indice} className="h-32" />
            ))}
          </RejillaAulas>
        </div>
      )}

      {/* Estado 2 — error de lectura. Explica y ofrece la salida. */}
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
              {isRefetching ? 'Cargando tus próximas clases…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {/* Estado 3 — vacío: la salida es publicar la primera clase. */}
      {!isPending && !isError && proximas.length === 0 && (
        <EstadoVacio
          titular="No tienes clases publicadas"
          ayuda="Publica una clase con su horario y su cupo para que tus estudiantes la encuentren en el catálogo."
          accion={crearUnaClase}
        />
      )}

      {/* Estado 4 — la lista. */}
      {!isPending && !isError && proximas.length > 0 && (
        <RejillaAulas className="subir-suave">
          {proximas.map((aula) => (
            // Misma perspectiva que «Mis aulas»: es el profesor mirando sus
            // propias clases, así que la tarjeta responde su pregunta —cuánta
            // gente viene— y no la del estudiante —cuánto queda—.
            <TarjetaAula key={aula.id} classroom={aula} perspectiva="profesor" />
          ))}
        </RejillaAulas>
      )}
    </section>
  );
}
