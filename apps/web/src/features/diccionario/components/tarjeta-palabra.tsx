import type { EntradaResumen, TramoModulo } from '@academia/types';
import { Clapperboard, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Ingles } from '@/components/dominio/ingles';
import { cn } from '@/lib/utils';
import { etiquetaUnidadCorta } from '../lib/filtros-url';
import { ESTILO_TRAMO } from '../lib/tramos';
import { ChipTipo } from './chip-tipo';

type TarjetaPalabraProps = {
  entrada: EntradaResumen;
  tramo: TramoModulo;
};

/**
 * Vertical en escritorio, horizontal en móvil. La miniatura es una imagen estática:
 * el video solo se reproduce en la entrada, cuando la persona lo pide.
 */
export function TarjetaPalabra({ entrada, tramo }: TarjetaPalabraProps) {
  const lista = entrada.sena.estado === 'lista';

  return (
    <Link
      to={`/diccionario/entrada/${entrada.slug}`}
      className={cn(
        'flex h-full overflow-hidden rounded-xl border border-border bg-card shadow-xs transicion-suave hover:shadow-sm lg:flex-col',
        ESTILO_TRAMO[tramo].riel,
      )}
    >
      <span
        className={cn(
          'relative flex w-28 shrink-0 items-center justify-center border-r border-border sm:w-36 lg:aspect-video lg:w-full lg:border-r-0 lg:border-b',
          lista
            ? 'bg-muted'
            : 'bg-[repeating-linear-gradient(135deg,var(--muted)_0_12px,var(--background)_12px_24px)]',
        )}
      >
        {lista && entrada.sena.miniaturaUrl && (
          <img
            src={entrada.sena.miniaturaUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        {lista ? (
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium shadow-xs">
            <Play aria-hidden="true" strokeWidth={2} className="size-4" />
            <span className="sr-only lg:not-sr-only">Ver la seña</span>
          </span>
        ) : (
          <span className="relative mx-2 inline-flex flex-col items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-center text-sm text-muted-foreground">
            <Clapperboard aria-hidden="true" strokeWidth={2} className="size-4" />
            Seña en preparación
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-4">
        <Ingles className="text-lg font-semibold [overflow-wrap:anywhere]">{entrada.ingles}</Ingles>
        <span className="text-base [overflow-wrap:anywhere]">{entrada.espanol}</span>
        <span className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <ChipTipo tipo={entrada.tipo} />
          {entrada.unidad && (
            <span className="text-sm text-muted-foreground">
              {etiquetaUnidadCorta(entrada.unidad)}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
