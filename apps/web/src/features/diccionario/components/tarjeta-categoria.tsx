import type { CategoriaConConteo, TramoModulo } from '@academia/types';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { ESTILO_TRAMO } from '../lib/tramos';
import { IconoCategoria } from './icono-categoria';

type TarjetaCategoriaProps = {
  categoria: CategoriaConConteo;
  tramo: TramoModulo;
  to: string;
};

export function TarjetaCategoria({ categoria, tramo, to }: TarjetaCategoriaProps) {
  return (
    <Link
      to={to}
      className={cn(
        'flex h-full items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transicion-suave hover:shadow-sm',
        ESTILO_TRAMO[tramo].riel,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
        <IconoCategoria nombre={categoria.icono} className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-lg font-semibold [overflow-wrap:anywhere]">{categoria.nombre}</span>
        <span className="text-base text-muted-foreground">
          {categoria.palabras} {categoria.palabras === 1 ? 'palabra' : 'palabras'}
        </span>
      </span>
      <ChevronRight aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
    </Link>
  );
}
