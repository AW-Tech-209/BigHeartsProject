import type { AdminClassroomsQuery } from '@academia/types';
import { LoaderCircle, RotateCw } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { FiltrosSupervision } from '@/features/admin/components/filtros-supervision';
import { TablaSupervisionAulas } from '@/features/admin/components/tabla-supervision-aulas';
import { useAdminClassrooms } from '@/features/admin/hooks/use-admin-classrooms';
import {
  buildAdminClassroomsSearchParams,
  hayFiltrosActivos,
  parseAdminClassroomsQuery,
} from '@/features/admin/lib/filtros-supervision';
import { useAnnounce } from '@/hooks/use-announce';

/**
 * Supervisión de aulas para el administrador (HU-210, D20 de
 * `ARQUITECTURA.md` §4.8).
 *
 * **No es el catálogo con otro filtro.** `/aulas` solo enseña `PUBLISHED` y
 * futuras, para que un estudiante descubra una clase; esta pantalla enseña
 * **todas**: canceladas, pasadas, de cualquier profesor. Solo lectura
 * (decisión 4): no hay ninguna acción de editar ni cancelar sobre un aula
 * ajena.
 *
 * El filtro y la página viven en la URL (AC5), igual que «Mis aulas».
 */
export function SupervisionAulasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseAdminClassroomsQuery(searchParams);
  const { data, isPending, isError, refetch, isRefetching } = useAdminClassrooms(query);
  const announce = useAnnounce();

  const hayFiltro = hayFiltrosActivos(query);
  const hayLista = Boolean(data && data.items.length > 0);

  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce(hayFiltro ? 'No hay aulas con ese filtro.' : 'Todavía no hay aulas en la academia.');
      return;
    }

    announce(`Se encontraron ${data.total} aula${data.total === 1 ? '' : 's'}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `hayFiltro` decide SOLO el texto del caso "0 resultados"; incluirlo dispararía el anuncio al cambiar de filtro, antes de que llegue la respuesta nueva.
  }, [data, announce]);

  function actualizarFiltro(siguiente: AdminClassroomsQuery) {
    setSearchParams(buildAdminClassroomsSearchParams(siguiente));
  }

  function irAPagina(pagina: number) {
    setSearchParams(buildAdminClassroomsSearchParams({ ...query, page: pagina }));
  }

  const paginaActual = query.page ?? 1;
  const totalPaginas = data ? Math.max(Math.ceil(data.total / data.pageSize), 1) : 1;

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Supervisión de aulas"
        contexto="Todas las clases de la academia: de cualquier profesor, publicadas o canceladas, futuras o pasadas."
      />

      <FiltrosSupervision value={query} onChange={actualizarFiltro} />

      {/* Estado 1 — cargando. Con texto, nunca un spinner mudo. */}
      {isPending && (
        <p role="status" className="flex items-center gap-3 py-12 text-base text-muted-foreground">
          <LoaderCircle
            aria-hidden="true"
            strokeWidth={2}
            className="size-5 shrink-0 animate-spin"
          />
          Cargando las aulas…
        </p>
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
              {isRefetching ? 'Cargando las aulas…' : 'Volver a cargar'}
            </Button>
          </div>
        </Callout>
      )}

      {/* Estado 3 — vacío, con dos textos distintos según haya filtro. */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <>
          {hayFiltro ? (
            <EstadoVacio
              titular="No hay aulas con ese filtro"
              ayuda="Prueba con otro profesor, estado o rango de fechas."
              accion={
                <Button variant="outline" onClick={() => actualizarFiltro({})}>
                  Quitar filtros
                </Button>
              }
            />
          ) : (
            <EstadoVacio
              titular="Todavía no hay aulas en la academia"
              ayuda="Cuando un profesor publique una clase, aparecerá aquí."
            />
          )}
        </>
      )}

      {/* Estado 4 — la lista. */}
      {!isPending && !isError && hayLista && data && (
        <>
          <TablaSupervisionAulas items={data.items} total={data.total} />

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación de supervisión de aulas"
              className="flex items-center justify-center gap-4 border-t border-border pt-6"
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
