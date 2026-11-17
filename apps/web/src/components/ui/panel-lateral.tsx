import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

import { cn } from '@/lib/utils';

/**
 * Panel que entra por la derecha sobre la pantalla, sin perderla de vista. Es un diálogo
 * modal: atrapa el foco, Esc pide cerrar y, al cerrar, el foco vuelve a quien lo abrió.
 */
export const PanelLateral = DialogPrimitive.Root;

export const PanelLateralTitulo = DialogPrimitive.Title;

export const PanelLateralCerrar = DialogPrimitive.Close;

export function PanelLateralContenido({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/40 transition-opacity duration-(--duracion-rapida) data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-background shadow-lg',
          'transition-transform duration-(--duracion-normal) ease-suave data-ending-style:translate-x-full data-starting-style:translate-x-full',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}
