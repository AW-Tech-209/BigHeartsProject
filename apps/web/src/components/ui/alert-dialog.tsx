import { AlertDialog as AlertDialogPrimitive } from '@base-ui/react/alert-dialog';
import type { ComponentPropsWithoutRef } from 'react';

import { cn } from '@/lib/utils';

/**
 * Diálogo de confirmación para acciones que se pueden perder: cancelar una
 * reserva, cancelar un aula, rechazar a un profesor.
 *
 * Es `AlertDialog` y no `Dialog` porque no se cierra al pulsar fuera ni con
 * Escape sin decidir: una pulsación accidental no debe parecer una respuesta.
 *
 * **La forma que exige el skill** (`patrones-dominio.md`, «Acciones destructivas»):
 *
 * ```tsx
 * const volverRef = useRef<HTMLButtonElement>(null);
 *
 * <AlertDialog>
 *   <AlertDialogTrigger render={<Button variant="destructive" />}>
 *     Cancelar mi reserva
 *   </AlertDialogTrigger>
 *   <AlertDialogContent initialFocus={volverRef}>
 *     <AlertDialogTitle>¿Cancelar tu reserva de «Inglés básico — martes 6 p.m.»?</AlertDialogTitle>
 *     <AlertDialogDescription>
 *       Tu lugar quedará disponible para otro estudiante.
 *     </AlertDialogDescription>
 *     <AlertDialogAcciones>
 *       <AlertDialogClose render={<Button variant="outline" ref={volverRef} />}>Volver</AlertDialogClose>
 *       <Button variant="destructive" onClick={cancelar}>Cancelar mi reserva</Button>
 *     </AlertDialogAcciones>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 *
 * Tres reglas que no son opcionales:
 *  - El título **nombra el objeto**, no pregunta «¿Estás seguro?».
 *  - La descripción dice **la consecuencia**, en una frase.
 *  - Los botones llevan **verbos**, nunca Sí/No, y el foco inicial va al botón
 *    seguro (`initialFocus`), no al destructivo.
 */
export const AlertDialog = AlertDialogPrimitive.Root;

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export const AlertDialogClose = AlertDialogPrimitive.Close;

/**
 * Portal + fondo + panel, en una sola pieza.
 *
 * Van juntos porque un `Popup` sin `Portal` queda atrapado en el
 * `overflow: hidden` de cualquier tarjeta ancestra, y el bug resultante —un
 * diálogo recortado a la mitad— aparece lejos de donde se escribió.
 */
export function AlertDialogContent({
  className,
  children,
  ...props
}: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-(--duracion-rapida) data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <AlertDialogPrimitive.Popup
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
          'space-y-4 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-lg',
          'transition-opacity duration-(--duracion-rapida) data-ending-style:opacity-0 data-starting-style:opacity-0',
          className,
        )}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Popup>
    </AlertDialogPrimitive.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      className={cn('text-xl font-medium text-balance text-foreground', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      className={cn('max-w-[65ch] text-base text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * Fila de botones. En móvil se apilan y el seguro queda **arriba**: es el que
 * cae bajo el pulgar, y aquí el error caro es confirmar sin querer.
 */
export function AlertDialogAcciones({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}
