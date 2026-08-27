import { EstadoTemporalAula, type MisReservasQuery } from '@academia/types';
import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { TarjetaAula } from '@/components/dominio/tarjeta-aula';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { RejillaAulas } from '@/components/layout/rejilla-aulas';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { FiltroEstadoAulas } from '@/features/aulas/components/filtro-estado-aulas';
import { useMisReservas } from '@/features/aulas/hooks/use-mis-reservas';
import {
  buildMisAulasSearchParams,
  estadoActivo,
  parseMisAulasQuery,
} from '@/features/aulas/lib/filtros-mis-aulas';
import { useAnnounce } from '@/hooks/use-announce';

/** Cuántas tarjetas fantasma se pintan mientras carga (una fila completa en escritorio). */
const TARJETAS_FANTASMA = 6;

/**
 * Las clases que el estudiante tiene reservadas (HU-302).
 *
 * Es la contraparte de «Mis aulas» del profesor (HU-207) y copia su forma,
 * incluido el filtro temporal disjunto D24: el filtro y la página viven en la
 * URL, y el alcance lo decide el servidor a partir del token, nunca un
 * parámetro.
 *
 * La tarjeta se reutiliza en `perspectiva="catalogo"` con `puedeReservarla={false}`:
 * es la misma ficha que el catálogo, sin el botón de reservar — cancelar
 * (HU-303) y entrar a la clase (HU-304) son acciones de otra HU.
 */
export function MisClasesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query: MisReservasQuery = parseMisAulasQuery(searchParams);
  const { data, isPending, isError, refetch, isRefetching } = useMisReservas(query);
  const announce = useAnnounce();

  const hayFiltro = estadoActivo(query) !== EstadoTemporalAula.TODAS;
  const hayLista = Boolean(data && data.items.length > 0);

  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce(
        hayFiltro ? 'No tienes clases en este estado.' : 'Todavía no tienes clases reservadas.',
      );
      return;
    }

    announce(`Se encontraron ${data.total} clase${data.total === 1 ? '' : 's'}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `hayFiltro` decide SOLO el texto del caso "0 resultados"; incluirlo dispararía el anuncio al cambiar de filtro, antes de que llegue la respuesta nueva.
  }, [data, announce]);

  function actualizarFiltro(siguiente: MisReservasQuery) {
    setSearchParams(buildMisAulasSearchParams(siguiente));
  }

  function irAPagina(pagina: number) {
    setSearchParams(buildMisAulasSearchParams({ ...query, page: pagina }));
  }

  const paginaActual = query.page ?? 1;
  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  const explorarElCatalogo = (
    <Button render={<Link to="/aulas" />} className="h-12 px-6 text-base">
      Explorar las aulas
    </Button>
  );

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Mis clases"
        contexto="Las clases que reservaste, con la hora en que se abre el acceso a cada una."
      />

      <FiltroEstadoAulas value={query} onChange={actualizarFiltro} />

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo. */}
      {isPending && (
        <div role="status">
          <span className="sr-only">Cargando tus clases…</span>
          <RejillaAulas aria-hidden="true">
            {Array.from({ length: TARJETAS_FANTASMA }, (_, indice) => (
              <Skeleton key={indice} className="h-32" />
            ))}
          </RejillaAulas>
        </div>
      )}

      {/* Estado 2 — error de lectura. */}
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

      {/*
        Estado 3 — vacío, con dos textos distintos (AC5). Sin filtro significa
        que el estudiante no reservó nunca y la salida es ir al catálogo; con
        filtro significa que no tiene clases EN ESE ESTADO, y la salida es
        quitar el filtro, no reservar otra vez.
      */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <>
          {hayFiltro ? (
            <EstadoVacio
              titular="No tienes clases en este estado"
              ayuda="Prueba con otro estado para ver el resto de tus reservas."
              accion={
                <Button
                  variant="outline"
                  onClick={() => actualizarFiltro({ estado: EstadoTemporalAula.TODAS })}
                >
                  Ver todas mis clases
                </Button>
              }
            />
          ) : (
            <EstadoVacio
              titular="Todavía no tienes clases reservadas"
              ayuda="Cuando reserves tu cupo en un aula, la verás aquí con su fecha y su enlace de acceso."
              accion={explorarElCatalogo}
            />
          )}
        </>
      )}

      {/* Estado 4 — la lista. */}
      {!isPending && !isError && hayLista && data && (
        <>
          <h2 className="sr-only">Tus clases</h2>

          <RejillaAulas>
            {data.items.map((aula) => (
              <TarjetaAula key={aula.id} classroom={aula} perspectiva="catalogo" />
            ))}
          </RejillaAulas>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación de mis clases"
              className="flex items-center justify-center gap-4"
            >
              <Button
                variant="outline"
                disabled={paginaActual <= 1}
                onClick={() => irAPagina(paginaActual - 1)}
              >
                Anterior
              </Button>
              <p className="text-sm text-muted-foreground">
                Página {paginaActual} de {totalPaginas}
              </p>
              <Button
                variant="outline"
                disabled={paginaActual >= totalPaginas}
                onClick={() => irAPagina(paginaActual + 1)}
              >
                Siguiente
              </Button>
            </nav>
          )}
        </>
      )}
    </AppShell>
  );
}
