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
