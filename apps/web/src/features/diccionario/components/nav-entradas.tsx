import type { EntradaDetalleResponse, EntradaVecina, TramoModulo } from '@academia/types';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Ingles } from '@/components/dominio/ingles';
import { useEsMovil } from '@/hooks/use-es-movil';
import { cn } from '@/lib/utils';
import { ESTILO_TRAMO } from '../lib/tramos';

type NavEntradasProps = Pick<EntradaDetalleResponse, 'anterior' | 'siguiente' | 'posicion'> & {
  tramo: TramoModulo;
};

const rutaEntrada = (vecina: EntradaVecina) => `/diccionario/entrada/${vecina.slug}`;

/** Tarjetas en escritorio; en móvil, dock fijo justo encima de la barra inferior. */
export function NavEntradas({ anterior, siguiente, posicion, tramo }: NavEntradasProps) {
  const esMovil = useEsMovil();
  const { actual, total } = posicion;

  if (esMovil) {
    return (
      <nav
        aria-label="Entradas de la categoría"
        className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-2 border-t border-border bg-background px-3 py-2"
      >
        <Vecina vecina={anterior} direccion="anterior" extremo={`Primera de ${total}`} compacta />
        <span className="shrink-0 text-sm text-muted-foreground">
          {actual} de {total}
        </span>
        <Vecina vecina={siguiente} direccion="siguiente" extremo={`Última de ${total}`} compacta />
      </nav>
    );
  }

  return (
    <nav aria-label="Entradas de la categoría" className="grid gap-4 md:grid-cols-2">
      <Vecina
        vecina={anterior}
        direccion="anterior"
        detalle={`Anterior · ${actual - 1} de ${total}`}
        extremo={`Primera de ${total}`}
        riel={ESTILO_TRAMO[tramo].riel}
      />
      <Vecina
        vecina={siguiente}
        direccion="siguiente"
        detalle={`Siguiente · ${actual + 1} de ${total}`}
        extremo={`Última de ${total}`}
        riel={ESTILO_TRAMO[tramo].riel}
      />
    </nav>
  );
}

function Vecina({
  vecina,
  direccion,
  detalle,
  extremo,
  riel,
  compacta = false,
}: {
  vecina: EntradaVecina | null;
  direccion: 'anterior' | 'siguiente';
  detalle?: string;
  extremo: string;
  riel?: string;
  compacta?: boolean;
}) {
  const derecha = direccion === 'siguiente';
  const Flecha = derecha ? ArrowRight : ArrowLeft;
  const base = cn(
    'flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border',
    compacta ? 'min-h-12 px-3 py-1.5' : 'p-5',
    derecha && 'flex-row-reverse text-right',
    riel,
  );

  if (!vecina) {
    return <p className={cn(base, 'border-dashed text-base text-muted-foreground')}>{extremo}</p>;
  }

  return (
    <Link
      to={rutaEntrada(vecina)}
      className={cn(base, 'bg-card shadow-xs transicion-suave hover:shadow-sm')}
    >
      <Flecha aria-hidden="true" strokeWidth={2} className="size-5 shrink-0 text-primary" />
      <span className="flex min-w-0 flex-col">
        <span className="text-sm text-muted-foreground">
          {detalle ?? (derecha ? 'Siguiente' : 'Anterior')}
        </span>
        <Ingles className="truncate text-lg font-semibold">{vecina.ingles}</Ingles>
        {!compacta && <span className="text-base">{vecina.espanol}</span>}
      </span>
    </Link>
  );
}
