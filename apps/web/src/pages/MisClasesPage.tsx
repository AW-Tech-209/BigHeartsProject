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
import { useMisReservas } from '@/features/aulas/hooks/use-mis-reservas';
import {
  buildMisAulasSearchParams,
  parseMisAulasQuery,
} from '@/features/aulas/lib/filtros-mis-aulas';
import { useAnnounce } from '@/hooks/use-announce';

/** Cuántas tarjetas fantasma se pintan mientras carga (una fila completa en escritorio). */
const TARJETAS_FANTASMA = 6;

/**
 * Las clases que el estudiante tiene reservadas y todavía no pasaron
 * (HU-302; D34 de HU-404 la acota a lo próximo, con el resto en `/historial`).
 *
 * Es la contraparte de «Mis aulas» del profesor (HU-207) y copia su forma: la
 * página vive en la URL, y el alcance lo decide el servidor a partir del
 * token, nunca un parámetro.
 *
 * La tarjeta se reutiliza en `perspectiva="catalogo"` con `puedeReservarla={false}`:
 * es la misma ficha que el catálogo, sin el botón de reservar, con el de
 * cancelar (HU-303) — entrar a la clase es acción de HU-304.
 */
export function MisClasesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query: MisReservasQuery = {
    ...parseMisAulasQuery(searchParams),
    estado: EstadoTemporalAula.PROXIMAS,
  };
  const { data, isPending, isError, refetch, isRefetching } = useMisReservas(query);
  const announce = useAnnounce();

  const hayLista = Boolean(data && data.items.length > 0);

  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce('Todavía no tienes clases reservadas.');
      return;
    }

    announce(`Se encontraron ${data.total} clase${data.total === 1 ? '' : 's'}.`);
  }, [data, announce]);

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
        contexto="Las clases que reservaste y todavía no pasaron, con la hora en que se abre el acceso a cada una."
        accion={
          <Button
            variant="outline"
            render={<Link to="/historial" />}
            className="h-11 px-5 text-base"
          >
            Ver historial
          </Button>
        }
      />

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

      {/* Estado 3 — vacío. */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <EstadoVacio
          titular="Todavía no tienes clases reservadas"
          ayuda="Cuando reserves tu cupo en un aula, la verás aquí con su fecha y su enlace de acceso."
          accion={explorarElCatalogo}
        />
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
