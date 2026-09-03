import { BookmarkCheck, DoorOpen, Captions, FlaskConical } from 'lucide-react';

import { MarcaBigHearts } from './marca-bighearts';

const PROPUESTAS = [
  { icono: BookmarkCheck, texto: 'Reservas tu cupo y queda guardado a tu nombre.' },
  {
    icono: DoorOpen,
    texto: 'El enlace de la clase aparece 30 minutos antes, solo en tu pantalla.',
  },
  { icono: Captions, texto: 'Todos los avisos son visuales: nada depende del sonido.' },
];

/**
 * Contenido del panel de identidad de las pantallas de acceso: marca, mensaje,
 * tres propuestas de valor y el sello de entorno. Solo se muestra en escritorio;
 * en móvil, `<LayoutAutenticacion>` deja únicamente la marca.
 */
export function PanelDeMarca() {
  return (
    <>
      <MarcaBigHearts />

      <div className="space-y-8">
        <p className="max-w-[16ch] text-3xl font-medium tracking-tight text-balance">
          Aprende inglés en un espacio pensado para ti.
        </p>
        <ul className="space-y-4">
          {PROPUESTAS.map(({ icono: Icono, texto }) => (
            <li key={texto} className="flex gap-3">
              <Icono aria-hidden="true" strokeWidth={2} className="mt-0.5 size-5 shrink-0" />
              <span className="max-w-[34ch]">{texto}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="flex items-center gap-2 text-sm text-brand-foreground/80">
        <FlaskConical aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
        Entorno de pruebas · Fase 1
      </p>
    </>
  );
}
