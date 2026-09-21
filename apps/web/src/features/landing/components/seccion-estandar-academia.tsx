import {
  CLASSROOM_SUPPORT_LABELS,
  ClassroomSupport,
  INSTRUCTION_MODE_LABELS,
  InstructionMode,
} from '@academia/types';
import { Hand, Users, type LucideIcon } from 'lucide-react';

import { RotuloSeccion, SeccionLanding } from './primitivos-landing';
import { Revelar } from './revelar';

const MODOS: { icon: LucideIcon; modo: InstructionMode }[] = [
  { icon: Hand, modo: InstructionMode.LSC_NATIVA },
  { icon: Users, modo: InstructionMode.INTERPRETE_LSC },
];

const APOYOS = Object.values(ClassroomSupport)
  .map((apoyo) => CLASSROOM_SUPPORT_LABELS[apoyo])
  .join(', ');

export function SeccionEstandarAcademia() {
  return (
    <SeccionLanding id="estandar" fondo="tinta">
      <Revelar className="max-w-[52ch]">
        <RotuloSeccion color="attention" className="text-background/70">
          El estándar de la academia
        </RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Toda clase se imparte en{' '}
          <em className="font-serif text-[1.06em] font-normal italic">
            Lengua de Señas Colombiana (LSC)
          </em>
          , o con intérprete de LSC.
        </h2>
        <p className="mt-5 max-w-[56ch] text-lg text-background/80 text-pretty">
          No es un caso especial ni una opción entre varias: es cómo se imparte cualquier clase de
          BigHearts, siempre.
        </p>
      </Revelar>

      <Revelar retraso={80} className="mt-11 grid gap-4 sm:grid-cols-2">
        {MODOS.map(({ icon: Icono, modo }) => (
          <div key={modo} className="rounded-xl border border-background/15 bg-background/5 p-6">
            <Icono aria-hidden="true" strokeWidth={2} className="size-6 text-attention" />
            <h3 className="mt-3.5 text-lg font-medium">{INSTRUCTION_MODE_LABELS[modo]}</h3>
          </div>
        ))}
      </Revelar>

      <Revelar retraso={120}>
        <p className="mt-8 max-w-[60ch] text-base text-background/80 text-pretty">
          Cada profesor declara, clase por clase, cuál de los dos imparte — y qué apoyos añade:{' '}
          {APOYOS}. Son añadidura, nunca un reemplazo de la lengua de señas.
        </p>
      </Revelar>
    </SeccionLanding>
  );
}
