import { BookmarkCheck, CalendarX, Lock, RotateCcw, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { RotuloSeccion, SeccionLanding } from './primitivos-landing';

const REGLAS: {
  icon: LucideIcon;
  riel: string;
  colorIcono: string;
  titulo: string;
  cuerpo: string;
}[] = [
  {
    icon: BookmarkCheck,
    riel: 'bg-primary',
    colorIcono: 'text-primary',
    titulo: 'Tu cupo es tuyo',
    cuerpo:
      'Si dos personas piden el último lugar a la vez, solo una lo obtiene. Nunca hay más reservas que sillas.',
  },
  {
    icon: Lock,
    riel: 'bg-attention',
    colorIcono: 'text-attention-soft-foreground',
    titulo: 'El enlace no circula',
    cuerpo: 'Se guarda cifrado y solo lo ve quien reservó, 30 minutos antes de empezar.',
  },
  {
    icon: RotateCcw,
    riel: 'bg-success',
    colorIcono: 'text-success',
    titulo: 'Si no puedes ir, avisas',
    cuerpo: 'Cancelas hasta una hora antes y tu lugar queda libre para alguien más, de inmediato.',
  },
  {
    icon: CalendarX,
    riel: 'bg-muted-foreground',
    colorIcono: 'text-muted-foreground',
    titulo: 'Sin clases solapadas',
    cuerpo:
      'No puedes reservar dos clases a la misma hora. Tu historial refleja lo que de verdad pudo pasar.',
  },
];

export function SeccionReglas() {
  return (
    <SeccionLanding id="reglas" fondo="muted">
      <div className="max-w-[38ch]">
        <RotuloSeccion>Cuatro reglas</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          Lo que hace distinta a la plataforma.
        </h2>
      </div>

      <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REGLAS.map(({ icon: Icono, riel, colorIcono, titulo, cuerpo }) => (
          <article
            key={titulo}
            className="relative overflow-hidden rounded-xl border border-border bg-card p-6 pl-7"
          >
            <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-1', riel)} />
            <Icono aria-hidden="true" strokeWidth={2} className={cn('size-6', colorIcono)} />
            <h3 className="mt-3.5 text-xl font-medium tracking-tight">{titulo}</h3>
            <p className="mt-2 text-base text-muted-foreground">{cuerpo}</p>
          </article>
        ))}
      </div>
    </SeccionLanding>
  );
}
