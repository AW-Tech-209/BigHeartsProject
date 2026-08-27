import { type User, UserRole } from '@academia/types';

/**
 * **El único sitio del frontend que decide el ROL de quien reserva** (HU-208,
 * T3 y AC4; `ARQUITECTURA.md` §4.8, regla 1): «quien mira es un estudiante».
 *
 * Las otras condiciones —cupo, aula cancelada o empezada, reserva ya
 * existente— **no se duplican aquí**: ya tienen una única fuente propia,
 * `derivarEstadoAula()` (§7.3), y `<AccionReservarAula>` (HU-301) compone las
 * dos decisiones en vez de repetir la de `estado-aula.ts` en un segundo sitio.
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
