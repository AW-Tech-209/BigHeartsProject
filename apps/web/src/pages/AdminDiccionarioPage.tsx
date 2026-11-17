import {
  AccionLote,
  ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT,
  type EntradaAdmin,
  type EntradasAdminQuery,
  type LoteEntradasInput,
} from '@academia/types';
import { ArrowRight, ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AccesosConsola } from '@/features/admin/diccionario/components/accesos-consola';
import { AvanceSenas } from '@/features/admin/diccionario/components/avance-senas';
import { type Aviso, AvisoDeshacer } from '@/features/admin/diccionario/components/aviso-deshacer';
import { BarraLote } from '@/features/admin/diccionario/components/barra-lote';
import { FiltrosConsola } from '@/features/admin/diccionario/components/filtros-consola';
import { TablaEntradas } from '@/features/admin/diccionario/components/tabla-entradas';
import {
  useAvance,
  useCategoriasAdmin,
  useEntradasAdmin,
  useLoteEntradas,
  useModulosAdmin,
  useRestaurarEntradas,
} from '@/features/admin/diccionario/hooks/use-admin-diccionario';
import {
  aParamsConsola,
  cambiarFiltro,
  leerFiltrosConsola,
  totalPaginas,
} from '@/features/admin/diccionario/lib/filtros-consola';

const MENSAJE_LOTE: Record<AccionLote, (n: number) => string> = {
  [AccionLote.MOVER_CATEGORIA]: (n) =>
    `${n} ${n === 1 ? 'entrada movida' : 'entradas movidas'} de categoría`,
  [AccionLote.MOVER_MODULO]: (n) =>
    `${n} ${n === 1 ? 'entrada movida' : 'entradas movidas'} de módulo`,
  [AccionLote.OCULTAR]: (n) => `${n} ${n === 1 ? 'entrada oculta' : 'entradas ocultas'}`,
  [AccionLote.PUBLICAR]: (n) => `${n} ${n === 1 ? 'entrada publicada' : 'entradas publicadas'}`,
  [AccionLote.ENVIAR_PAPELERA]: (n) =>
    `${n} ${n === 1 ? 'entrada enviada' : 'entradas enviadas'} a la papelera`,
};

