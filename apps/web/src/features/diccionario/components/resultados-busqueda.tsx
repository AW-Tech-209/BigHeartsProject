import { BUSQUEDA_LIMITE_MAX } from '@academia/types';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBusquedaDiccionario } from '../hooks/use-diccionario';
import { abrirEntrada } from '../lib/recientes';
import { SinResultados } from './buscador-diccionario';
import { SugerenciaBusqueda } from './sugerencia-busqueda';

/** La lista completa de `/diccionario?q=`: lo que se ve al pulsar Enter sin elegir sugerencia. */
export function ResultadosBusqueda({ q, modulos }: { q: string; modulos: number[] }) {
  const navigate = useNavigate();
  const busqueda = useBusquedaDiccionario(q, BUSQUEDA_LIMITE_MAX);
  const resultados = busqueda.data?.resultados ?? [];

  return (
    <section aria-labelledby="titulo-resultados" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-resultados" className="text-xl font-semibold">
          Resultados para “{q}”
        </h2>
        <Link
          to="/diccionario"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft aria-hidden="true" strokeWidth={2} className="size-4" />
          Volver a los módulos
        </Link>
      </div>

      <p role="status" className="text-base text-muted-foreground">
        {busqueda.isPending
          ? 'Buscando…'
          : busqueda.isSuccess
            ? `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}`
            : ''}
      </p>

      {busqueda.isPending ? (
        <div aria-hidden="true" className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : busqueda.isError ? (
        <EstadoVacio
          ilustracion="error"
          titular="No pudimos buscar."
          ayuda="Revisa tu conexión e inténtalo de nuevo."
          accion={
            <Button variant="outline" className="h-11 px-4" onClick={() => void busqueda.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : resultados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border">
          <SinResultados
            busqueda={q}
            modulos={modulos}
            onVerModulos={() => navigate('/diccionario')}
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {resultados.map((resultado) => (
            <li key={resultado.slug}>
              <Link
                to={`/diccionario/entrada/${resultado.slug}`}
                onClick={() => abrirEntrada(resultado)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transicion-suave hover:shadow-sm"
              >
                <SugerenciaBusqueda resultado={resultado} busqueda={q} />
                <ChevronRight aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
