import type { ResultadoBusqueda } from '@academia/types';

import { Ingles } from '@/components/dominio/ingles';
import { InsigniaTramo } from './insignia-tramo';
import { IconoCategoria } from './icono-categoria';
import { Resaltado } from './resaltado';

/** Contenido de una sugerencia o de un resultado: inglés, español, módulo y categoría. */
export function SugerenciaBusqueda({
  resultado,
  busqueda,
}: {
  resultado: ResultadoBusqueda;
  busqueda: string;
}) {
  return (
    <span className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <span className="flex min-w-0 flex-col">
        <Ingles className="text-lg font-medium [overflow-wrap:anywhere]">
          <Resaltado texto={resultado.ingles} busqueda={busqueda} />
        </Ingles>
        <span className="text-base text-muted-foreground">
          <Resaltado texto={resultado.espanol} busqueda={busqueda} />
        </span>
      </span>
      <span className="flex shrink-0 flex-wrap items-center gap-3">
        <InsigniaTramo tramo={resultado.modulo.tramo} texto={`Módulo ${resultado.modulo.numero}`} />
        <span className="inline-flex items-center gap-1.5 text-base text-muted-foreground">
          <IconoCategoria nombre={resultado.categoria.icono} className="size-4" />
          {resultado.categoria.nombre}
        </span>
      </span>
    </span>
  );
}
