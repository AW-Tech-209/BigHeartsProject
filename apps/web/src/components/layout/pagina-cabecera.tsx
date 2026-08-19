import type { ReactNode } from 'react';

import { usePageTitle } from '@/hooks/use-page-title';
import { cn } from '@/lib/utils';

type PaginaCabeceraProps = {
  /** El `<h1>` de la página. Solo puede haber uno. */
  titulo: string;
  /**
   * Título del documento, si tiene que diferir del `<h1>`. Por defecto, el mismo.
   * Es el texto que aparece en la pestaña del navegador y en el historial.
   */
  tituloDocumento?: string;
  /** Una línea que sitúa al usuario: qué es esta pantalla y para qué sirve. */
  contexto?: ReactNode;
  /** La acción principal de la pantalla, si la hay. Solo una. */
  accion?: ReactNode;
  className?: string;
};

/**
 * La cabecera con la que empieza toda pantalla.
 *
 * Además de maquetar, **hace el trabajo de accesibilidad del cambio de ruta**:
 * una navegación en una SPA es silenciosa —el documento no se recarga, el lector
 * de pantalla no dice nada—, así que aquí se pone el `document.title` y se lleva
 * el foco al `<h1>`. Ese es todo el motivo de que llame a `usePageTitle`: si
 * cada página lo cableara por su cuenta, la que se olvidara dejaría a quien
 * navega con lector sin saber que cambió de pantalla.
 *
 * De ahí se sigue la regla: **una `<PaginaCabecera>` por página**, siempre, y
 * ningún otro `<h1>`.
 */
export function PaginaCabecera({
  titulo,
  tituloDocumento,
  contexto,
  accion,
  className,
}: PaginaCabeceraProps) {
  const headingRef = usePageTitle(tituloDocumento ?? titulo);

  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 space-y-2">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-medium tracking-tight text-balance outline-none sm:text-3xl"
        >
          {titulo}
        </h1>
        {contexto && <p className="max-w-[46ch] text-base text-muted-foreground">{contexto}</p>}
      </div>

      {accion && <div className="shrink-0">{accion}</div>}
    </header>
  );
}
