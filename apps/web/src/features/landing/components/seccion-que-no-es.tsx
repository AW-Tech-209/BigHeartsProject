import { Captions, Smartphone, Speaker, type LucideIcon } from 'lucide-react';

import { RotuloSeccion, SeccionLanding } from './primitivos-landing';
import { Revelar } from './revelar';

const PUNTOS: { icon: LucideIcon; texto: string }[] = [
  { icon: Captions, texto: 'No hay lecciones grabadas. Enseña un profesor, en vivo.' },
  { icon: Speaker, texto: 'No hay ejercicios de pronunciación ni de audio.' },
  { icon: Smartphone, texto: 'No hay aplicación móvil. La web funciona en tu navegador.' },
];

export function SeccionQueNoEs() {
  return (
    <SeccionLanding id="que-no-es" fondo="muted">
      <Revelar className="max-w-[42ch]">
        <RotuloSeccion color="neutral">Para que quede claro</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          Qué no es BigHearts.
        </h2>
      </Revelar>

      <Revelar retraso={80} className="mt-9 grid gap-4 sm:grid-cols-3">
        {PUNTOS.map(({ icon: Icono, texto }) => (
          <p key={texto} className="flex items-start gap-3 text-base text-muted-foreground">
            <Icono aria-hidden="true" strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
            <span>{texto}</span>
          </p>
        ))}
      </Revelar>
    </SeccionLanding>
  );
}
