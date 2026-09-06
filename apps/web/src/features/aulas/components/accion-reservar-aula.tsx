import { type ReactNode } from 'react';
import { type Classroom, type EstadoAula } from '@academia/types';
import { BookmarkCheck, BookmarkPlus, LoaderCircle, type LucideIcon, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAnnounce } from '@/hooks/use-announce';
import { useCreateBooking } from '@/features/aulas/hooks/use-create-booking';
import { mensajeErrorReserva } from '@/features/aulas/lib/mensaje-error-reserva';

/**
 * Los únicos estados donde tiene sentido ofrecer reservar. `derivarEstadoAula()`
 * ya resolvió cupo, cancelación y si ya empezó — repetir esas condiciones aquí
 * sería la misma lógica en dos sitios, y `estado-aula.ts` es la única fuente
 * (`ARQUITECTURA.md` §7.3, mismo criterio que `revelarElEnlace()` en el backend).
 */
const ESTADOS_RESERVABLES: readonly EstadoAula[] = ['disponible', 'ultimos-cupos'];

/**
 * Los estados donde NO se ofrece reservar, pero sí se explica por qué: un
 * botón inhabilitado con ícono + texto propios, en vez de desaparecer sin más
 * o esconderse detrás solo del badge `<EstadoAula>` de la ficha. Cada uno dice
 * una razón distinta — «ya la tienes» no es lo mismo que «no queda sitio», y
 * confundirlas le haría pensar al estudiante que puede liberar su propio cupo
 * reservando otra vez.
 */
const RAZON_NO_RESERVABLE: Partial<Record<EstadoAula, { icon: LucideIcon; texto: string }>> = {
  reservada: { icon: BookmarkCheck, texto: 'Cupo reservado' },
  'acceso-abierto': { icon: BookmarkCheck, texto: 'Cupo reservado' },
  llena: { icon: Users, texto: 'Sin cupos disponibles' },
};

type AccionReservarAulaProps = {
  aula: Pick<Classroom, 'id' | 'title'>;
  /** Lo que decidió `puedeReservar()`. Ya resuelto: aquí no se vuelve a razonar sobre el rol. */
  puedeReservar: boolean;
  /** El estado ya derivado por quien monta este componente. */
  estado: EstadoAula;
};

/**
 * La lógica de `Reservar mi cupo` (HU-301), partida en `boton` y `aviso` para
 * que el renglón de aula (`<TarjetaAula>`) coloque el botón en su columna de
 * acción y el error en la banda al pie. `<AccionReservarAula>` los recompone en
 * el mismo bloque que siempre para el detalle del aula.
 *
 * **Sin optimismo** (CLAUDE.md, regla 10): no hay nada que pintar como
 * "reservado" hasta que `useCreateBooking` resuelve. Mientras tanto el botón
 * solo se deshabilita.
 */
export function useAccionReservarAula({ aula, puedeReservar, estado }: AccionReservarAulaProps): {
  boton: ReactNode | null;
  aviso: ReactNode | null;
} {
  const mutation = useCreateBooking(aula.id);
  const announce = useAnnounce();

  if (!puedeReservar) {
    return { boton: null, aviso: null };
  }

  const razon = RAZON_NO_RESERVABLE[estado];
  if (razon) {
    return {
      boton: (
        <Button disabled variant="outline" className="h-11 w-full gap-2 px-5 text-base">
          <razon.icon aria-hidden="true" strokeWidth={2} className="size-4" />
          {razon.texto}
        </Button>
      ),
      aviso: null,
    };
  }

  if (!ESTADOS_RESERVABLES.includes(estado)) {
    return { boton: null, aviso: null };
  }

  function reservar() {
    mutation.mutate(undefined, {
      onSuccess: () => announce(`Reservaste tu cupo en «${aula.title}».`),
    });
  }

  return {
    boton: (
      <Button
        onClick={reservar}
        disabled={mutation.isPending}
        className="h-11 w-full gap-2 px-5 text-base"
      >
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
            Reservando…
          </>
        ) : (
          <>
            <BookmarkPlus aria-hidden="true" strokeWidth={2} className="size-4" />
            Reservar mi cupo
          </>
        )}
      </Button>
    ),
    aviso: mutation.isError ? (
      <Callout variant="destructive" live="assertive" title="No pudimos reservar tu cupo">
        <p>{mensajeErrorReserva(mutation.error)}</p>
      </Callout>
    ) : null,
  };
}

/**
 * `Reservar mi cupo` (HU-301) para el detalle del aula (T7): el botón y su
 * error en un solo bloque. El renglón del catálogo usa `useAccionReservarAula`
 * directamente para repartirlos.
 */
export function AccionReservarAula(props: AccionReservarAulaProps) {
  const { boton, aviso } = useAccionReservarAula(props);

  if (!boton && !aviso) {
    return null;
  }

  return (
    <div className="relative z-10 space-y-3">
      {aviso}
      {boton}
    </div>
  );
}
