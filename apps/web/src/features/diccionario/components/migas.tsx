import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Miga = { texto: string; to?: string };

/** Migas de pan: cada paso vuelve atrás; el último es la página actual. */
export function Migas({ pasos }: { pasos: Miga[] }) {
  return (
    <nav aria-label="Migas de pan">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
        {pasos.map((paso, i) => (
          <li key={paso.texto} className="flex items-center gap-2">
            {i > 0 && (
              <ChevronRight
                aria-hidden="true"
                strokeWidth={2}
                className="size-4 text-muted-foreground"
              />
            )}
            {paso.to ? (
              <Link
                to={paso.to}
                className="inline-flex min-h-11 items-center rounded text-primary underline underline-offset-4"
              >
                {paso.texto}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium">
                {paso.texto}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
