import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/stores/auth-store';
import { useAvisoAperturaStore } from '@/stores/aviso-apertura-store';

/**
 * Cablea el patrón obligatorio de cambio de ruta (§7.4 de la guía de UI).
 *
 * Una navegación en una SPA es silenciosa: el lector de pantalla no anuncia
 * nada porque el documento nunca se recarga. Por eso en cada página hay que
 * hacer dos cosas a mano: poner el `document.title` y mover el foco al `<h1>`.
 *
 * Con una clase recién abierta, el título de la pestaña lleva el aviso delante
 * en cualquier pantalla: es lo único que se ve con la plataforma en otra pestaña.
 *
 * Devuelve la ref que hay que poner en el `<h1>`, que además necesita
 * `tabIndex={-1}` para poder recibir el foco por código.
 */
export function usePageTitle(title: string) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const tituloAviso = useAvisoAperturaStore((s) => s.aviso?.titulo);
  const conSesion = useAuthStore((s) => s.status === 'authenticated');

  useEffect(() => {
    document.title =
      conSesion && tituloAviso ? `● Ya puedes entrar · ${tituloAviso}` : `${title} · BigHearts`;
  }, [title, tituloAviso, conSesion]);

  // Aparte del título: un aviso nuevo no puede quitarle el foco a quien lee.
  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return headingRef;
}
