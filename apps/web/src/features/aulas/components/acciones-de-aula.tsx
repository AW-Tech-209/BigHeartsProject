import { ClassroomStatus, type ClassroomDetail } from '@academia/types';
import { Ban, Copy, LoaderCircle, Pencil } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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
import { useCancelClassroom } from '@/features/aulas/hooks/use-cancel-classroom';
import { esAulaEditable } from '@/features/aulas/lib/editabilidad-aula';
import { ApiClientError } from '@/lib/api-error';

type AulaGestionable = Pick<
  ClassroomDetail,
  'id' | 'title' | 'status' | 'scheduledAt' | 'currentBookings'
>;

type AccionesDeAulaProps = {
  aula: AulaGestionable;
  /** `true` si quien mira es el profesor dueño del aula. */
  esDueno: boolean;
  /** Reduce el ancho de los controles cuando viven dentro de una tarjeta. */
  compact?: boolean;
};

/**
 * Las acciones de gestión del aula: `Editar clase`, `Cancelar clase` (HU-202)
 * y `Duplicar clase` (HU-213). Solo para el dueño. Editar y cancelar exigen
 * que el aula siga siendo editable — sobre una ya cancelada no queda nada que
 * gestionar (AC4), y una que ya empezó explica por qué no se puede tocar
 * (T11). Duplicar no tiene esa restricción: la clase de la semana pasada, ya
 * finalizada o cancelada, es justo la que el profesor quiere volver a usar.
 *
 * `compact` (la tarjeta del listado) nunca ofrece Duplicar: multiplicarla por
 * cada tarjeta rompería la regla de una acción primaria por pantalla.
 */
export function AccionesDeAula({ aula, esDueno, compact = false }: AccionesDeAulaProps) {
  if (!esDueno) {
    return null;
  }

  const cancelada = aula.status === ClassroomStatus.CANCELLED;
  const editable = !cancelada && esAulaEditable(aula);

  if (compact) {
    if (cancelada) return null;

    if (!editable) {
      return (
        <Callout variant="attention" title="Esta clase ya comenzó">
          <p>Ya no se puede editar ni cancelar.</p>
        </Callout>
      );
    }

    return (
      <div className="relative z-10 flex flex-wrap gap-2">
        <Button
          render={<Link to={`/mis-aulas/${aula.id}/editar`} />}
          variant="outline"
          className="h-11 gap-2 px-3.5"
        >
          <Pencil aria-hidden="true" strokeWidth={2} className="size-4" />
          Editar clase
        </Button>

        <DialogoCancelarAula aula={aula} compact />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!cancelada && !editable && (
        <Callout variant="attention" title="Esta clase ya comenzó">
          <p>Ya no se puede editar ni cancelar.</p>
        </Callout>
      )}

      <div className="flex flex-wrap gap-3">
        {editable && (
          <>
            <Button
              render={<Link to={`/mis-aulas/${aula.id}/editar`} />}
              className="h-11 gap-2 px-5 text-base"
            >
              <Pencil aria-hidden="true" strokeWidth={2} className="size-4" />
              Editar clase
            </Button>

            <DialogoCancelarAula aula={aula} compact={false} />
          </>
        )}

        <Button
          render={<Link to={`/mis-aulas/nueva?desde=${aula.id}`} />}
          variant="outline"
          className="h-11 gap-2 px-5 text-base"
        >
          <Copy aria-hidden="true" strokeWidth={2} className="size-4" />
          Duplicar clase
        </Button>
      </div>
    </div>
  );
}

function DialogoCancelarAula({ aula, compact }: { aula: AulaGestionable; compact: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const volverRef = useRef<HTMLButtonElement>(null);
  const mutation = useCancelClassroom(aula.id);
  const announce = useAnnounce();

  function cancelar() {
    setError(null);
    mutation.mutate(undefined, {
      onSuccess: () => {
        setAbierto(false);
        announce(`Clase cancelada: ${aula.title}.`);
      },
      onError: (err) => {
        setError(
          err instanceof ApiClientError
            ? err.message
            : 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo otra vez.',
        );
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
            className={compact ? 'h-11 gap-2 px-3.5' : 'h-11 gap-2 px-5 text-base'}
          />
        }
      >
        <Ban aria-hidden="true" strokeWidth={2} className="size-4" />
        Cancelar clase
      </AlertDialogTrigger>

      <AlertDialogContent initialFocus={volverRef}>
        <AlertDialogTitle>¿Cancelar «{aula.title}»?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta acción no se puede deshacer. La clase quedará marcada como cancelada y ya no se podrá
          editar.
          {aula.currentBookings > 0 && (
            <>
              {' '}
              {aula.currentBookings === 1
                ? 'Hay 1 estudiante con un cupo reservado: perderá su cupo y se le avisará por correo.'
                : `Hay ${aula.currentBookings} estudiantes con un cupo reservado: perderán su cupo y se les avisará por correo.`}
            </>
          )}
        </AlertDialogDescription>

        {error && (
          <Callout variant="destructive" live="assertive" title="No pudimos cancelar la clase">
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
              'Cancelar la clase'
            )}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
