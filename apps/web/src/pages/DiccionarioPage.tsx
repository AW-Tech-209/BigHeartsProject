import {
  EstadoModulo,
  type ModuloResumen,
  TRAMO_MODULO_LABELS,
  type TramoModulo,
} from '@academia/types';
import { useSearchParams } from 'react-router-dom';

import { EstadoVacio } from '@/components/dominio/estado-vacio';
import { AppShell } from '@/components/layout/app-shell';
import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BuscadorDiccionario } from '@/features/diccionario/components/buscador-diccionario';
import { ResultadosBusqueda } from '@/features/diccionario/components/resultados-busqueda';
import { TarjetaModulo } from '@/features/diccionario/components/tarjeta-modulo';
import { VistoRecientemente } from '@/features/diccionario/components/visto-recientemente';
import { puedeBuscar, useDiccionarioInicio } from '@/features/diccionario/hooks/use-diccionario';
import { ESTILO_TRAMO, ORDEN_TRAMOS } from '@/features/diccionario/lib/tramos';
import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';

export function DiccionarioPage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const conBusqueda = puedeBuscar(q);
  const inicio = useDiccionarioInicio();
  const modulos = inicio.data?.modulos ?? [];
  const disponibles = modulos
    .filter((m) => m.estado === EstadoModulo.DISPONIBLE)
    .map((m) => m.numero);

  return (
    <AppShell>
      <PaginaCabecera
        titulo="Diccionario"
        tituloDocumento={conBusqueda ? `“${q.trim()}” · Diccionario` : 'Diccionario'}
        contexto="Inglés, español y Lengua de Señas Colombiana (LSC). Busca una palabra o entra a un módulo."
      />

      <BuscadorDiccionario valorInicial={q} modulosDisponibles={disponibles} />

      {conBusqueda ? (
        <ResultadosBusqueda q={q.trim()} modulos={disponibles} />
      ) : (
        <>
          {inicio.isPending ? (
            <div role="status" className="grid gap-4 lg:grid-cols-3">
              <span className="sr-only">Cargando los módulos…</span>
              <Skeleton className="h-52" />
              <Skeleton className="h-52" />
              <Skeleton className="h-52" />
            </div>
          ) : inicio.isError ? (
            <EstadoVacio
              ilustracion="error"
              titular="No pudimos cargar el diccionario."
              ayuda="Revisa tu conexión e inténtalo de nuevo."
              accion={
                <Button
                  variant="outline"
                  className="h-11 px-4"
                  onClick={() => void inicio.refetch()}
                >
                  Reintentar
                </Button>
              }
            />
          ) : (
            ORDEN_TRAMOS.map((tramo) => (
              <SeccionTramo
                key={tramo}
                tramo={tramo}
                modulos={modulos.filter((m) => m.tramo === tramo)}
                ultimoDisponible={disponibles.at(-1)}
              />
            ))
          )}
          <VistoRecientemente />
        </>
      )}
    </AppShell>
  );
}

function SeccionTramo({
  tramo,
  modulos,
  ultimoDisponible,
}: {
  tramo: TramoModulo;
  modulos: ModuloResumen[];
  ultimoDisponible?: number;
}) {
  const esMovil = useEsMovil();
  if (modulos.length === 0) return null;

  const { icono: Icono, texto } = ESTILO_TRAMO[tramo];
  const numeros = modulos.map((m) => m.numero);
  const palabras = modulos.reduce((total, m) => total + m.palabras, 0);
  const algunoDisponible = modulos.some((m) => m.estado === EstadoModulo.DISPONIBLE);
  const idTitulo = `tramo-${tramo.toLowerCase()}`;

  return (
    <section aria-labelledby={idTitulo} className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={idTitulo} className="flex items-center gap-2.5 text-2xl font-semibold">
          <Icono aria-hidden="true" strokeWidth={2.5} className={cn('size-5', texto)} />
          {TRAMO_MODULO_LABELS[tramo]}
        </h2>
        <p className="text-base text-muted-foreground">
          Módulos {Math.min(...numeros)} a {Math.max(...numeros)} ·{' '}
          {algunoDisponible ? `${palabras} palabras` : 'Próximamente'}
        </p>
      </div>
      <ul className="grid gap-4 lg:grid-cols-3">
        {modulos.map((modulo) => (
          <li key={modulo.numero}>
            <TarjetaModulo
              modulo={modulo}
              layout={esMovil ? 'compacta' : 'vertical'}
              ultimoDisponible={ultimoDisponible}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
