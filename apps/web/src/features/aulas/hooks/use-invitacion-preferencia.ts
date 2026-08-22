import { useState } from 'react';

/** Prefijo de la clave de `localStorage`, con el id del usuario detrás. */
const CLAVE = 'bighearts:invitacion-preferencia:';

/**
 * Recuerda si el estudiante ya cerró la invitación a declarar su preferencia
 * de comunicación (HU-211, T14/AC6: "una sola vez, sin insistir").
 *
 * `localStorage` y no el store de sesión ni el servidor: es una preferencia
 * de ESTE navegador sobre si volver a ver un aviso, no un dato de la cuenta —
 * no hay endpoint para "ya me lo dijeron" y no debería inventarse uno solo
 * para esto.
 */
export function useInvitacionPreferencia(userId: string) {
  const clave = `${CLAVE}${userId}`;

  const [cerrada, setCerrada] = useState(() => {
    try {
      return localStorage.getItem(clave) === '1';
    } catch {
      return false;
    }
  });

  function cerrar() {
    setCerrada(true);
    try {
      localStorage.setItem(clave, '1');
    } catch {
      // Si `localStorage` no está disponible (modo privado, cuota agotada),
      // la invitación vuelve a verse en la próxima visita — no es ideal, pero
      // no es motivo para romper la pantalla ni para insistir en esta.
    }
  }

  return { cerrada, cerrar };
}
