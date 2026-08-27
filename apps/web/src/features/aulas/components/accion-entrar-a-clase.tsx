import type { ClassroomListItem } from '@academia/types';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAccesoAlEnlace } from '@/features/aulas/hooks/use-acceso-al-enlace';
import { describirHorario } from '@/features/aulas/lib/horario';

type AulaConAcceso = Pick<ClassroomListItem, 'id' | 'accessState' | 'accessOpensAt'>;

/**
 * «Cuándo se abrirá» / «Entrar a la clase» en una tarjeta (HU-304, T6).
 *
 * La tarjeta nunca trae el enlace real —solo el detalle lo revela (§4.8,
 * regla 2)—, así que «entrar» aquí navega al detalle, donde está la URL de
 * verdad. `sin-acceso` no pinta nada: sin reserva, ni cuenta atrás ni botón.
 */
export function AccionEntrarAClase({ aula }: { aula: AulaConAcceso }) {
  const estado = useAccesoAlEnlace(aula.accessState, aula.accessOpensAt);

  if (estado === 'sin-acceso') {
    return null;
  }

  if (estado === 'aun-no') {
    return aula.accessOpensAt ? (
      <p className="mt-1 text-[13px] text-muted-foreground">
        Podrás entrar el {describirHorario(aula.accessOpensAt)}.
      </p>
    ) : null;
  }

  return (
    <Link
      to={`/aulas/${aula.id}`}
      className="relative z-10 mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
    >
      <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
      Entrar a la clase
    </Link>
  );
}
