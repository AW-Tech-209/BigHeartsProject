import type { TramoModulo } from '@academia/types';
import { BookOpenCheck, Clock } from 'lucide-react';
import { useId } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ESTILO_TRAMO } from '../lib/tramos';

/** La práctica todavía no existe: el botón se ve, no hace nada y dice por qué. */
export function TarjetaPracticar({ categoria, tramo }: { categoria: string; tramo: TramoModulo }) {
  const idMotivo = useId();

  return (
    <section
      aria-label={`Practicar ${categoria}`}
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/60 p-5 sm:flex-row sm:items-center',
        ESTILO_TRAMO[tramo].riel,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-background">
        <BookOpenCheck
          aria-hidden="true"
          strokeWidth={2}
          className="size-5 text-muted-foreground"
        />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          Practicar {categoria}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-muted-foreground/50 px-2.5 py-0.5 text-sm font-normal text-muted-foreground">
            <Clock aria-hidden="true" strokeWidth={2} className="size-4" />
            Próximamente
          </span>
        </p>
        <p id={idMotivo} className="text-base text-muted-foreground">
          Verás la seña y adivinarás la palabra. Llegará en una próxima versión.
        </p>
      </div>
      <Button
        variant="outline"
        aria-disabled="true"
        aria-describedby={idMotivo}
        onClick={(evento) => evento.preventDefault()}
        className="h-11 cursor-not-allowed self-start px-4 text-base text-muted-foreground sm:self-center"
      >
        Practicar {categoria}
      </Button>
    </section>
  );
}
