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
import { useMisAulas } from '@/features/aulas/hooks/use-mis-aulas';
import {
  buildMisAulasSearchParams,
  parseMisAulasQuery,
} from '@/features/aulas/lib/filtros-mis-aulas';
import { useAnnounce } from '@/hooks/use-announce';

/** Cuántas tarjetas fantasma se pintan mientras carga (una fila completa en escritorio). */
const TARJETAS_FANTASMA = 6;

/**
 * Las aulas que el profesor imparte y todavía no pasaron (HU-207; D34 de
 * HU-404 la acota a lo próximo, con el resto en `/historial`).
 *
 * **No es el catálogo con otro filtro.** `/aulas` es la vista pública —solo
 * publicadas y futuras, para que un estudiante descubra una clase—; esta es el
 * registro del dueño. El alcance lo decide el servidor a partir del token:
 * aquí no se filtra por `teacherId` en el cliente, ni se puede.
 *
 * La página vive en la URL: copiar el enlace y abrirlo en otra pestaña
 * reproduce la misma vista.
 *
 * La acción primaria vive en UN solo sitio a la vez (decisión 4 de la HU): en
 * la cabecera cuando hay lista, y dentro del estado vacío cuando no la hay.
 * Pintarla en los dos deja dos acciones primarias compitiendo, que es lo que
 * prohíbe `layout-y-composicion.md`.
 */
export function MisAulasPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query: MisAulasQuery = {
    ...parseMisAulasQuery(searchParams),
    estado: EstadoTemporalAula.PROXIMAS,
  };
  const { data, isPending, isError, refetch, isRefetching } = useMisAulas(query);
  const announce = useAnnounce();

  const hayLista = Boolean(data && data.items.length > 0);

  // AC12: cada resultado nuevo se anuncia por región viva. Solo se dispara
  // cuando `data` cambia de verdad (React Query mantiene la misma referencia
  // entre renders si el contenido no cambió), nunca en cada pintado.
  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce('Todavía no creaste ninguna aula.');
      return;
    }

    announce(`Se encontraron ${data.total} aula${data.total === 1 ? '' : 's'}.`);
  }, [data, announce]);

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
  const verHistorial = (
    <Button variant="outline" render={<Link to="/historial" />} className="h-11 px-5 text-base">
      Ver historial
    </Button>
  );

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Mis aulas"
        contexto="Las clases que impartes y todavía no pasaron, con su horario, su cupo y los estudiantes inscritos."
        accion={
          <div className="flex flex-wrap gap-3">
            {verHistorial}
            {hayLista && crearUnaClase}
          </div>
        }
      />

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

      {/* Estado 3 — vacío. */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <EstadoVacio
          titular="Todavía no creaste ninguna aula"
          ayuda="Publica tu primera clase con su horario y su cupo. Aquí verás quién reservó en cada una."
          accion={crearUnaClase}
        />
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

          <RejillaAulas className="subir-suave">
            {data.items.map((aula) => (
              // La tarjeta es el punto de decisión del listado: el detalle
              // conserva las mismas acciones para quien ya está dentro.
              <TarjetaAula key={aula.id} classroom={aula} perspectiva="profesor" />
            ))}
          </RejillaAulas>

          {totalPaginas > 1 && (
            <nav
              aria-label="Paginación de mis aulas"
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
