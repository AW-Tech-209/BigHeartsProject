import type { User } from '@academia/types';
import { LoaderCircle } from 'lucide-react';
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
import { fullName, resolutionCopy, type TeacherResolution } from '../lib/teacher-resolution';

type ResolveTeacherDialogProps = {
  teacher: User;
  resolution: TeacherResolution;
  /** `true` mientras el servidor decide. Bloquea el diálogo, no lo cierra. */
  isPending: boolean;
  /**
   * Ejecuta la resolución. **Devuelve una promesa que se resuelve cuando el
   * servidor ha contestado, haya ido bien o mal**, porque es lo que le dice al
   * diálogo cuándo cerrarse.
   */
  onConfirm: () => void | Promise<void>;
};

/**
 * El botón de una acción de la fila, con su confirmación.
 *
 * Tres decisiones que vienen del skill y no son negociables:
 *
 *  - **Verbos, nunca Sí/No.** «Sí» solo tiene sentido si recuerdas la pregunta,
 *    y en una lista de doce filas no la recuerdas.
 *  - **El foco inicial va al botón seguro** (`Volver`), no al que confirma. El
 *    error caro aquí es rechazar sin querer a alguien.
 *  - **El diálogo se queda abierto mientras el servidor responde**, mostrando
 *    «Rechazando al profesor…». Cerrarlo al pulsar dejaría la pantalla en
 *    silencio durante la espera, y silencio es exactamente lo que este producto
 *    no puede usar como señal.
 */
export function ResolveTeacherDialog({
  teacher,
  resolution,
  isPending,
  onConfirm,
}: ResolveTeacherDialogProps) {
  const volverRef = useRef<HTMLButtonElement>(null);
  const [abierto, setAbierto] = useState(false);
  const copy = resolutionCopy[resolution];
  const Icono = copy.icon;
  const nombre = fullName(teacher);

  /**
   * Confirma y cierra **en cuanto el servidor responde, falle o no**.
   *
   * Cerrar también cuando falla no es descuido: este diálogo es modal, así que
   * mientras está abierto el resto de la página queda `aria-hidden` y tapada
   * por el fondo. Si se quedara abierto tras un error, el aviso que explica qué
   * pasó estaría detrás — invisible para quien mira y ausente para quien
   * escucha. El resultado, bueno o malo, se cuenta en la página.
   */
  async function confirmar() {
    await onConfirm();
    setAbierto(false);
  }

  return (
    <AlertDialog
      open={abierto}
      // Se bloquea el CIERRE mientras la petición está en vuelo, no la
      // apertura: si el diálogo se cerrara al confirmar, el estado de carga
      // viviría en una fila que ya no se está mirando, y en esta pantalla el
      // silencio no es una señal disponible.
      onOpenChange={(siguiente) => {
        if (isPending && !siguiente) return;
        setAbierto(siguiente);
      }}
    >
      {/* La clase va DENTRO del `render` y no como prop del Trigger: Base UI
          concatena los `className` que recibe, así que el `h-8` por defecto del
          botón sobreviviría junto al `h-11` y ganaría el que la hoja de estilos
          declare después. Pasada al Button, la resuelve `cn()` con
          tailwind-merge, que es quien sabe cuál gana. */}
      <AlertDialogTrigger
        render={
          <Button
            variant={copy.variant === 'destructive' ? 'destructive' : 'default'}
            className="h-11 gap-2 px-4 text-base"
          />
        }
      >
        <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
        {/* El nombre viaja en el nombre accesible pero no en el visible: en una
            tabla, repetirlo en cada botón hace la columna ilegible. Sin él, un
            lector de pantalla oiría doce botones llamados «Aprobar». */}
        <span aria-hidden="true">{copy.trigger}</span>
        <span className="sr-only">
          {copy.trigger} a {nombre}
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent initialFocus={volverRef}>
        <AlertDialogTitle>{copy.dialogTitle(nombre)}</AlertDialogTitle>
        <AlertDialogDescription>{copy.dialogDescription}</AlertDialogDescription>

        <AlertDialogAcciones>
          <AlertDialogClose
            render={<Button variant="outline" ref={volverRef} className="h-11 px-5 text-base" />}
            disabled={isPending}
          >
            Volver
          </AlertDialogClose>

          <Button
            variant={copy.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => void confirmar()}
            disabled={isPending}
            className="h-11 gap-2 px-5 text-base"
          >
            {isPending ? (
              <>
                <LoaderCircle aria-hidden="true" strokeWidth={2} className="size-5 animate-spin" />
                {copy.pending}
              </>
            ) : (
              <>
                <Icono aria-hidden="true" strokeWidth={2} className="size-5" />
                {copy.confirm}
              </>
            )}
          </Button>
        </AlertDialogAcciones>
      </AlertDialogContent>
    </AlertDialog>
  );
}
