import { type User, UserRole } from '@academia/types';

/**
 * **El único sitio del frontend que decide si se ofrece reservar** (HU-208, T3
 * y AC4; `ARQUITECTURA.md` §4.8, regla 1).
 *
 * Hoy la regla completa es «quien mira es un estudiante». Es poco, y por eso
 * mismo merece una función con nombre en vez de un `user?.role === STUDENT`
 * repetido por las pantallas: **HU-301 extiende ESTA función**, no cada sitio
 * que ofrece el botón. Cuando llegue, aquí se le añaden las condiciones que
 * hoy no tienen datos —que quede cupo, que el aula no esté cancelada ni
 * empezada, que el estudiante no tenga ya su reserva—. Mismo criterio que
 * `revelarElEnlace()` en el servicio, que HU-303 amplía en su sitio en vez de
 * escribir una segunda condición en otro.
 *
 * **Esto no es la autorización.** El permiso de verdad lo decide `POST
 * /bookings` con `@Roles(STUDENT)` (§4.8, regla 1); esta función solo evita
 * ofrecer lo que acabaría en un 403. Que el elemento **no exista** en el DOM
 * —en vez de existir deshabilitado— es requisito de esa misma regla y del
 * skill `bighearts-ui`: deshabilitar sin explicar está prohibido, y a un
 * profesor no hay nada que explicarle sobre por qué no reserva su propia clase.
 *
 * Sin sesión, `false`: no hay a quién ofrecerle nada.
 */
export function puedeReservar(user: User | null | undefined): boolean {
  return user?.role === UserRole.STUDENT;
}
