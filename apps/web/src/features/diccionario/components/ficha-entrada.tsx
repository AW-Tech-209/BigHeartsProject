import { type EntradaDetalleResponse, TRAMO_MODULO_LABELS } from '@academia/types';
import { StickyNote } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PaginaCabecera } from '@/components/layout/pagina-cabecera';
import { cn } from '@/lib/utils';
import { nombreUnidad } from '../lib/filtros-url';
import { ESTILO_TRAMO } from '../lib/tramos';
import { ChipTipo } from './chip-tipo';
import { EstadoSena } from './estado-sena';
import { IconoCategoria } from './icono-categoria';
import { InsigniaTramo } from './insignia-tramo';

/** El inglés es el `<h1>`: al cambiar de entrada recibe el foco y fija el título del documento. */
export function FichaEntrada({ entrada }: { entrada: EntradaDetalleResponse }) {
  const { modulo, categoria } = entrada;
  const moduloYUnidad = [
    `Módulo ${modulo.numero} · ${TRAMO_MODULO_LABELS[modulo.tramo]}`,
    entrada.unidad && nombreUnidad(entrada.unidad),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      className={cn(
        'space-y-6 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-7',
        ESTILO_TRAMO[modulo.tramo].riel,
      )}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <InsigniaTramo tramo={modulo.tramo} modulo={modulo.numero} />
          <ChipTipo tipo={entrada.tipo} />
        </div>
        <div lang="en" className="[overflow-wrap:anywhere]">
          <PaginaCabecera
            titulo={entrada.ingles}
            tituloDocumento={`${entrada.ingles} · ${categoria.nombre} · Diccionario`}
          />
        </div>
        <p className="text-2xl font-medium [overflow-wrap:anywhere]">{entrada.espanol}</p>
      </div>

      <dl className="space-y-4 border-t border-border pt-5">
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">Módulo y unidad</dt>
          <dd className="text-base">{moduloYUnidad}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">Categoría</dt>
          <dd>
            <Link
              to={`/diccionario/modulo/${modulo.numero}/${categoria.slug}`}
              className="inline-flex min-h-11 items-center gap-2 text-lg font-medium text-primary underline underline-offset-4"
            >
              <IconoCategoria nombre={categoria.icono} className="size-4" />
              {categoria.nombre}
            </Link>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm text-muted-foreground">Seña en LSC</dt>
          <dd>
            <EstadoSena vista="estudiante" estado={entrada.sena.estado} />
          </dd>
        </div>
      </dl>

      {entrada.imagenUrl && (
        <img
          src={entrada.imagenUrl}
          alt={`Imagen del concepto: ${entrada.ingles}`}
          className="w-full rounded-xl border border-border object-cover"
        />
      )}

      {entrada.nota && (
        <div className="space-y-1 rounded-xl border border-border bg-muted/60 p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <StickyNote aria-hidden="true" strokeWidth={2} className="size-4" />
            Nota del profesor
          </p>
          <p className="text-base">{entrada.nota}</p>
        </div>
      )}
    </article>
  );
}
