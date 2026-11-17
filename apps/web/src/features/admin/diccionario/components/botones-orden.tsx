import { ArrowDown, ArrowUp } from 'lucide-react';

import { Button } from '@/components/ui/button';

type BotonesOrdenProps = {
  /** Prefijo de los ids de los botones, para devolverles el foco tras mover. */
  idBase: string;
  nombre: string;
  esPrimero: boolean;
  esUltimo: boolean;
  ocupado: boolean;
  onMover: (paso: -1 | 1) => void;
};

/** Reordenar siempre con botones: funciona con teclado y lector. En los extremos dicen por qué no. */
export function BotonesOrden({
  idBase,
  nombre,
  esPrimero,
  esUltimo,
  ocupado,
  onMover,
}: BotonesOrdenProps) {
  return (
    <span className="flex gap-1">
      <Button
        id={`${idBase}-subir`}
        variant="outline"
        aria-disabled={esPrimero || ocupado || undefined}
        className="size-11 aria-disabled:opacity-40"
        onClick={() => !esPrimero && !ocupado && onMover(-1)}
      >
        <ArrowUp aria-hidden="true" strokeWidth={2} className="size-4" />
        <span className="sr-only">
          Subir {nombre}
          {esPrimero ? ' (ya es la primera)' : ''}
        </span>
      </Button>
      <Button
        id={`${idBase}-bajar`}
        variant="outline"
        aria-disabled={esUltimo || ocupado || undefined}
        className="size-11 aria-disabled:opacity-40"
        onClick={() => !esUltimo && !ocupado && onMover(1)}
      >
        <ArrowDown aria-hidden="true" strokeWidth={2} className="size-4" />
        <span className="sr-only">
          Bajar {nombre}
          {esUltimo ? ' (ya es la última)' : ''}
        </span>
      </Button>
    </span>
  );
}
