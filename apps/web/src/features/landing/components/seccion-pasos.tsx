import { BookmarkCheck, DoorOpen, Search, type LucideIcon } from 'lucide-react';

import { RotuloSeccion, SeccionLanding } from './primitivos-landing';

const PASOS: { n: string; icon: LucideIcon; titulo: string; cuerpo: string }[] = [
  {
    n: '01',
    icon: Search,
    titulo: 'Encuentras tu clase',
    cuerpo:
      'Filtras por nivel y por fecha. Cada clase dice cuántos cupos quedan y cómo se imparte.',
  },
  {
    n: '02',
    icon: BookmarkCheck,
    titulo: 'Reservas tu cupo',
    cuerpo:
      'Si aparece disponible, es porque lo está. Nunca se reservan más lugares de los que hay.',
  },
  {
    n: '03',
    icon: DoorOpen,
    titulo: 'Entras a la clase',
    cuerpo:
      'El enlace aparece 30 minutos antes, en tu pantalla, sin que tengas que pedírselo a nadie.',
  },
];

export function SeccionPasos() {
  return (
    <SeccionLanding id="pasos" fondo="muted">
      <div className="max-w-[36ch]">
        <RotuloSeccion>Cómo funciona</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          Tres pasos, y ninguno depende de nadie más.
        </h2>
      </div>

      <ol className="mt-12 grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-3">
        {PASOS.map(({ n, icon: Icono, titulo, cuerpo }) => (
          <li
            key={n}
            className="border-b border-border p-7 last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
          >
            <p className="font-mono text-[13px] tracking-widest text-primary">{n}</p>
            <h3 className="mt-4 flex items-center gap-2.5 text-xl font-medium tracking-tight">
              <Icono aria-hidden="true" strokeWidth={2} className="size-5 text-primary" />
              {titulo}
            </h3>
            <p className="mt-2.5 text-base text-muted-foreground">{cuerpo}</p>
          </li>
        ))}
      </ol>
    </SeccionLanding>
  );
}
