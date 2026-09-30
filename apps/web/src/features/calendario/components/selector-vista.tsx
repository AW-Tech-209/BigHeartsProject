import { CalendarDays, List } from 'lucide-react';

import { cn } from '@/lib/utils';

export type Vista = 'lista' | 'semana';

const OPCIONES = [
  { valor: 'lista', texto: 'Lista', Icono: List },
  { valor: 'semana', texto: 'Semana', Icono: CalendarDays },
] as const;

export function SelectorVista({ vista, onChange }: { vista: Vista; onChange: (v: Vista) => void }) {
  return (
    <div
      role="group"
      aria-label="Vista"
      className="inline-flex gap-1 rounded-xl border border-border bg-muted p-1"
    >
      {OPCIONES.map(({ valor, texto, Icono }) => {
        const activa = vista === valor;
        return (
          <button
            key={valor}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(valor)}
            className={cn(
              'transicion-rapida inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium',
              activa
                ? 'border-border bg-card text-foreground shadow-xs'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
            {texto}
          </button>
        );
      })}
    </div>
  );
}
