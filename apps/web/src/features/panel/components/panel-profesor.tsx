import { CLASSROOMS_PAGE_SIZE_MAX } from '@academia/types';
import { CalendarCheck, RotateCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { TarjetaAula } from '@/components/dominio/tarjeta-aula';
import { RejillaAulas } from '@/components/layout/rejilla-aulas';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useClassrooms } from '@/features/aulas/hooks/use-classrooms';

/** Cuántas clases próximas caben en el inicio: una fila de la rejilla en escritorio. */
const PROXIMAS_VISIBLES = 3;

/**
 * El inicio del profesor: las clases que va a impartir.
 *
 * ⚠️ **De dónde sale el dato, y por qué es provisional.**
 * `ARQUITECTURA.md` §4.8 dice que las aulas de un profesor se leen por
 * `GET /classrooms/mias`, acotado al token — y su regla 3 prohíbe un
 * `?teacherId=`. Ese endpoint es la task A1 de HU-207 y **todavía no existe**,
 * mientras que HU-209 es de alcance frontend. Así que, hasta que aterrice, esto
 * lee el catálogo público (que ya viene ordenado por fecha, solo `PUBLISHED` y
 * solo futuras) y **compara `teacherId` contra el usuario de la sesión en el
 * cliente** — el mismo mecanismo que fija la decisión 2 de HU-208.
 *
 * La limitación que eso deja: si las clases de este profesor cayeran fuera de
 * las {@link CLASSROOMS_PAGE_SIZE_MAX} próximas de TODA la academia, aquí se
 * vería el vacío teniéndolas. **Cuando HU-207 exista, esta consulta se sustituye
 * por `GET /classrooms/mias` y la limitación desaparece.** No repliques este
 * filtro en cliente en ninguna pantalla nueva.
 */
export function PanelProfesor() {
  const { user } = useAuth();
  const { data, isPending, isError, refetch, isRefetching } = useClassrooms({
    pageSize: CLASSROOMS_PAGE_SIZE_MAX,
  });

  const proximas = (data?.items ?? [])
    .filter((aula) => aula.teacherId === user?.id)
    .slice(0, PROXIMAS_VISIBLES);

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
          className="flex items-center gap-2 text-xl font-medium text-foreground"
        >
          <CalendarCheck aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
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
        <RejillaAulas>
          {proximas.map((aula) => (
            <TarjetaAula key={aula.id} classroom={aula} />
          ))}
        </RejillaAulas>
      )}
    </section>
  );
}
