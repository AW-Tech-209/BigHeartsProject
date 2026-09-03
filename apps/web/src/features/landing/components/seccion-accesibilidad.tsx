import { Clock, Keyboard, Layers, VolumeX, type LucideIcon } from 'lucide-react';

import { Contenedor } from '@/components/layout/contenedor';
import { RotuloSeccion } from './primitivos-landing';

const PUNTOS: { icon: LucideIcon; titulo: string; cuerpo: string }[] = [
  {
    icon: VolumeX,
    titulo: 'Ningún aviso depende del sonido',
    cuerpo:
      'Los avisos duran al menos 8 segundos y siempre traen botón de cerrar. Los críticos no se cierran solos.',
  },
  {
    icon: Layers,
    titulo: 'Color, ícono y texto a la vez',
    cuerpo:
      'Ningún estado se comunica solo con color. Los nueve estados de una clase llevan las tres capas.',
  },
  {
    icon: Keyboard,
    titulo: 'Todo se recorre con teclado',
    cuerpo:
      'Foco visible siempre, modo claro y oscuro, y texto ampliable sin que la pantalla se rompa.',
  },
  {
    icon: Clock,
    titulo: 'Las horas, completas y con zona',
    cuerpo: '«Martes 12 de agosto, 6:00 p. m. (hora de Colombia)». Nunca «12/08 · en 2 días».',
  },
];

export function SeccionAccesibilidad() {
  return (
    <section id="accesibilidad" className="border-b border-border bg-foreground text-background">
      <Contenedor className="py-16 sm:py-24">
        <div className="max-w-[46ch]">
          <RotuloSeccion color="attention" className="text-background/70">
            Accesibilidad
          </RotuloSeccion>
          <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
            Construido para no oír, no <em className="font-normal italic">adaptado después.</em>
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PUNTOS.map(({ icon: Icono, titulo, cuerpo }) => (
            <div key={titulo}>
              <Icono aria-hidden="true" strokeWidth={2} className="size-6 text-attention" />
              <h3 className="mt-4 text-lg font-medium">{titulo}</h3>
              <p className="mt-2 text-base leading-relaxed text-background/80">{cuerpo}</p>
            </div>
          ))}
        </div>
      </Contenedor>
    </section>
  );
}
