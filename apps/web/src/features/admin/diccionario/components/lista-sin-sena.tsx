import type { EntradaSinSena } from '@academia/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { EstadoSena } from '@/features/diccionario/components/estado-sena';
import { InsigniaTramo } from '@/features/diccionario/components/insignia-tramo';
import { nombreDeArchivo } from '../lib/csv-sin-sena';

const VISIBLES = 5;

type Grupo = { clave: string; titulo: string; entradas: EntradaSinSena[] };

function agrupar<T>(items: T[], clave: (item: T) => string): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const item of items) grupos.set(clave(item), [...(grupos.get(clave(item)) ?? []), item]);
  return grupos;
}

/** Lo que aún no tiene seña lista, por módulo y unidad. Al quedar lista, la entrada sale de aquí. */
export function ListaSinSena({
  entradas,
  cargando,
}: {
  entradas: EntradaSinSena[];
  cargando: boolean;
}) {
  const procesando = entradas.filter((e) => e.sena.estado === 'procesando').length;
  const conError = entradas.filter((e) => e.sena.estado === 'error').length;
  const sinVideo = entradas.length - procesando - conError;
  const porModulo = agrupar(entradas, (e) => String(e.modulo.numero));

  return (
    <section
      aria-labelledby="titulo-sin-sena"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="space-y-1 border-b border-border p-5">
        <h2 id="titulo-sin-sena" className="text-xl font-semibold">
          Sin seña lista
        </h2>
        <p className="text-base text-muted-foreground">
          {sinVideo} sin video · {procesando} procesando · {conError} con error
        </p>
      </div>
      {cargando ? (
        <div role="status" className="space-y-2 p-5">
          <span className="sr-only">Cargando las entradas sin seña…</span>
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : entradas.length === 0 ? (
        <p className="p-5 text-base">Todas las entradas tienen su seña lista.</p>
      ) : (
        <ul className="divide-y divide-border">
          {[...porModulo.entries()].map(([numero, delModulo], i) => (
            <Modulo key={numero} entradas={delModulo} abiertoAlInicio={i === 0} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Modulo({
  entradas,
  abiertoAlInicio,
}: {
  entradas: EntradaSinSena[];
  abiertoAlInicio: boolean;
}) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  const modulo = entradas[0]?.modulo;
  if (!modulo) return null;
  const unidades: Grupo[] = [...agrupar(entradas, (e) => e.unidad?.codigo ?? '').entries()].map(
    ([codigo, deUnidad]) => ({
      clave: codigo,
      titulo: deUnidad[0]?.unidad
        ? `Unidad ${codigo.slice(1)} · ${deUnidad[0].unidad.nombre}`
        : 'Sin unidad',
      entradas: deUnidad,
    }),
  );

  return (
    <li>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="flex min-h-12 w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted"
      >
        {abierto ? (
          <ChevronDown aria-hidden="true" className="size-4" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-4" />
        )}
        <InsigniaTramo tramo={modulo.tramo} texto={`Módulo ${modulo.numero}`} />
        <span className="ml-auto text-base">
          <strong className="font-semibold">{entradas.length}</strong> sin seña
        </span>
      </button>
      {abierto && (
        <ul className="divide-y divide-border border-t border-border">
          {unidades.map((u, i) => (
            <Unidad key={u.clave} grupo={u} abiertoAlInicio={i === 0} />
          ))}
        </ul>
      )}
    </li>
  );
}

function Unidad({ grupo, abiertoAlInicio }: { grupo: Grupo; abiertoAlInicio: boolean }) {
  const [abierto, setAbierto] = useState(abiertoAlInicio);
  const [todas, setTodas] = useState(false);
  const visibles = todas ? grupo.entradas : grupo.entradas.slice(0, VISIBLES);
  const faltan = grupo.entradas.length - visibles.length;

  return (
    <li>
      <button
        type="button"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className="flex min-h-12 w-full items-center gap-3 py-3 pr-5 pl-9 text-left hover:bg-muted"
      >
        {abierto ? (
          <ChevronDown aria-hidden="true" className="size-4" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-4" />
        )}
        <span className="text-base font-medium">{grupo.titulo}</span>
        <span className="ml-auto text-base text-muted-foreground">{grupo.entradas.length}</span>
      </button>
      {abierto && (
        <ul className="divide-y divide-border border-t border-border">
          {visibles.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-3 pr-5 pl-12">
              <span className="min-w-0">
                <span lang="en" className="block text-base font-medium [overflow-wrap:anywhere]">
                  {e.ingles}
                </span>
                <code className="text-sm text-muted-foreground">{nombreDeArchivo(e)}</code>
              </span>
              <EstadoSena vista="admin" estado={e.sena.estado} className="px-2 py-0.5 text-sm" />
            </li>
          ))}
          {faltan > 0 && (
            <li className="p-2 text-center">
              <button
                type="button"
                onClick={() => setTodas(true)}
                className="min-h-11 px-3 text-base text-primary hover:underline"
              >
                Ver {faltan} más
              </button>
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
