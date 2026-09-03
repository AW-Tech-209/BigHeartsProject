import { CircleCheck, CircleX, MessageSquare } from 'lucide-react';

import { MarcaBigHearts } from '@/components/dominio/marca-bighearts';
import { cn } from '@/lib/utils';
import { RotuloSeccion, SeccionLanding } from './primitivos-landing';
import { Revelar } from './revelar';

const CON_WHATSAPP = [
  'El enlace circula libre; entra quien lo tenga.',
  'El profesor no sabe cuántos vendrán.',
  'No queda registro de quién asistió.',
  'El estudiante depende de revisar el chat.',
  'Las herramientas asumen que el usuario oye.',
];

const CON_BIGHEARTS = [
  'Solo entra quien reservó, y solo 30 minutos antes.',
  'El profesor ve su lista de inscritos antes de la clase.',
  'Cada clase deja historial para estudiante y profesor.',
  'Recibe confirmación y recordatorios por correo.',
  'Toda la experiencia es visual, clara y accesible.',
];

export function SeccionProblema() {
  return (
    <SeccionLanding id="problema">
      <Revelar className="max-w-[40ch]">
        <RotuloSeccion color="neutral">Por qué existe</RotuloSeccion>
        <h2 className="mt-5 text-3xl font-medium tracking-tight text-balance">
          Hoy la academia no es un lugar. Es un grupo de chat.
        </h2>
        <p className="mt-5 text-lg text-muted-foreground text-pretty">
          El profesor crea la reunión y reparte el enlace. Todo lo demás queda sin resolver.
        </p>
      </Revelar>

      <Revelar retraso={80} className="mt-12 grid gap-5 md:grid-cols-2">
        <Columna
          titulo="Hoy, con WhatsApp"
          icono={MessageSquare}
          items={CON_WHATSAPP}
          iconoItem={CircleX}
          tono="neutral"
        />
        <Columna
          titulo="Con BigHearts"
          marca
          items={CON_BIGHEARTS}
          iconoItem={CircleCheck}
          tono="bien"
        />
      </Revelar>

      <Revelar retraso={120}>
        <blockquote className="mt-12 max-w-[60ch] border-l-4 border-attention pl-7">
          <p className="font-serif text-2xl leading-snug text-pretty sm:text-3xl">
            El estudiante no solo enfrenta la dificultad de aprender inglés: enfrenta además la
            fricción de usar herramientas que no fueron pensadas para él.
          </p>
          <p className="mt-4 text-base text-muted-foreground">
            BigHearts existe para eliminar esa segunda barrera.
          </p>
        </blockquote>
      </Revelar>
    </SeccionLanding>
  );
}

type ColumnaProps = {
  titulo: string;
  items: string[];
  iconoItem: typeof CircleX;
  tono: 'neutral' | 'bien';
  icono?: typeof MessageSquare;
  marca?: boolean;
};

function Columna({ titulo, items, iconoItem: IconoItem, tono, icono: Icono, marca }: ColumnaProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border p-6 pl-7',
        tono === 'bien' ? 'bg-card' : 'bg-muted',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          tono === 'bien' ? 'bg-primary' : 'bg-muted-foreground',
        )}
      />
      <h3
        className={cn(
          'flex items-center gap-2.5 text-base font-semibold',
          tono === 'bien' ? 'text-primary' : 'text-muted-foreground',
        )}
      >
        {marca ? (
          <MarcaBigHearts className="size-5 text-primary" />
        ) : (
          Icono && <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
        )}
        {titulo}
      </h3>
      <ul className="mt-5 grid gap-3.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-base leading-snug">
            <IconoItem
              aria-hidden="true"
              strokeWidth={2}
              className={cn(
                'mt-0.5 size-5 shrink-0',
                tono === 'bien' ? 'text-success' : 'text-muted-foreground',
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
