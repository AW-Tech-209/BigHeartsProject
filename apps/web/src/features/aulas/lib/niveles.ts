import { EnglishLevel } from '@academia/types';

/**
 * El nombre de cada nivel, en español y con una ayuda que dice qué significa.
 *
 * La ayuda no es adorno: «Intermedio» no le dice a nadie si su inglés encaja
 * ahí, y elegir mal cuesta una clase entera. La descripción se escribe en
 * términos de lo que la persona puede HACER, que es como se autoevalúa alguien
 * que aprende, no en niveles del Marco Común Europeo.
 */
export const nivelesDeIngles: Record<EnglishLevel, { nombre: string; ayuda: string }> = {
  [EnglishLevel.BEGINNER]: {
    nombre: 'Básico',
    ayuda: 'Para quien empieza: saludos, presentarse, frases cortas.',
  },
  [EnglishLevel.INTERMEDIATE]: {
    nombre: 'Intermedio',
    ayuda: 'Para quien ya sostiene una conversación sencilla del día a día.',
  },
  [EnglishLevel.ADVANCED]: {
    nombre: 'Avanzado',
    ayuda: 'Para quien conversa con soltura y quiere precisión y matices.',
  },
};

/**
 * Duraciones que se ofrecen, en minutos.
 *
 * Es una lista cerrada y no un campo numérico libre a propósito: el servidor
 * acepta cualquier duración positiva, pero un `<select>` de cinco opciones se
 * recorre con el teclado en dos pulsaciones y no admite un `9` de más. Si algún
 * día hace falta una duración fuera de esta lista, se añade aquí — el contrato
 * no cambia.
 */
export const duracionesDisponibles = [30, 45, 60, 90, 120] as const;

/**
 * Las duraciones que caben bajo el tope del servidor
 * (`CLASS_MAX_DURATION_MINUTES`, HU-212, AC6).
 *
 * El tope **sale del entorno**, así que el formulario no puede darlo por
 * sabido: arranca con el valor de fábrica del contrato y, si una respuesta
 * `CLASSROOM_DURATION_INVALID` revela que el servidor aplica otro más bajo, la
 * lista se recorta con este mismo filtro. Recortar la lista es lo que hace que
 * el control «no deje escribir» la duración inválida en vez de limitarse a
 * rechazarla después.
 *
 * Nunca devuelve una lista vacía: si el tope quedara por debajo de la duración
 * más corta que se ofrece, se conserva esa —un `<select>` sin opciones es un
 * formulario que no se puede enviar, y el profesor no tendría forma de saber
 * por qué.
 */
export function duracionesHasta(maximoMinutos: number): number[] {
  const permitidas = duracionesDisponibles.filter((minutos) => minutos <= maximoMinutos);

  return permitidas.length > 0 ? [...permitidas] : [duracionesDisponibles[0]];
}
