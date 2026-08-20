import type { ListClassroomsQuery } from '@academia/types';
import { RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { TarjetaAula } from '@/components/dominio/tarjeta-aula';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { RejillaAulas } from '@/components/layout/rejilla-aulas';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { FiltrosAulas } from '@/features/aulas/components/filtros-aulas';
import { useClassrooms } from '@/features/aulas/hooks/use-classrooms';
import {
  buildSearchParams,
  hayFiltrosActivos,
  parseListClassroomsQuery,
} from '@/features/aulas/lib/filtros-url';
import { useAnnounce } from '@/hooks/use-announce';

/** Cuántas tarjetas fantasma se pintan mientras carga (una fila completa en escritorio). */
const TARJETAS_FANTASMA = 6;

/**
 * Listado de aulas disponibles (HU-203): la primera pantalla que un
 * estudiante sordo usa de verdad. Los filtros y la página viven en la URL
 * (AC4): copiar el enlace y abrirlo en otra pestaña reproduce la misma vista.
 */
export function AulasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseListClassroomsQuery(searchParams);
  const { data, isPending, isError, refetch, isRefetching } = useClassrooms(query);
  const announce = useAnnounce();

  // AC9: cada resultado nuevo se anuncia por región viva. Solo se dispara
  // cuando `data` cambia de verdad (React Query mantiene la misma referencia
  // entre renders si el contenido no cambió), nunca en cada pintado.
  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce(
        hayFiltrosActivos(query)
          ? 'No se encontraron aulas con esos filtros.'
          : 'Todavía no hay aulas publicadas.',
      );
      return;
    }

    announce(`Se encontraron ${data.total} aula${data.total === 1 ? '' : 's'}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `query` decide SOLO el texto del caso "0 resultados"; incluirlo dispararía el anuncio en cada tecla de un filtro, antes de que llegue la respuesta nueva.
  }, [data, announce]);

  function actualizarFiltros(siguiente: ListClassroomsQuery) {
    setSearchParams(buildSearchParams(siguiente));
  }

  function irAPagina(pagina: number) {
    setSearchParams(buildSearchParams({ ...query, page: pagina }));
  }

  const paginaActual = query.page ?? 1;
  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Aulas"
        contexto="Las clases publicadas por los profesores de BigHearts, con su horario y su cupo."
      />

      <FiltrosAulas value={query} onChange={actualizarFiltros} />

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo (B5). */}
      {isPending && (
        <div role="status">
          <span className="sr-only">Cargando aulas disponibles…</span>
          <RejillaAulas aria-hidden="true">
            {Array.from({ length: TARJETAS_FANTASMA }, (_, indice) => (
              <Skeleton key={indice} className="h-32" />
            ))}
          </RejillaAulas>
        </div>
      )}

      {/* Estado 2 — error de lectura. */}
      {isError && (
        <Callout variant="destructive" live="assertive" title="No pudimos cargar las aulas">
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
              {isRefetching ? 'Cargando aulas disponibles…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {/* Estado 3 — vacío. Dos textos distintos según haya filtros o no (AC8). */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <>
          {hayFiltrosActivos(query) ? (
            <EstadoVacio
              titular="No hay aulas con esos filtros"
              ayuda="Prueba con otro nivel u otra fecha."
              accion={
                <Button variant="outline" onClick={() => actualizarFiltros({})}>
                  Quitar filtros
                </Button>
              }
            />
          ) : (
            <EstadoVacio
              titular="Todavía no hay aulas publicadas"
              ayuda="Cuando un profesor publique una clase, aparecerá aquí con su horario, su nivel y los cupos que queden."
            />
          )}
        </>
      )}

      {/* Estado 4 — la lista. */}
      {!isPending && !isError && data && data.items.length > 0 && (
        <>
          <RejillaAulas>
            {data.items.map((item) => (
              <TarjetaAula key={item.id} classroom={item} />
            ))}
          </RejillaAulas>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación de aulas"
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
