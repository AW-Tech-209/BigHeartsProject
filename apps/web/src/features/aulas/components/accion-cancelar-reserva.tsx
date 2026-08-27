import {
  BookingStatus,
  CANCELLATION_WINDOW_MINUTES_DEFAULT,
  type ClassroomListItem,
} from '@academia/types';
import { Ban, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';

import {
  AlertDialog,
  AlertDialogAcciones,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { useAnnounce } from '@/hooks/use-announce';
import { useCancelBooking } from '@/features/aulas/hooks/use-cancel-booking';
import { describirHorario } from '@/features/aulas/lib/horario';
import { mensajeErrorCancelacion } from '@/features/aulas/lib/mensaje-error-cancelacion';

type AulaConReserva = Pick<
  ClassroomListItem,
  'id' | 'title' | 'scheduledAt' | 'myBookingId' | 'myBookingStatus' | 'myBookingCancelable'
>;

/**
 * La hora límite para cancelar, calculada solo para PINTAR (T7): la decisión
 * de verdad la toma el servidor al recibir `POST /bookings/:id/cancelar`
 * (`myBookingCancelable` ya viene resuelto desde ahí). Usa el valor de
 * fábrica de `CANCELLATION_WINDOW_MINUTES` porque la respuesta no manda el
 * real —a diferencia de `CLASSROOM_LEAD_TIME_WARNING`, aquí no hace falta:
 * un error de un minuto en el texto no bloquea nada, solo lo redactaría.
 */
function horaLimite(scheduledAt: string): string {
  const limite = new Date(
    new Date(scheduledAt).getTime() - CANCELLATION_WINDOW_MINUTES_DEFAULT * 60_000,
  );
  return describirHorario(limite.toISOString());
}

/**
 * `Cancelar reserva` (HU-303). Vive en «Mis reservas» y en el detalle: los
 * dos reciben `myBookingId`/`myBookingCancelable` ya resueltos por el
 * servidor; el catálogo general no los trae (siempre `null`), así que ahí
 * este componente no pinta nada — no hace falta una prop de pantalla.
 *
 * **Sin optimismo** (CLAUDE.md, regla 10): el estado solo cambia cuando
 * `useCancelBooking` resuelve.
 */
export function AccionCancelarReserva({
  aula,
  compact = false,
}: {
  aula: AulaConReserva;
  compact?: boolean;
}) {
  if (aula.myBookingStatus !== BookingStatus.CONFIRMED || !aula.myBookingId) {
    return null;
  }

  if (!aula.myBookingCancelable) {
    return (
      <Callout variant="attention" title="Ya no se puede cancelar">
        <p>
          Se podía cancelar hasta {horaLimite(aula.scheduledAt)}. Pasado ese momento, la reserva
          queda firme.
        </p>
      </Callout>
    );
  }

  return <DialogoCancelarReserva aula={aula} bookingId={aula.myBookingId} compact={compact} />;
}

function DialogoCancelarReserva({
  aula,
  bookingId,
  compact,
}: {
  aula: AulaConReserva;
  bookingId: string;
  compact: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const volverRef = useRef<HTMLButtonElement>(null);
  const mutation = useCancelBooking(bookingId, aula.id);
  const announce = useAnnounce();

  function cancelar() {
    setError(null);
    mutation.mutate(undefined, {
      onSuccess: () => {
        setAbierto(false);
        announce(`Reserva cancelada: ${aula.title}.`);
      },
      onError: (err) => {
        setError(mensajeErrorCancelacion(err));
      },
    });
  }

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(siguiente) => {
        if (!mutation.isPending) setAbierto(siguiente);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="destructive"
            className={
              compact
                ? 'h-11 min-w-0 w-full gap-2 px-2 text-base whitespace-nowrap'
                : 'h-11 w-full gap-2 px-5 text-base'
            }
          />
        }
      >
        <Ban aria-hidden="true" strokeWidth={2} className="size-4" />
        Cancelar reserva
      </AlertDialogTrigger>

      <AlertDialogContent initialFocus={volverRef}>
        <AlertDialogTitle>¿Cancelar tu reserva en «{aula.title}»?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer. Liberarás tu cupo y otro estudiante podrá tomarlo.
        </AlertDialogDescription>

        {error && (
          <Callout variant="destructive" live="assertive" title="No pudimos cancelar tu reserva">
            <p>{error}</p>
          </Callout>
        )}

        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={volverRef} className="h-11 px-5 text-base" />}
            disabled={mutation.isPending}
          >
            Volver
          </AlertDialogClose>

          <Button
            variant="destructive"
            onClick={cancelar}
            disabled={mutation.isPending}
            className="h-11 gap-2 px-5 text-base"
          >
            {mutation.isPending ? (
              <>
                <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
                Cancelando…
              </>
            ) : (
              'Cancelar la reserva'
            )}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
