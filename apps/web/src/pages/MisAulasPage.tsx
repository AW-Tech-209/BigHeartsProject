import { EstadoTemporalAula, type MisAulasQuery } from '@academia/types';
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
import { useMisAulas } from '@/features/aulas/hooks/use-mis-aulas';
import {
  buildMisAulasSearchParams,
  estadoActivo,
  parseMisAulasQuery,
} from '@/features/aulas/lib/filtros-mis-aulas';
import { useAnnounce } from '@/hooks/use-announce';

/** Cuántas tarjetas fantasma se pintan mientras carga (una fila completa en escritorio). */
const TARJETAS_FANTASMA = 6;

/**
 * Las aulas que imparte el profesor (HU-207).
 *
 * **No es el catálogo con otro filtro.** `/aulas` es la vista pública —solo
 * publicadas y futuras, para que un estudiante descubra una clase—; esta es el
 * registro del dueño: incluye **las canceladas y las que ya pasaron**, porque
 * es también su historial (§4.8). El alcance lo decide el servidor a partir del
 * token: aquí no se filtra por `teacherId` en el cliente, ni se puede.
 *
 * El filtro y la página viven en la URL (AC6): copiar el enlace y abrirlo en
 * otra pestaña reproduce la misma vista.
 *
 * La acción primaria vive en UN solo sitio a la vez (AC10, decisión 4 de la
 * HU): en la cabecera cuando hay lista, y dentro del estado vacío cuando no la
 * hay. Pintarla en los dos deja dos acciones primarias compitiendo, que es lo
 * que prohíbe `layout-y-composicion.md`.
 */
export function MisAulasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseMisAulasQuery(searchParams);
  const { data, isPending, isError, refetch, isRefetching } = useMisAulas(query);
  const announce = useAnnounce();

  const hayFiltro = estadoActivo(query) !== EstadoTemporalAula.TODAS;
  const hayLista = Boolean(data && data.items.length > 0);

  // AC12: cada resultado nuevo se anuncia por región viva. Solo se dispara
  // cuando `data` cambia de verdad (React Query mantiene la misma referencia
  // entre renders si el contenido no cambió), nunca en cada pintado.
  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce(hayFiltro ? 'No tienes aulas en este estado.' : 'Todavía no creaste ninguna aula.');
      return;
    }

    announce(`Se encontraron ${data.total} aula${data.total === 1 ? '' : 's'}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `hayFiltro` decide SOLO el texto del caso "0 resultados"; incluirlo dispararía el anuncio al cambiar de filtro, antes de que llegue la respuesta nueva.
  }, [data, announce]);

  function actualizarFiltro(siguiente: MisAulasQuery) {
    setSearchParams(buildMisAulasSearchParams(siguiente));
  }

  function irAPagina(pagina: number) {
    setSearchParams(buildMisAulasSearchParams({ ...query, page: pagina }));
  }

  const paginaActual = query.page ?? 1;
  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  const crearUnaClase = (
    <Button render={<Link to="/mis-aulas/nueva" />} className="h-12 px-6 text-base">
      Crear una clase
    </Button>
  );

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Mis aulas"
        contexto="Las clases que impartes, con su horario, su cupo y los estudiantes inscritos."
        accion={hayLista ? crearUnaClase : undefined}
      />

      <FiltroEstadoAulas value={query} onChange={actualizarFiltro} />

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo (B6). */}
      {isPending && (
        <div role="status">
          <span className="sr-only">Cargando tus aulas…</span>
          <RejillaAulas aria-hidden="true">
            {Array.from({ length: TARJETAS_FANTASMA }, (_, indice) => (
              <Skeleton key={indice} className="h-32" />
            ))}
          </RejillaAulas>
        </div>
      )}

      {/* Estado 2 — error de lectura. */}
      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar tus aulas">
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
              {isRefetching ? 'Cargando tus aulas…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {/*
        Estado 3 — vacío, con dos textos distintos. Sin filtro significa que el
        profesor no ha publicado nada nunca y la salida es crear; con filtro
        significa que no tiene aulas EN ESE ESTADO, y la salida es quitar el
        filtro, no publicar otra clase.
      */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <>
          {hayFiltro ? (
            <EstadoVacio
              titular="No tienes aulas en este estado"
              ayuda="Prueba con otro estado para ver el resto de tus clases."
              accion={
                <Button
                  variant="outline"
                  onClick={() => actualizarFiltro({ estado: EstadoTemporalAula.TODAS })}
                >
                  Ver todas mis aulas
                </Button>
              }
            />
          ) : (
            <EstadoVacio
              titular="Todavía no creaste ninguna aula"
              ayuda="Publica tu primera clase con su horario y su cupo. Aquí verás quién reservó en cada una."
              accion={crearUnaClase}
            />
          )}
        </>
      )}

      {/* Estado 4 — la lista. */}
      {!isPending && !isError && hayLista && data && (
        <>
          {/*
            El encabezado de la rejilla existe para que el orden de niveles no
            salte del <h1> de la página al <h3> de la tarjeta —`axe` lo marca
            como `heading-order`, y quien navega por encabezados con lector de
            pantalla se queda sin el peldaño intermedio—. Va `sr-only` porque
            visualmente la cabecera ya dice qué es esta pantalla, y repetirlo
            sería ruido para quien la ve.
          */}
          <h2 className="sr-only">Tus aulas</h2>

          <RejillaAulas>
            {data.items.map((aula) => (
              // Las acciones de gestión NO van en la tarjeta (B4): multiplicarlas
              // por seis tarjetas rompe la regla de una acción primaria por
              // pantalla. Viven en el detalle del aula, que trae HU-204 — y es
              // esa HU la que convierte cada tarjeta en un enlace a su detalle.
              <TarjetaAula key={aula.id} classroom={aula} perspectiva="profesor" />
            ))}
          </RejillaAulas>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación de mis aulas"
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
