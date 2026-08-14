import { useEffect, useRef } from 'react';

/**
 * Cablea el patrón obligatorio de cambio de ruta (§7.4 de la guía de UI).
 *
 * Una navegación en una SPA es silenciosa: el lector de pantalla no anuncia
 * nada porque el documento nunca se recarga. Por eso en cada página hay que
 * hacer dos cosas a mano: poner el `document.title` y mover el foco al `<h1>`.
 *
 * Devuelve la ref que hay que poner en el `<h1>`, que además necesita
 * `tabIndex={-1}` para poder recibir el foco por código.
 */
export function usePageTitle(title: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${title} · BigHearts`;
    headingRef.current?.focus();
  }, [title]);

  return headingRef;
}