export function AdminDiccionarioPage() {
  const [params, setParams] = useSearchParams();
  const filtros = leerFiltrosConsola(params);
  const pageSize = ENTRADAS_ADMIN_PAGE_SIZE_DEFAULT;
  const avance = useAvance();
  const modulos = useModulosAdmin();
  const categorias = useCategoriasAdmin();
  const entradas = useEntradasAdmin({ ...filtros, pageSize });
  const lote = useLoteEntradas();
  const restaurar = useRestaurarEntradas();
  const [seleccion, setSeleccion] = useState<Set<string>>(() => new Set());
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const cerrarAviso = useCallback(() => setAviso(null), []);
  const avisar = (mensaje: string, accion?: Aviso['accion']) =>
    setAviso({ id: Date.now(), mensaje, accion });

  const onCambiar = useCallback(
    (cambio: Partial<EntradasAdminQuery>) => {
      setParams((actuales) => aParamsConsola(cambiarFiltro(leerFiltrosConsola(actuales), cambio)), {
        replace: true,
      });
      setSeleccion(new Set());
    },
    [setParams],
  );

  async function aplicarLote(accion: Omit<LoteEntradasInput, 'ids'>) {
    const ids = [...seleccion];
    await lote.mutateAsync({ ...accion, ids });
    setSeleccion(new Set());
    const mensaje = MENSAJE_LOTE[accion.accion](ids.length);
    if (accion.accion === AccionLote.ENVIAR_PAPELERA) {
      avisar(mensaje, {
        texto: 'Deshacer',
        onClick: () =>
          restaurar.mutate(
            { ids },
            {
              onSuccess: () =>
                avisar(`${ids.length === 1 ? 'Entrada restaurada' : 'Entradas restauradas'}`),
              onError: () => avisar('No pudimos restaurarlas. Búscalas en la Papelera.'),
            },
          ),
      });
    } else {
      avisar(mensaje);
    }
  }

  function marcarPagina(marcadas: boolean) {
    setSeleccion((actual) => {
      const nueva = new Set(actual);
      for (const e of entradas.data?.items ?? []) {
        if (marcadas) nueva.add(e.id);
        else nueva.delete(e.id);
      }
      return nueva;
    });
  }

  const totalEntradas = avance.data?.modulos.reduce((suma, m) => suma + m.palabras, 0);
  const datos = entradas.data;
  const pagina = filtros.page ?? 1;
  const paginas = datos ? totalPaginas(datos.total, pageSize) : 1;

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Diccionario"
        contexto={
          totalEntradas !== undefined
            ? `Administra las ${totalEntradas} entradas y sus señas en LSC.`
            : 'Administra las entradas y sus señas en LSC.'
        }
        accion={
          <Button
            render={<Link to="/admin/diccionario/entrada/nueva" />}
            className="h-12 gap-2 px-5 text-base"
          >
            <Plus aria-hidden="true" strokeWidth={2} className="size-5" />
            Crear entrada
          </Button>
        }
      />

      <Link
        to="/diccionario"
        className="inline-flex min-h-11 items-center gap-2 text-base font-medium text-primary underline-offset-4 hover:underline"
      >
        <Eye aria-hidden="true" strokeWidth={2} className="size-4" />
        Ver el diccionario como estudiante
        <ArrowRight aria-hidden="true" strokeWidth={2} className="size-4" />
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        {avance.data ? (
          <AvanceSenas modulos={avance.data.modulos} />
        ) : (
          <Skeleton className="h-56" />
        )}
        <AccesosConsola
          sinSena={avance.data?.totales.sinSena ?? 0}
          enPapelera={avance.data?.totales.enPapelera ?? 0}
          modulos={modulos.data?.modulos.length ?? 9}
          categorias={categorias.data?.categorias.length ?? 0}
        />
      </div>

      <section aria-labelledby="titulo-entradas" className="space-y-4">
        <h2 id="titulo-entradas" className="text-2xl font-semibold">
          Entradas
        </h2>
        <FiltrosConsola
          filtros={filtros}
          modulos={modulos.data?.modulos ?? []}
          categorias={categorias.data?.categorias ?? []}
          conteosSena={datos?.conteosSena}
          total={datos?.total}
          onCambiar={onCambiar}
          onQuitar={() => {
            setParams({}, { replace: true });
            setSeleccion(new Set());
          }}
        />

        {seleccion.size > 0 && (
          <BarraLote
            cantidad={seleccion.size}
            modulos={modulos.data?.modulos ?? []}
            categorias={categorias.data?.categorias ?? []}
            pendiente={lote.isPending}
            onAplicar={aplicarLote}
            onQuitarSeleccion={() => setSeleccion(new Set())}
          />
        )}
        {lote.isError && (
          <p role="alert" className="text-base text-destructive">
            {lote.error.message || 'No pudimos aplicar el cambio. Ninguna entrada cambió.'}
          </p>
        )}

        {!datos ? (
          entradas.isError ? (
            <EstadoVacio
              ilustracion="error"
              titular="No pudimos cargar las entradas."
              ayuda="Revisa tu conexión e inténtalo de nuevo."
              accion={
                <Button
                  variant="outline"
                  className="h-11 px-4"
                  onClick={() => void entradas.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          ) : (
            <div role="status" className="space-y-2">
              <span className="sr-only">Cargando las entradas…</span>
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          )
        ) : datos.items.length === 0 ? (
          <EstadoVacio
            ilustracion="no-encontrado"
            titular="Ninguna entrada cumple estos filtros."
            ayuda="Quita algún filtro o busca con otra palabra."
            accion={
              <Button
                variant="outline"
                className="h-11 px-4"
                onClick={() => setParams({}, { replace: true })}
              >
                Quitar filtros
              </Button>
            }
          />
        ) : (
          <>
            <TablaEntradas
              entradas={datos.items}
              seleccion={seleccion}
              onMarcar={(id, marcada) =>
                setSeleccion((actual) => {
                  const nueva = new Set(actual);
                  if (marcada) nueva.add(id);
                  else nueva.delete(id);
                  return nueva;
                })
              }
              onMarcarPagina={marcarPagina}
              onGuardada={(e: EntradaAdmin) => avisar(`${e.ingles} guardada`)}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-base text-muted-foreground">
                {(pagina - 1) * pageSize + 1} a {Math.min(pagina * pageSize, datos.total)} de{' '}
                {datos.total}
              </p>
              <nav aria-label="Páginas" className="flex items-center gap-3">
                {pagina > 1 && (
                  <Button
                    variant="outline"
                    className="h-11 gap-1 px-4 text-base"
                    onClick={() => onCambiar({ page: pagina - 1 })}
                  >
                    <ChevronLeft aria-hidden="true" strokeWidth={2} className="size-4" />
                    Anterior
                  </Button>
                )}
                <p className="text-base font-medium">
                  Página {pagina} de {paginas}
                </p>
                {pagina < paginas && (
                  <Button
                    variant="outline"
                    className="h-11 gap-1 px-4 text-base"
                    onClick={() => onCambiar({ page: pagina + 1 })}
                  >
                    Siguiente
                    <ChevronRight aria-hidden="true" strokeWidth={2} className="size-4" />
                  </Button>
                )}
              </nav>
            </div>
          </>
        )}
      </section>

      <AvisoDeshacer aviso={aviso} onCerrar={cerrarAviso} />
    </AppShell>
  );
}
