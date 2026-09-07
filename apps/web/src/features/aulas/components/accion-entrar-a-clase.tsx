import { type ReactNode } from 'react';
import type { ClassroomListItem } from '@academia/types';
import { DoorOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAccesoAlEnlace } from '@/features/aulas/hooks/use-acceso-al-enlace';
import { describirHorario } from '@/features/aulas/lib/horario';

type AulaConAcceso = Pick<ClassroomListItem, 'id' | 'accessState' | 'accessOpensAt'>;

/**
 * «Cuándo se abrirá» / «Ingresa a la clase» (HU-304, T6), partido en `boton` y
 * `aviso` para el renglón de aula: el botón va en la columna de acción, la
 * cuenta atrás en la banda al pie.
 *
 * La tarjeta nunca trae el enlace real —solo el detalle lo revela (§4.8, regla
 * 2)—, así que «Ingresa a la clase» aquí navega al detalle, donde está la URL
 * de verdad. Va en el amarillo sólido del estado `acceso-abierto` (la regla del
 * sólido: «hay algo que hacer ahora mismo»). `sin-acceso` no pinta nada: sin
 * reserva, ni cuenta atrás ni botón.
 *
 * `forzarEntrada` es para el profesor dueño mirando su clase EN CURSO: no tiene
 * reserva ni ventana de 30 min, pero el botón al detalle (donde está el enlace)
 * le sirve igual que al estudiante.
 */
export function useAccionEntrarAClase({
  aula,
  forzarEntrada = false,
}: {
  aula: AulaConAcceso;
  forzarEntrada?: boolean;
}): {
  boton: ReactNode | null;
  aviso: ReactNode | null;
} {
  const estado = useAccesoAlEnlace(aula.accessState, aula.accessOpensAt);

  if (!forzarEntrada && estado === 'sin-acceso') {
    return { boton: null, aviso: null };
  }

  if (!forzarEntrada && estado === 'aun-no') {
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
      <Button
        render={<Link to={`/aulas/${aula.id}`} />}
        className="relative z-10 h-11 w-full gap-2 bg-attention px-4 text-base text-attention-foreground hover:bg-attention/90"
      >
        <DoorOpen aria-hidden="true" strokeWidth={2} className="size-4" />
        Ingresa a la clase
      </Button>
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
