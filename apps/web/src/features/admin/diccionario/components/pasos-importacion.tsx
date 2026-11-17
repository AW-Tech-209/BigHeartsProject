import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

const PASOS = ['Subir archivo', 'Revisar', 'Confirmar'] as const;

/** 1 Subir · 2 Revisar · 3 Confirmar. El actual se dice con texto y `aria-current="step"`. */
export function PasosImportacion({ actual }: { actual: 1 | 2 | 3 | 4 }) {
  return (
    <nav aria-label="Pasos de la importación">
      <ol className="grid gap-3 sm:grid-cols-3">
        {PASOS.map((titulo, i) => {
          const numero = i + 1;
          const hecho = numero < actual;
          const enCurso = numero === actual;
          return (
            <li
              key={titulo}
              aria-current={enCurso ? 'step' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4',
                enCurso
                  ? 'border-2 border-primary bg-primary-soft'
                  : hecho
                    ? 'border-primary/40 bg-card'
                    : 'border-border bg-card',
              )}
            >
              <span
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-full text-base font-semibold',
                  hecho || enCurso
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground',
                )}
              >
                {hecho ? <Check aria-hidden="true" strokeWidth={2.5} className="size-5" /> : numero}
              </span>
              <span className="flex flex-col">
                <span className="text-base font-semibold">{titulo}</span>
                <span className="text-sm text-muted-foreground">
                  {hecho ? 'Hecho' : enCurso ? 'Paso actual' : 'Pendiente'}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
