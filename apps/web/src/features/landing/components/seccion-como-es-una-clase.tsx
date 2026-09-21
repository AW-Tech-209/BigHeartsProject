import { BookmarkCheck, Clock, PenSquare, Video, type LucideIcon } from 'lucide-react';

import { RotuloSeccion, SeccionLanding } from './primitivos-landing';
import { Revelar } from './revelar';

const PASOS: { icon: LucideIcon; titulo: string; cuerpo: string }[] = [
  {
    icon: PenSquare,
    titulo: 'El profesor crea el aula',
    cuerpo: 'Con horario, cupo y su propio enlace de videollamada.',
  },
  {
    icon: BookmarkCheck,
    titulo: 'Tú reservas',
    cuerpo: 'Tu cupo queda confirmado al instante, o no queda.',
  },
  {
    icon: Clock,
    titulo: 'El enlace aparece 30 minutos antes',
    cuerpo: 'Solo en tu pantalla, solo si reservaste.',
  },
  {
    icon: Video,
    titulo: 'La clase ocurre en Zoom, Meet o Teams',
    cuerpo: 'BigHearts no aloja la videollamada: gestiona el acceso a ella.',
  },
];

export function SeccionComoEsUnaClase() {
  return (
    <SeccionLanding id="como-es-una-clase" fondo="muted">
      <Revelar className="max-w-[42ch]">
        <RotuloSeccion>Cómo es una clase</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          Cuatro pasos, y sabes exactamente dónde vas a estar.
        </h2>
      </Revelar>

      <Revelar retraso={80} className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PASOS.map(({ icon: Icono, titulo, cuerpo }) => (
          <article key={titulo} className="rounded-xl border border-border bg-card p-6">
            <Icono aria-hidden="true" strokeWidth={2} className="size-6 text-primary" />
            <h3 className="mt-3.5 text-lg font-medium tracking-tight">{titulo}</h3>
            <p className="mt-2 text-base text-muted-foreground">{cuerpo}</p>
          </article>
        ))}
      </Revelar>
    </SeccionLanding>
  );
}
