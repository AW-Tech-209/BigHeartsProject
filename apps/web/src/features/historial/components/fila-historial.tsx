import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Una fila del historial (`layout-y-composicion.md` §4: fila para listas
 * largas, sin `rounded-xl`). El chip de la izquierda es un refuerzo de forma
 * —el mismo ícono que ya lleva el resultado a la derecha—, nunca la única
 * señal: quien la mira sin distinguir el chip todavía tiene el texto.
 */
type FilaHistorialProps = {
  aulaId: string;
  icon: LucideIcon;
  titulo: string;
  subtitulo: string;
  /** El resultado o las cifras de la fila, a la derecha. */
  children: ReactNode;
};

export function FilaHistorial({
  aulaId,
  icon: Icon,
  titulo,
  subtitulo,
  children,
}: FilaHistorialProps) {
  return (
    <li className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0 sm:px-5">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
      >
        <Icon strokeWidth={2} className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-foreground">
          <Link
            to={`/aulas/${aulaId}`}
            className="rounded-sm underline-offset-4 outline-none hover:underline"
          >
            {titulo}
          </Link>
        </p>
        <p className="truncate text-sm text-muted-foreground">{subtitulo}</p>
      </div>

      <div className="shrink-0">{children}</div>
    </li>
  );
}
