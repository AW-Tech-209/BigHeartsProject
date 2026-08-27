/**
 * Estado de acceso al enlace de la videollamada desde la perspectiva de quien
 * pregunta (HU-304, `ARQUITECTURA.md` §4.1). El servidor ya decidió si el
 * enlace viaja; este valor es solo la ETIQUETA de esa decisión, para que el
 * frontend pinte sin recalcular la regla:
 *
 *  - `aun-no` — hay reserva `CONFIRMED`, pero la ventana no se ha abierto.
 *  - `abierto` — el enlace viaja (dueño siempre, o estudiante dentro de la ventana).
 *  - `sin-acceso` — aula cancelada, sin reserva propia, o ventana ya cerrada.
 */
export type EstadoAccesoEnlace = 'aun-no' | 'abierto' | 'sin-acceso';
