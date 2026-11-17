import { ChevronRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Ingles } from '@/components/dominio/ingles';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRecientes } from '../hooks/use-diccionario';
import { ESTILO_TRAMO } from '../lib/tramos';
import { IconoCategoria } from './icono-categoria';

/** Las últimas entradas abiertas en este dispositivo. Sin entradas, la sección no aparece. */
export function VistoRecientemente() {
  const { recientes, borrar } = useRecientes();
  if (recientes.length === 0) return null;

  return (
    <section aria-labelledby="titulo-recientes" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="titulo-recientes" className="text-xl font-semibold">
          Visto recientemente
        </h2>
        <Button variant="ghost" onClick={borrar} className="h-11 gap-2 px-3 text-base text-primary">
          <RotateCcw aria-hidden="true" strokeWidth={2} className="size-4" />
          Borrar esta lista
        </Button>
      </div>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recientes.map((r) => {
          return (
            <li key={r.slug}>
              <Link
                to={`/diccionario/entrada/${r.slug}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transicion-suave hover:shadow-sm',
                  ESTILO_TRAMO[r.tramo].riel,
                )}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <Ingles className="text-lg font-semibold [overflow-wrap:anywhere]">
                    {r.ingles}
                  </Ingles>
                  <span className="text-base">{r.espanol}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <IconoCategoria nombre={r.icono} className="size-4" />
                    Módulo {r.modulo} · {r.categoria}
                  </span>
                </span>
                <ChevronRight aria-hidden="true" strokeWidth={2} className="size-5 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
