import { type ListClassroomsQuery, UserRole } from '@academia/types';
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
import { InvitacionPreferencia } from '@/features/aulas/components/invitacion-preferencia';
import { useClassrooms } from '@/features/aulas/hooks/use-classrooms';
import {
  buildSearchParams,
  hayFiltrosActivos,
  parseListClassroomsQuery,
} from '@/features/aulas/lib/filtros-url';
import { puedeReservar } from '@/features/aulas/lib/puede-reservar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useAnnounce } from '@/hooks/use-announce';

/** Cuántas tarjetas fantasma se pintan mientras carga (una fila completa en escritorio). */
const TARJETAS_FANTASMA = 6;

/** El titular del vacío del profesor filtrando lo suyo (HU-208, T5/AC7). */
const VACIO_DE_MIS_CLASES = 'No tienes clases publicadas con esos filtros.';

/**
 * Lo que se anuncia por región viva cuando no hay resultados (AC9 de HU-203).
 *
 * Sale a una función para que los tres casos se lean juntos: el del profesor
 * (AC7) se añadió aquí, y con el `if` escrito dentro del `useEffect` era fácil
 * dejar el vacío visible diciendo una cosa y el anuncio otra.
 */
function anuncioDelVacio(query: ListClassroomsQuery, esProfesor: boolean): string {
  if (esProfesor && query.mias) return VACIO_DE_MIS_CLASES;
  if (hayFiltrosActivos(query)) return 'No se encontraron aulas con esos filtros.';
  return 'Todavía no hay aulas publicadas.';
}

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
  const { user } = useAuth();

  // T12: solo el estudiante ve la marca de coincidencia. Un `undefined` aquí
  // hace que `coincideConLaPreferencia()` devuelva `false` siempre — nunca una
  // marca sobre el aula de otro rol.
  const preferenciaEstudiante =
    user?.role === UserRole.STUDENT ? user.communicationPreference : undefined;

  /**
   * HU-208. Las dos derivaciones de presentación por rol, resueltas UNA vez
   * aquí y pasadas hacia abajo: ni la tarjeta ni los filtros leen la sesión.
   *
   * `esProfesor` decide si se ofrece la casilla `Solo mis clases` (AC5); solo
   * él tiene clases propias que separar del resto. La decisión de verdad sobre
   * qué puede hacer con ellas la toma el servidor (§4.8).
   */
  const esProfesor = user?.role === UserRole.TEACHER;
  const seLePuedeOfrecerReservar = puedeReservar(user);

  /**
   * AC7: el vacío del profesor filtrando lo suyo no es el del catálogo. Se mira
   * ANTES que `hayFiltrosActivos()` —que también cuenta `mias`— porque «prueba
   * con otro nivel u otra fecha» invita a explorar la oferta ajena, y aquí el
   * profesor está mirando su propio registro.
   *
   * Lleva `esProfesor` y no solo `query.mias` porque la URL la puede teclear
   * cualquiera: un estudiante que abra `/aulas?mias=true` recibe una lista
   * vacía —correcto, ninguna aula es suya— pero decirle «no tienes clases
   * publicadas, publica una clase» sería copy de otro rol. A él le sirve el
   * vacío genérico, que es el que le queda al caer por `hayFiltrosActivos()`.
   */
  const filtrandoLasMias = esProfesor && Boolean(query.mias);

  // AC9: cada resultado nuevo se anuncia por región viva. Solo se dispara
  // cuando `data` cambia de verdad (React Query mantiene la misma referencia
  // entre renders si el contenido no cambió), nunca en cada pintado.
  useEffect(() => {
    if (!data) return;

    if (data.total === 0) {
      announce(anuncioDelVacio(query, esProfesor));
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

      {/* T14, AC6: solo al estudiante sin preferencia, y sin insistir. */}
      {user?.role === UserRole.STUDENT && !user.communicationPreference && (
        <InvitacionPreferencia userId={user.id} />
      )}

      <FiltrosAulas value={query} onChange={actualizarFiltros} ofreceSoloMisClases={esProfesor} />

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

      {/*
        Estado 3 — vacío. Tres textos distintos: el del profesor mirando lo
        suyo (AC7 de HU-208), el de unos filtros sin resultados y el del
        catálogo todavía sin publicar (AC8 de HU-203).
      */}
      {!isPending && !isError && data && data.items.length === 0 && (
        <>
          {filtrandoLasMias ? (
            /*
              AC7: no se reutiliza el genérico. «Prueba con otro nivel u otra
              fecha» invita a explorar la oferta de la academia, y el profesor
              que marcó `Solo mis clases` está mirando su propio registro: esa
              invitación le respondería a una pregunta que no hizo. La salida
              que sí le sirve es volver al catálogo completo.
            */
            <EstadoVacio
              titular={VACIO_DE_MIS_CLASES}
              ayuda="Publica una clase o quita el filtro para ver el catálogo completo de la academia."
              accion={
                <Button variant="outline" onClick={() => actualizarFiltros({})}>
                  Quitar filtros
                </Button>
              }
            />
          ) : hayFiltrosActivos(query) ? (
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
          {/*
            El encabezado de la rejilla existe para que el orden de niveles no
            salte del <h1> de la página al <h3> de la tarjeta —`axe` lo marca
            como `heading-order`, y quien navega por encabezados con lector de
            pantalla se queda sin el peldaño intermedio—. Va `sr-only` porque
            visualmente la cabecera ya dice qué es esta pantalla. Detectado al
            correr `axe` sobre la rejilla CON datos en HU-207; hasta entonces
            solo se había verificado su estado vacío.
          */}
          <h2 className="sr-only">Aulas publicadas</h2>

          <RejillaAulas>
            {data.items.map((item) => (
              <TarjetaAula
                key={item.id}
                classroom={item}
                preferenciaEstudiante={preferenciaEstudiante}
                // AC1: la comparación es contra el usuario de la sesión, y solo
                // decide presentación. Un estudiante nunca es `teacherId` de
                // nada, así que sale `false` sin comprobar el rol.
                esMia={item.teacherId === user?.id}
                puedeReservarla={seLePuedeOfrecerReservar}
              />
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
