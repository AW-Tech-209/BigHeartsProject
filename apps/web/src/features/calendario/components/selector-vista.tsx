import { CalendarDays, List } from 'lucide-react';

import { Button } from '@/components/ui/button';

export type Vista = 'lista' | 'semana';

const OPCIONES = [
  { valor: 'lista', texto: 'Lista', Icono: List },
  { valor: 'semana', texto: 'Semana', Icono: CalendarDays },
] as const;

export function SelectorVista({ vista, onChange }: { vista: Vista; onChange: (v: Vista) => void }) {
  return (
    <div role="group" aria-label="Vista" className="flex gap-2">
      {OPCIONES.map(({ valor, texto, Icono }) => (
        <Button
          key={valor}
          variant={vista === valor ? 'default' : 'outline'}
          aria-pressed={vista === valor}
          onClick={() => onChange(valor)}
          className="h-11 gap-2 px-5"
        >
          <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
          {texto}
        </Button>
      ))}
    </div>
  );
}
