import {
  ApiErrorCode,
  type CategoriaDetalleResponse,
  type CategoriaQuery,
  TIPO_ENTRADA_LABELS,
  type TipoEntrada,
} from '@academia/types';
import { ChevronDown, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ChipFiltro, GrupoFiltros } from '@/features/diccionario/components/chip-filtro';
import { IconoCategoria } from '@/features/diccionario/components/icono-categoria';
import { InsigniaTramo } from '@/features/diccionario/components/insignia-tramo';
import { Migas } from '@/features/diccionario/components/migas';
import { TarjetaPalabra } from '@/features/diccionario/components/tarjeta-palabra';
import { TarjetaPracticar } from '@/features/diccionario/components/tarjeta-practicar';
import { useCategoria } from '@/features/diccionario/hooks/use-diccionario';
import {
  aParams,
  hayFiltros,
  leerFiltrosCategoria,
  nombreUnidad,
} from '@/features/diccionario/lib/filtros-url';
import { ESTILO_TRAMO } from '@/features/diccionario/lib/tramos';
import { ApiClientError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

const NO_ENCONTRADA: string[] = [
  ApiErrorCode.CATEGORY_NOT_FOUND,
  ApiErrorCode.MODULE_NOT_FOUND,
  ApiErrorCode.MODULE_NOT_AVAILABLE,
];
const PRIMERAS = 9;
const POR_TANDA = 12;

export function DiccionarioCategoriaPage() {
  const { numero: param = '', categoria: slug = '' } = useParams();
  const numero = Number(param);
  const [params, setParams] = useSearchParams();
  const filtros = leerFiltrosCategoria(params);
  const categoria = useCategoria(numero, slug, filtros);
  const datos = categoria.data;

  const aplicar = (cambio: Partial<CategoriaQuery>) =>
    setParams(aParams({ ...filtros, ...cambio }), { replace: true });
  const quitarFiltros = () => setParams({}, { replace: true });

  const migaModulo = { texto: `Módulo ${param}`, to: `/diccionario/modulo/${param}` };
  const nombre = datos?.categoria.nombre ?? 'Categoría';

  if (categoria.error instanceof ApiClientError && NO_ENCONTRADA.includes(categoria.error.code)) {
    return (
      <AppShell>
        <Migas
          pasos={[{ texto: 'Diccionario', to: '/diccionario' }, migaModulo, { texto: 'Categoría' }]}
        />
        <PaginaCabecera titulo="Categoría" tituloDocumento="Categoría · Diccionario" />
        <EstadoVacio
          ilustracion="no-encontrado"
          titular="No encontramos esta categoría."
          ayuda="Puede que el enlace esté incompleto. Vuelve al módulo para elegir una categoría."
          accion={
            <Button render={<Link to={migaModulo.to} />} variant="outline" className="h-11 px-4">
              Volver al Módulo {param}
            </Button>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Migas
        pasos={[{ texto: 'Diccionario', to: '/diccionario' }, migaModulo, { texto: nombre }]}
      />

      {!datos ? (
        categoria.isError ? (
          <>
            <PaginaCabecera titulo="Categoría" tituloDocumento="Categoría · Diccionario" />
            <EstadoVacio
              ilustracion="error"
              titular="No pudimos cargar las palabras."
              ayuda="Revisa tu conexión e inténtalo de nuevo."
              accion={
                <Button
                  variant="outline"
                  className="h-11 px-4"
                  onClick={() => void categoria.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          </>
        ) : (
          <div role="status" className="space-y-4">
            <span className="sr-only">Cargando las palabras…</span>
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        )
      ) : (
        <>
          <div className="space-y-3">
            <InsigniaTramo tramo={datos.modulo.tramo} modulo={datos.modulo.numero} />
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <IconoCategoria nombre={datos.categoria.icono} className="size-6" />
              </span>
              <PaginaCabecera
                titulo={datos.categoria.nombre}
                tituloDocumento={`${datos.categoria.nombre} · Módulo ${datos.modulo.numero} · Diccionario`}
                className="min-w-0 flex-1"
              />
            </div>
            <p className="max-w-[65ch] text-base text-muted-foreground">
              {datos.filtros.total} palabras · {datos.filtros.conSena} con seña. Toca una palabra
              para ver su seña.
            </p>
          </div>

          <Filtros datos={datos} filtros={filtros} aplicar={aplicar} quitar={quitarFiltros} />

          {datos.entradas.length === 0 ? (
            <EstadoVacio
              ilustracion="no-encontrado"
              titular={
                hayFiltros(filtros)
                  ? 'Ninguna palabra cumple estos filtros.'
                  : 'Esta categoría todavía no tiene palabras.'
              }
              ayuda={
                hayFiltros(filtros)
                  ? 'Quita algún filtro para ver más palabras.'
                  : 'Vuelve al módulo para elegir otra categoría.'
              }
              accion={
                hayFiltros(filtros) ? (
                  <Button variant="outline" className="h-11 px-4" onClick={quitarFiltros}>
                    Quitar filtros
                  </Button>
                ) : (
                  <Button
                    render={<Link to={migaModulo.to} />}
                    variant="outline"
                    className="h-11 px-4"
                  >
                    Volver al Módulo {param}
                  </Button>
                )
              }
            />
          ) : (
            <ListaPalabras key={params.toString()} datos={datos} />
          )}

          <TarjetaPracticar categoria={datos.categoria.nombre} tramo={datos.modulo.tramo} />
        </>
      )}
    </AppShell>
  );
}

function Filtros({
  datos,
  filtros,
  aplicar,
  quitar,
}: {
  datos: CategoriaDetalleResponse;
  filtros: CategoriaQuery;
  aplicar: (cambio: Partial<CategoriaQuery>) => void;
  quitar: () => void;
}) {
  const idSena = useId();
  const tipos = (Object.entries(datos.filtros.tipos) as [TipoEntrada, number][]).filter(
    ([, conteo]) => conteo > 0,
  );
  const unidades = datos.filtros.unidades.filter((u) => u.palabras > 0);
  const filtrando = hayFiltros(filtros);

  return (
    <section
      aria-label="Filtros"
      className={cn(
        'space-y-5 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6',
        ESTILO_TRAMO[datos.modulo.tramo].riel,
      )}
    >
      <GrupoFiltros titulo="Tipo" ayuda="Solo aparecen los tipos que hay en esta categoría.">
        <ChipFiltro
          activo={!filtros.tipo}
          conteo={datos.filtros.total}
          onClick={() => aplicar({ tipo: undefined })}
        >
          Todos
        </ChipFiltro>
        {tipos.map(([tipo, conteo]) => (
          <ChipFiltro
            key={tipo}
            activo={filtros.tipo === tipo}
            conteo={conteo}
            onClick={() => aplicar({ tipo })}
          >
            {TIPO_ENTRADA_LABELS[tipo]}
          </ChipFiltro>
        ))}
      </GrupoFiltros>

      {unidades.length > 0 && (
        <GrupoFiltros titulo="Unidad">
          <ChipFiltro
            activo={!filtros.unidad}
            conteo={datos.filtros.total}
            onClick={() => aplicar({ unidad: undefined })}
          >
            Todas
          </ChipFiltro>
          {unidades.map((u) => (
            <ChipFiltro
              key={u.codigo}
              activo={filtros.unidad === u.codigo}
              conteo={u.palabras}
              onClick={() => aplicar({ unidad: u.codigo })}
            >
              {nombreUnidad(u)}
            </ChipFiltro>
          ))}
        </GrupoFiltros>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <label htmlFor={idSena} className="flex cursor-pointer items-center gap-3">
          <Switch
            id={idSena}
            checked={Boolean(filtros.conSena)}
            onCheckedChange={(valor) => aplicar({ conSena: valor || undefined })}
          />
          <span className="flex flex-col">
            <span className="text-base font-medium">Solo con seña</span>
            <span className="text-sm text-muted-foreground">
              {datos.filtros.conSena} de {datos.filtros.total} palabras
            </span>
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="text-base font-medium">
            {filtrando
              ? `${datos.entradas.length} de ${datos.filtros.total} palabras`
              : `Mostrando ${datos.entradas.length} palabras`}
          </p>
          {filtrando && (
            <Button variant="outline" onClick={quitar} className="h-11 gap-2 px-4 text-base">
              <X aria-hidden="true" strokeWidth={2} className="size-4" />
              Quitar filtros
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function ListaPalabras({ datos }: { datos: CategoriaDetalleResponse }) {
  const [visibles, setVisibles] = useState(PRIMERAS);
  const total = datos.entradas.length;
  const mostradas = datos.entradas.slice(0, visibles);
  const siguientes = Math.min(POR_TANDA, total - visibles);

  return (
    <div className="space-y-6">
      <ul className="grid gap-4 lg:grid-cols-3">
        {mostradas.map((entrada) => (
          <li key={entrada.slug}>
            <TarjetaPalabra entrada={entrada} tramo={datos.modulo.tramo} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <p aria-live="polite" className="text-base text-muted-foreground">
          {mostradas.length < total
            ? `Ves ${mostradas.length} de ${total} palabras.`
            : `Ves ${total === 1 ? 'la única palabra' : `las ${total} palabras`}.`}
        </p>
        {siguientes > 0 && (
          <Button
            variant="outline"
            onClick={() => setVisibles((v) => v + POR_TANDA)}
            className="h-11 gap-2 px-4 text-base"
          >
            <ChevronDown aria-hidden="true" strokeWidth={2} className="size-4" />
            Mostrar {siguientes} más
          </Button>
        )}
      </div>
    </div>
  );
}
