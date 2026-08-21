import type { ClassroomDetail } from '@academia/types';

type AccionesDeAulaProps = {
  aula: ClassroomDetail;
  /** `true` si quien mira es el profesor dueño del aula. */
  esDueno: boolean;
};

/**
 * Las acciones de gestión del aula: **el hueco donde HU-202 pone `Editar clase`
 * y `Cancelar clase`**.
 *
 * Hoy devuelve `null` para todos los roles, y es una decisión, no un olvido.
 * HU-202 —que trae `PATCH /classrooms/:id`, la cancelación y su `<AlertDialog>`—
 * está pendiente: no existe ni el endpoint ni la ruta de edición. Pintar los
 * botones ahora dejaría al profesor pulsando algo que cae en un 404, que es
 * exactamente lo que `app/router.tsx` documenta como prohibido —«un enlace
 * visible que cae en un 404 enseña a desconfiar de la navegación»— y lo mismo
 * que llevó a HU-207 a dejar su AC9 sin cumplir. Pintarlos deshabilitados
 * tampoco vale: el skill `bighearts-ui` prohíbe deshabilitar sin explicar, y
 * aquí no hay nada que explicarle al profesor.
 *
 * **Existe como componente precisamente para que HU-202 tenga un solo sitio que
 * tocar.** Recibe ya resuelto lo que necesita para decidir —el aula y si quien
 * mira es su dueño—, así que esa HU solo tiene que devolver los dos botones en
 * vez de `null`, sin volver a razonar sobre la pantalla ni tocar la página.
 *
 * Cuando llegue, la condición es `esDueno && aula.status !== CANCELLED`: sobre
 * un aula ya cancelada no queda nada que gestionar (AC4 pide el detalle **sin
 * acciones**). Y quien no es el dueño no ve ninguna, nunca (AC5) — el permiso
 * de verdad lo decide el servidor; esto solo evita ofrecer lo que acabaría en
 * un 403.
 */
export function AccionesDeAula(_props: AccionesDeAulaProps) {
  return null;
}
