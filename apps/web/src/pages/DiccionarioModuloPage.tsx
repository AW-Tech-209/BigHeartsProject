import { ApiErrorCode, EstadoModulo, TRAMO_MODULO_LABELS } from '@academia/types';
import { ArrowRight } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChipFiltro, GrupoFiltros } from '@/features/diccionario/components/chip-filtro';
import { InsigniaTramo } from '@/features/diccionario/components/insignia-tramo';
import { Migas } from '@/features/diccionario/components/migas';
import { TarjetaCategoria } from '@/features/diccionario/components/tarjeta-categoria';
import { useDiccionarioInicio, useModulo } from '@/features/diccionario/hooks/use-diccionario';
import { leerUnidad, nombreUnidad } from '@/features/diccionario/lib/filtros-url';
import { ESTILO_TRAMO } from '@/features/diccionario/lib/tramos';
import { ApiClientError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

const NO_DISPONIBLE: string[] = [ApiErrorCode.MODULE_NOT_FOUND, ApiErrorCode.MODULE_NOT_AVAILABLE];

export function DiccionarioModuloPage() {
  const { numero: param = '' } = useParams();
  const numero = Number(param);
  const [params, setParams] = useSearchParams();
  const unidad = leerUnidad(params);
  const modulo = useModulo(numero, unidad ? { unidad } : {});
  const inicio = useDiccionarioInicio();

  const noDisponible =
    !Number.isInteger(numero) ||
    (modulo.error instanceof ApiClientError && NO_DISPONIBLE.includes(modulo.error.code));

  if (noDisponible) {
    return (
      <AppShell>
        <Migas
          pasos={[{ texto: 'Diccionario', to: '/diccionario' }, { texto: `Módulo ${param}` }]}
        />
        <PaginaCabecera
          titulo={`Módulo ${param}`}
          tituloDocumento={`Módulo ${param} · Diccionario`}
        />
        <EstadoVacio
          ilustracion="no-encontrado"
          titular="Este módulo todavía no está disponible."
          ayuda="Llegará cuando el profesor entregue el material. Mientras tanto, repasa los módulos que ya tienen palabras."
          accion={
            <Button render={<Link to="/diccionario" />} variant="outline" className="h-11 px-4">
              Ver los módulos
            </Button>
          }
        />
      </AppShell>
    );
  }

  const datos = modulo.data;
  const siguiente = inicio.data?.modulos.find(
    (m) => m.numero === numero + 1 && m.estado === EstadoModulo.DISPONIBLE,
  );

  return (
    <AppShell>
      <Migas pasos={[{ texto: 'Diccionario', to: '/diccionario' }, { texto: `Módulo ${param}` }]} />

      {!datos ? (
        modulo.isError ? (
          <>
            <PaginaCabecera
              titulo={`Módulo ${param}`}
              tituloDocumento={`Módulo ${param} · Diccionario`}
            />
            <EstadoVacio
              ilustracion="error"
              titular="No pudimos cargar el módulo."
              ayuda="Revisa tu conexión e inténtalo de nuevo."
              accion={
                <Button
                  variant="outline"
                  className="h-11 px-4"
                  onClick={() => void modulo.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          </>
        ) : (
          <div role="status" className="space-y-4">
            <span className="sr-only">Cargando el módulo…</span>
            <Skeleton className="h-36" />
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </div>
        )
      ) : (
        <>
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-6 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-7',
              ESTILO_TRAMO[datos.modulo.tramo].riel,
            )}
          >
            <div className="space-y-3">
              <InsigniaTramo tramo={datos.modulo.tramo} modulo={datos.modulo.numero} />
              <PaginaCabecera
                titulo={`Módulo ${datos.modulo.numero} · ${TRAMO_MODULO_LABELS[datos.modulo.tramo]}`}
                tituloDocumento={`Módulo ${datos.modulo.numero} · Diccionario`}
                contexto={<span lang="en">{datos.modulo.nombre}</span>}
              />
            </div>
            <dl className="flex flex-wrap gap-x-8 gap-y-3">
              <Dato valor={datos.modulo.palabras} etiqueta="palabras" />
              <Dato valor={datos.modulo.conSena} etiqueta="con seña" />
              <Dato valor={datos.unidades.length} etiqueta="unidades" />
              <Dato valor={datos.categorias.length} etiqueta="categorías" />
            </dl>
          </div>

          {datos.unidades.length > 0 && (
            <section aria-labelledby="titulo-unidades" className="space-y-3">
              <h2 id="titulo-unidades" className="text-xl font-semibold">
                Unidades
              </h2>
              <GrupoFiltros titulo="Elige una unidad para ver solo sus categorías.">
                <ChipFiltro
                  activo={!unidad}
                  conteo={datos.modulo.palabras}
                  onClick={() => setParams({}, { replace: true })}
                >
                  Todas
                </ChipFiltro>
                {datos.unidades.map((u) => (
                  <ChipFiltro
                    key={u.codigo}
                    activo={unidad === u.codigo}
                    conteo={u.palabras}
                    onClick={() => setParams({ unidad: u.codigo }, { replace: true })}
                  >
                    {nombreUnidad(u)}
                  </ChipFiltro>
                ))}
              </GrupoFiltros>
            </section>
          )}

          <section aria-labelledby="titulo-categorias" className="space-y-3">
            <div className="space-y-1">
              <h2 id="titulo-categorias" className="text-xl font-semibold">
                Categorías
              </h2>
              <p role="status" className="text-base text-muted-foreground">
                {datos.categorias.length} categorías. Primero las que tienen más palabras.
              </p>
            </div>
            {datos.categorias.length === 0 ? (
              <EstadoVacio
                titular="Esta unidad todavía no tiene palabras."
                ayuda="Elige otra unidad o mira todas las del módulo."
                accion={
                  <Button
                    variant="outline"
                    className="h-11 px-4"
                    onClick={() => setParams({}, { replace: true })}
                  >
                    Ver todas las unidades
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {datos.categorias.map((categoria) => (
                  <li key={categoria.slug}>
                    <TarjetaCategoria
                      categoria={categoria}
                      tramo={datos.modulo.tramo}
                      to={`/diccionario/modulo/${numero}/${categoria.slug}${unidad ? `?unidad=${unidad}` : ''}`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {siguiente && (
            <Link
              to={`/diccionario/modulo/${siguiente.numero}`}
              className={cn(
                'flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-xs transicion-suave hover:shadow-sm',
                ESTILO_TRAMO[siguiente.tramo].riel,
              )}
            >
              <span className="flex flex-col">
                <span className="text-base text-muted-foreground">Siguiente módulo</span>
                <span className="text-lg font-semibold">
                  Módulo {siguiente.numero} · <span lang="en">{siguiente.nombre}</span>
                </span>
              </span>
              <ArrowRight aria-hidden="true" strokeWidth={2} className="size-5 text-primary" />
            </Link>
          )}
        </>
      )}
    </AppShell>
  );
}

function Dato({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-base text-muted-foreground">{etiqueta}</dt>
      <dd className="text-3xl font-semibold">{valor}</dd>
    </div>
  );
}
