import { Clapperboard, Hand } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

/** Sin video todavía: es lo normal durante meses, así que se explica en vez de dejar un hueco. */
export function SenaEnGrabacion({ categoria, to }: { categoria: string; to: string }) {
  return (
    <div className="flex flex-col items-start justify-center gap-4 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/60 p-6 sm:min-h-80 sm:p-10">
      <span className="flex size-14 items-center justify-center rounded-full border border-border bg-background">
        <Clapperboard aria-hidden="true" strokeWidth={2} className="size-6" />
      </span>
      <p className="font-serif text-2xl text-balance">La seña de esta palabra se está grabando</p>
      <p className="max-w-[50ch] text-base">
        El equipo sube las señas poco a poco. El resto de la ficha ya está completo.
      </p>
      <Button render={<Link to={to} />} variant="outline" className="h-11 gap-2 px-4 text-base">
        <Hand aria-hidden="true" strokeWidth={2} className="size-4" />
        Ver palabras de {categoria} con seña
      </Button>
    </div>
  );
}
