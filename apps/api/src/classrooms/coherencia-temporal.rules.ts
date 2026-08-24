/**
 * Las tres reglas de coherencia temporal de un aula (HU-212,
 * `docs/ARQUITECTURA.md` §4.4), como **funciones puras**: solapamiento del
 * profesor consigo mismo, duración máxima y antelación mínima.
 *
 * Viven fuera del servicio a propósito. Son aritmética sobre dos instantes y
 * dos números —no necesitan Prisma, ni configuración, ni saber si la petición
 * era un `POST` o un `PATCH`—, y **es la misma aritmética la que se aplica al
 * crear y al editar**. HU-202 invocará esto desde `editar()` sin escribir
 * lógica nueva; de ahí que el solapamiento se exprese como una comparación
 * entre dos intervalos cualesquiera y no como "la consulta de crear un aula".
 *
 * Aquí no se lanza ninguna excepción: estas funciones dicen **qué pasa**, no
 * **qué responder**. Los códigos y los `details` los pone
 * `classrooms.errors.ts`, y el orden en que se comprueban, el servicio.
 */

const MS_POR_MINUTO = 60_000;

/**
 * Lo mínimo que hace falta para situar un aula en el eje temporal. No es un
 * `Classroom` recortado: es exactamente lo que las tres reglas miran, y por eso
 * lo cumple tanto una fila de la BD como el cuerpo de un `POST` que todavía no
 * existe en ninguna tabla.
 */
export interface IntervaloAula {
  /** Inicio de la clase, en UTC (§4.7). */
  scheduledAt: Date;
  durationMinutes: number;
}

/**
 * Instante en que termina la clase. **Exclusivo**: la clase ya no ocupa este
 * punto, es el primero libre. De ahí sale el borde de {@link seSolapan}.
 */
export function finDelAula({ scheduledAt, durationMinutes }: IntervaloAula): Date {
  return new Date(scheduledAt.getTime() + durationMinutes * MS_POR_MINUTO);
}

/**
 * Dos aulas se solapan si sus intervalos `[inicio, fin)` se cruzan.
 *
 * **El intervalo es cerrado por la izquierda y abierto por la derecha**, igual
 * que la regla del estudiante de `reglas-reservas.md` §4: una clase que termina
 * a las 18:00 y otra que empieza a las 18:00 **no** se solapan (AC2). Las dos
 * comparaciones son estrictas justo por eso — con `<=` en cualquiera de ellas,
 * dos clases consecutivas dejarían de poder existir, que es el horario más
 * normal que puede tener un profesor.
 *
 * Es simétrica: da igual cuál de las dos es la que se está creando.
 */
export function seSolapan(a: IntervaloAula, b: IntervaloAula): boolean {
  return a.scheduledAt < finDelAula(b) && b.scheduledAt < finDelAula(a);
}

/**
 * Si la duración supera el techo configurado (`CLASS_MAX_DURATION_MINUTES`).
 *
 * Estrictamente mayor: una clase que dura **exactamente** el máximo es válida.
 * Un tope que rechazara su propio valor obligaría a explicar por qué 240 no son
 * 240.
 */
export function excedeLaDuracionMaxima(durationMinutes: number, maximoMinutos: number): boolean {
  return durationMinutes > maximoMinutos;
}

/**
 * Minutos que faltan hasta el inicio de la clase, **medidos contra el reloj que
 * se le pase** — que en producción es siempre el del servidor (§4.7). Nunca el
 * del navegador del profesor: sería el único número de esta HU que decide un
 * cliente.
 *
 * Trunca hacia abajo, de modo que 59 minutos y 59 segundos son 59 minutos y no
 * 60: la regla se cumple o no se cumple, y redondear hacia arriba dejaría pasar
 * un caso que está por debajo del mínimo.
 */
export function minutosDeAntelacion(scheduledAt: Date, ahora: Date): number {
  return Math.floor((scheduledAt.getTime() - ahora.getTime()) / MS_POR_MINUTO);
}

/**
 * Si el aula empieza antes de la antelación mínima
 * (`CLASS_MIN_LEAD_MINUTES`).
 *
 * **Ser cierto no significa rechazar la petición**: es la única de las tres que
 * el profesor puede confirmar (AC7). Quien decide eso es el servicio, mirando
 * `confirmarPocaAntelacion`.
 */
export function tienePocaAntelacion(
  scheduledAt: Date,
  ahora: Date,
  minimoMinutos: number,
): boolean {
  return minutosDeAntelacion(scheduledAt, ahora) < minimoMinutos;
}
