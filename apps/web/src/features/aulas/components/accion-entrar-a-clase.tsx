import { type ReactNode } from 'react';
import type { ClassroomListItem } from '@academia/types';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAccesoAlEnlace } from '@/features/aulas/hooks/use-acceso-al-enlace';
import { describirHorario } from '@/features/aulas/lib/horario';

type AulaConAcceso = Pick<ClassroomListItem, 'id' | 'accessState' | 'accessOpensAt'>;

/**
 * «Cuándo se abrirá» / «Entrar a la clase» (HU-304, T6), partido en `boton` y
 * `aviso` para el renglón de aula: el enlace va en la columna de acción, la
 * cuenta atrás en la banda al pie.
 *
 * La tarjeta nunca trae el enlace real —solo el detalle lo revela (§4.8, regla
 * 2)—, así que «entrar» aquí navega al detalle, donde está la URL de verdad.
 * `sin-acceso` no pinta nada: sin reserva, ni cuenta atrás ni botón.
 */
export function useAccionEntrarAClase({ aula }: { aula: AulaConAcceso }): {
  boton: ReactNode | null;
  aviso: ReactNode | null;
} {
  const estado = useAccesoAlEnlace(aula.accessState, aula.accessOpensAt);

  if (estado === 'sin-acceso') {
    return { boton: null, aviso: null };
  }

  if (estado === 'aun-no') {
    return {
      boton: null,
      aviso: aula.accessOpensAt ? (
        <p className="text-[13px] text-muted-foreground">
          Podrás entrar el {describirHorario(aula.accessOpensAt)}.
        </p>
      ) : null,
    };
  }

  return {
    boton: (
      <Link
        to={`/aulas/${aula.id}`}
        className="relative z-10 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
      >
        <ExternalLink aria-hidden="true" strokeWidth={2} className="size-4" />
        Entrar a la clase
      </Link>
    ),
    aviso: null,
  };
}

export function AccionEntrarAClase({ aula }: { aula: AulaConAcceso }) {
  const { boton, aviso } = useAccionEntrarAClase({ aula });

  if (!boton && !aviso) {
    return null;
  }

  return (
    <div className="mt-1">
      {boton}
      {aviso}
    </div>
  );
}
