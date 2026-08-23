import type { Classroom } from '@academia/types';

type AccionReservarAulaProps = {
  aula: Classroom;
  /** Lo que decidió `puedeReservar()`. Ya resuelto: aquí no se vuelve a razonar sobre el rol. */
  puedeReservar: boolean;
};

/**
 * El hueco donde **HU-301 pone `Reservar mi cupo`** en la tarjeta del catálogo.
 *
 * Hoy devuelve `null` para todos los roles, incluido el estudiante, y es una
 * decisión, no un olvido — la misma que tomó `<AccionesDeAula>` con los botones
 * de HU-202. `POST /bookings` no existe hasta el Sprint 3: pintar el botón
 * ahora dejaría al estudiante pulsando algo que no puede funcionar, y
 * `app/router.tsx` documenta esa trampa —«un enlace visible que cae en un 404
 * enseña a desconfiar de la navegación»—. Pintarlo deshabilitado tampoco vale:
 * el skill `bighearts-ui` prohíbe deshabilitar sin explicar.
 *
 * **Existe ahora para que la regla de quién ve la acción llegue antes que la
 * acción** (HU-208, T3). Cuando HU-301 lo rellene, la condición ya está puesta
 * y verificada por rol: solo tiene que devolver el botón dentro del `if`, sin
 * volver a razonar sobre quién puede reservar ni tocar la página que lo monta.
 *
 * El `if` se escribe igual: `if (!puedeReservar) return null`. Lo que sigue es
 * el botón, nunca una versión deshabilitada de él (§4.8, regla 1: para quien no
 * puede reservar el elemento **no se pinta**).
 */
export function AccionReservarAula({
  puedeReservar: _puede,
  aula: _aula,
}: AccionReservarAulaProps) {
  return null;
}
