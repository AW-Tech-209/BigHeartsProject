import { Bookmark, DoorOpen, FlaskConical, VolumeX } from 'lucide-react';

import { LogoBigHearts, MarcaBigHearts } from './marca-bighearts';

const PROPUESTAS = [
  { icono: Bookmark, texto: 'Reservas tu cupo y sabes que es tuyo.' },
  { icono: DoorOpen, texto: 'El enlace aparece 30 minutos antes, solo en tu pantalla.' },
  { icono: VolumeX, texto: 'Hecho para no depender del sonido, no adaptado después.' },
];

/**
 * Contenido del panel de identidad de las pantallas de acceso: marca, mensaje,
 * tres propuestas de valor y el sello de entorno. Solo se muestra en escritorio;
 * en móvil, `<LayoutAutenticacion>` deja únicamente la marca.
 */
export function PanelDeMarca() {
  return (
    <>
      <LogoBigHearts className="pointer-events-none absolute -right-20 -bottom-24 z-0 h-96 w-96 text-brand-foreground/[0.06]" />

      <div className="relative z-10 flex flex-1 flex-col justify-between gap-12">
        <MarcaBigHearts />

        <div className="space-y-8">
          <p className="max-w-[15ch] text-4xl font-bold tracking-tight text-balance">
            Tu clase de inglés, en un lugar que sí es tuyo.
          </p>
          <ul className="space-y-5">
            {PROPUESTAS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex gap-3.5">
                <Icono aria-hidden="true" strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
                <span className="max-w-[34ch] leading-relaxed">{texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="flex items-center gap-2 border-t border-brand-foreground/20 pt-6 font-mono text-xs tracking-wide text-brand-foreground/85">
          <FlaskConical aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
          Entorno de pruebas · Fase 1
        </p>
      </div>
    </>
  );
}
